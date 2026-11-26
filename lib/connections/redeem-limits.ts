/**
 * Limits on redeeming parent → child invite codes, per account, per device and per IP.
 *
 * Every failed attempt (malformed, unknown, expired, used or revoked code) is written to
 * security_events as `invite_redeem_failure`; the limits are computed from those rows,
 * so they hold across replicas and restarts. Within 24 hours a key gets `free` failures;
 * the failure that reaches `free` locks it for 15 minutes, and each further failure after
 * the lock ends doubles the lock (30 min, 1 h, 2 h, …, at most 24 h). A success does not
 * reset anything: anyone can create a parent account and redeem their own codes.
 *
 * While a key is locked, attempts are refused before the code is looked at, and they do
 * not extend the lock (a child tapping "retry" should not lock themselves out for a day).
 * They are still counted in action_log as `rate_limited` (withActionLog).
 *
 * Only one redeem per key runs at a time (pg_try_advisory_xact_lock); a parallel burst
 * gets "busy" instead of slipping past the count before the first failure is written.
 *
 * The device key comes from the app's install id (X-Device-ID). The client chooses it, so
 * it only slows a careless script; the account and IP limits are the real bound. Web
 * requests have no device key.
 */
import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { securityEvents } from '@/drizzle/schema/security'
import type { Database } from '@/lib/db/client'

export const REDEEM_WINDOW_MS = 24 * 60 * 60_000
export const BASE_LOCK_MS = 15 * 60_000
export const MAX_LOCK_MS = 24 * 60 * 60_000

/** Failures allowed per key in the window before the first lock. IPs are shared (schools, CGNAT). */
export const FREE_FAILURES = { account: 5, device: 5, ip: 30 } as const

export type LimitScope = keyof typeof FREE_FAILURES

export type FailureReason = 'invalid_format' | 'not_found' | 'expired' | 'used' | 'revoked'

export type RedeemKeys = { userId: string; ip: string; deviceKey: string | null }

export type FailureStats = Record<LimitScope, { count: number; last: Date | null }>

/** Pseudonymous device key; the install id itself is not stored with the failure. */
export function deviceKeyOf(installId: string | null): string | null {
  if (!installId) return null
  return createHash('sha256')
    .update('bonifatus-invite-device:' + installId)
    .digest('hex')
    .slice(0, 32)
}

/** How long a key stays locked after its `count`-th failure in the window. */
export function lockDurationMs(count: number, free: number): number {
  if (count < free) return 0
  return Math.min(BASE_LOCK_MS * 2 ** (count - free), MAX_LOCK_MS)
}

/**
 * The lock in force now, if any: the scope whose lock ends last and when it ends.
 * Pure, so the backoff can be tested without a database.
 */
export function activeLock(
  stats: FailureStats,
  now: number
): { scope: LimitScope; until: Date } | null {
  let worst: { scope: LimitScope; until: Date } | null = null
  for (const scope of Object.keys(FREE_FAILURES) as LimitScope[]) {
    const { count, last } = stats[scope]
    if (!last) continue
    const until = last.getTime() + lockDurationMs(count, FREE_FAILURES[scope])
    if (until > now && (!worst || until > worst.until.getTime())) {
      worst = { scope, until: new Date(until) }
    }
  }
  return worst
}

/** Scopes whose lock starts with the failure just recorded (count went from n-1 to n). */
export function scopesLockedBy(stats: FailureStats): LimitScope[] {
  return (Object.keys(FREE_FAILURES) as LimitScope[]).filter(
    (s) => stats[s].count + 1 >= FREE_FAILURES[s]
  )
}

/** Advisory-lock names for one redeem, sorted so concurrent requests cannot deadlock. */
export function lockNames(keys: RedeemKeys): string[] {
  return [
    `invite-redeem:account:${keys.userId}`,
    `invite-redeem:ip:${keys.ip}`,
    ...(keys.deviceKey ? [`invite-redeem:device:${keys.deviceKey}`] : []),
  ].sort()
}

/** The redeem transaction (or the db itself in tests). */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0]
type Executor = Pick<Tx, 'execute'>

/** Takes every advisory lock or none; false means another redeem for one of the keys is running. */
export async function tryLockKeys(tx: Executor, keys: RedeemKeys): Promise<boolean> {
  for (const name of lockNames(keys)) {
    const { rows } = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(hashtext(${name})) AS ok`
    )
    // Locks already taken are released when the transaction ends.
    if (!rows[0]?.ok) return false
  }
  return true
}

/**
 * Failures per key in the window. created_at is a timestamp without time zone written by
 * now(), so ages are computed in SQL against now() rather than parsed in Node, where the
 * process time zone could differ from the database session's.
 */
export async function readFailureStats(
  tx: Executor,
  keys: RedeemKeys,
  now = Date.now()
): Promise<FailureStats> {
  const windowSec = REDEEM_WINDOW_MS / 1000
  const device = keys.deviceKey ?? ''
  const age = (cond: ReturnType<typeof sql>) =>
    sql`extract(epoch FROM now() - max(${securityEvents.createdAt}) FILTER (WHERE ${cond}))::float8`
  const isAccount = sql`${securityEvents.userId} = ${keys.userId}`
  const isIp = sql`${securityEvents.ipAddress} = ${keys.ip}`
  const isDevice = sql`${securityEvents.eventMetadata}->>'deviceKey' = ${device}`
  const { rows } = await tx.execute(sql`
    SELECT
      count(*) FILTER (WHERE ${isAccount})::int AS account_n, ${age(isAccount)} AS account_age,
      count(*) FILTER (WHERE ${isIp})::int      AS ip_n,      ${age(isIp)}      AS ip_age,
      count(*) FILTER (WHERE ${isDevice})::int  AS device_n,  ${age(isDevice)}  AS device_age
    FROM ${securityEvents}
    WHERE ${securityEvents.eventType} = 'invite_redeem_failure'
      AND ${securityEvents.createdAt} > now() - make_interval(secs => ${windowSec})
      AND (${isAccount} OR ${isIp} OR ${isDevice})`)
  const r: Record<string, unknown> = rows[0] ?? {}
  const last = (ageSec: unknown) =>
    ageSec === null || ageSec === undefined ? null : new Date(now - Number(ageSec) * 1000)
  return {
    account: { count: Number(r.account_n ?? 0), last: last(r.account_age) },
    ip: { count: Number(r.ip_n ?? 0), last: last(r.ip_age) },
    device: keys.deviceKey
      ? { count: Number(r.device_n ?? 0), last: last(r.device_age) }
      : { count: 0, last: null },
  }
}

/** One failed attempt, inside the redeem transaction so the advisory locks cover it. */
export async function recordFailure(
  tx: Pick<Tx, 'insert'>,
  keys: RedeemKeys,
  detail: {
    reason: FailureReason
    source: string
    userAgent: string | null
    inviteId?: string
    lockStarts: LimitScope[]
  }
) {
  await tx.insert(securityEvents).values({
    eventType: 'invite_redeem_failure',
    severity: detail.lockStarts.length ? 'warning' : 'info',
    userId: keys.userId,
    ipAddress: keys.ip,
    userAgent: detail.userAgent,
    eventMetadata: {
      reason: detail.reason,
      source: detail.source,
      ...(keys.deviceKey ? { deviceKey: keys.deviceKey } : {}),
      ...(detail.inviteId ? { inviteId: detail.inviteId } : {}),
    },
  })
  if (detail.lockStarts.length) {
    await tx.insert(securityEvents).values({
      eventType: 'account_lockout',
      severity: 'warning',
      userId: keys.userId,
      ipAddress: keys.ip,
      userAgent: detail.userAgent,
      eventMetadata: {
        scope: 'invite_redeem',
        locked: detail.lockStarts,
        ...(keys.deviceKey ? { deviceKey: keys.deviceKey } : {}),
      },
    })
  }
}
