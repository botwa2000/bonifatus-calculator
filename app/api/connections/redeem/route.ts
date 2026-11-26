import { NextRequest, NextResponse } from 'next/server'
import { and, eq, gt } from 'drizzle-orm'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { parentChildInvites, parentChildRelationships } from '@/drizzle/schema/relationships'
import { getClientIp } from '@/lib/auth/turnstile'
import { normalizeInviteCode } from '@/lib/connections/invite-code'
import {
  activeLock,
  deviceKeyOf,
  readFailureStats,
  recordFailure,
  scopesLockedBy,
  tryLockKeys,
  type FailureReason,
  type RedeemKeys,
  type Tx,
} from '@/lib/connections/redeem-limits'
import { nativeInstallId, platformOf } from '@/lib/stats/usage'
import { noteAction, withActionLog } from '@/lib/stats/with-action-log'

/**
 * A child redeems a parent's invite code. Limits and logging: lib/connections/redeem-limits.ts.
 *
 * Answers carry `errorCode` for the apps to show in the child's language:
 *   invalid        no such code (or not a code at all)           404
 *   used           someone already redeemed it                   409
 *   revoked        the parent cancelled it                       410
 *   expired        older than 7 days                             410
 *   rate_limited   too many failures, `retryAfterSeconds`        429
 *   busy           another redeem for this account/device/IP is running   429
 */

type Outcome =
  | { kind: 'ok'; relationshipId: string }
  | { kind: 'failed'; reason: FailureReason }
  | { kind: 'locked'; until: Date }
  | { kind: 'busy' }

const FAILURE_ANSWER: Record<FailureReason, { errorCode: string; status: number; error: string }> =
  {
    invalid_format: { errorCode: 'invalid', status: 404, error: 'Invite code not found' },
    not_found: { errorCode: 'invalid', status: 404, error: 'Invite code not found' },
    used: { errorCode: 'used', status: 409, error: 'This invite code was already used' },
    revoked: { errorCode: 'revoked', status: 410, error: 'This invite code was cancelled' },
    expired: {
      errorCode: 'expired',
      status: 410,
      error: 'Invite expired. Ask your parent to generate a new code.',
    },
  }

/** Links parent and child, reusing an earlier link row between the two if there is one. */
async function link(tx: Tx, parentId: string, childId: string, invitedAt: Date, now: Date) {
  const [existing] = await tx
    .select({ id: parentChildRelationships.id })
    .from(parentChildRelationships)
    .where(
      and(
        eq(parentChildRelationships.parentId, parentId),
        eq(parentChildRelationships.childId, childId)
      )
    )
    .limit(1)
  if (existing) {
    await tx
      .update(parentChildRelationships)
      .set({ invitationStatus: 'accepted', respondedAt: now, updatedAt: now })
      .where(eq(parentChildRelationships.id, existing.id))
    return existing.id
  }
  const id = crypto.randomUUID()
  await tx.insert(parentChildRelationships).values({
    id,
    parentId,
    childId,
    invitedBy: parentId,
    invitationStatus: 'accepted',
    invitedAt,
    respondedAt: now,
  })
  return id
}

async function redeem(
  tx: Tx,
  keys: RedeemKeys,
  rawCode: unknown,
  ctx: { source: string; userAgent: string | null }
): Promise<Outcome> {
  if (!(await tryLockKeys(tx, keys))) return { kind: 'busy' }

  const stats = await readFailureStats(tx, keys)
  const lock = activeLock(stats, Date.now())
  if (lock) return { kind: 'locked', until: lock.until }

  const fail = async (reason: FailureReason, inviteId?: string): Promise<Outcome> => {
    const lockStarts = scopesLockedBy(stats)
    await recordFailure(tx, keys, { reason, inviteId, lockStarts, ...ctx })
    console.warn(
      `[invite-redeem] failed: ${reason} user=${keys.userId} ip=${keys.ip}` +
        (lockStarts.length ? ` lock=${lockStarts.join(',')}` : '')
    )
    return { kind: 'failed', reason }
  }

  const code = normalizeInviteCode(rawCode)
  if (!code) return fail('invalid_format')

  const now = new Date()
  // Claiming is one conditional UPDATE, so two children can never both redeem one code.
  const [claimed] = await tx
    .update(parentChildInvites)
    .set({ status: 'accepted', childId: keys.userId, acceptedAt: now })
    .where(
      and(
        eq(parentChildInvites.code, code),
        eq(parentChildInvites.status, 'pending'),
        gt(parentChildInvites.expiresAt, now)
      )
    )
    .returning()

  if (claimed) {
    const relationshipId = await link(tx, claimed.parentId, keys.userId, claimed.createdAt, now)
    return { kind: 'ok', relationshipId }
  }

  const [invite] = await tx
    .select()
    .from(parentChildInvites)
    .where(eq(parentChildInvites.code, code))
    .limit(1)
  if (!invite) return fail('not_found')

  if (invite.status === 'accepted') {
    // The same child sending the same code again (a retry after a dropped connection).
    if (invite.childId === keys.userId) {
      const [rel] = await tx
        .select({ id: parentChildRelationships.id })
        .from(parentChildRelationships)
        .where(
          and(
            eq(parentChildRelationships.parentId, invite.parentId),
            eq(parentChildRelationships.childId, keys.userId),
            eq(parentChildRelationships.invitationStatus, 'accepted')
          )
        )
        .limit(1)
      if (rel) return { kind: 'ok', relationshipId: rel.id }
    }
    return fail('used', invite.id)
  }
  if (invite.status === 'cancelled') return fail('revoked', invite.id)
  if (invite.status === 'pending') {
    await tx
      .update(parentChildInvites)
      .set({ status: 'expired' })
      .where(eq(parentChildInvites.id, invite.id))
  }
  return fail('expired', invite.id)
}

async function handlePost(request: NextRequest) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()
  if (!profile || profile.role !== 'child') {
    return NextResponse.json({ success: false, error: 'Only children can redeem' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const keys: RedeemKeys = {
    userId: profile.id,
    ip: getClientIp(request.headers) || '0.0.0.0',
    deviceKey: deviceKeyOf(nativeInstallId(request.headers)),
  }
  const ctx = {
    source: platformOf(request.headers),
    userAgent: request.headers.get('user-agent'),
  }

  let outcome: Outcome
  try {
    outcome = await db.transaction((tx) => redeem(tx, keys, body?.code, ctx))
  } catch (error) {
    console.error('Redeem error:', error)
    return NextResponse.json({ success: false, error: 'Failed to redeem code' }, { status: 500 })
  }

  switch (outcome.kind) {
    case 'ok':
      return NextResponse.json({ success: true, relationshipId: outcome.relationshipId })
    case 'failed': {
      const a = FAILURE_ANSWER[outcome.reason]
      return noteAction(
        NextResponse.json(
          { success: false, errorCode: a.errorCode, error: a.error },
          { status: a.status }
        ),
        { reason: outcome.reason }
      )
    }
    case 'locked': {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((outcome.until.getTime() - Date.now()) / 1000)
      )
      return noteAction(
        NextResponse.json(
          {
            success: false,
            errorCode: 'rate_limited',
            error: 'Too many attempts. Please try again later.',
            retryAfterSeconds,
          },
          { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
        ),
        { reason: 'locked' }
      )
    }
    case 'busy':
      return noteAction(
        NextResponse.json(
          {
            success: false,
            errorCode: 'busy',
            error: 'Please try again in a moment.',
            retryAfterSeconds: 2,
          },
          { status: 429, headers: { 'Retry-After': '2' } }
        ),
        { reason: 'busy' }
      )
  }
}

export const POST = withActionLog('invite_redeem', handlePost, {
  resultId: (b) => b.relationshipId,
})
