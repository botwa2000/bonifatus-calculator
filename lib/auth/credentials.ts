/**
 * Email + password sign-in shared by the mobile API and the web (NextAuth) login.
 *
 * Anti-enumeration contract: a caller must not be able to tell whether an email
 * has an account. Every failure (no account, account without a password, wrong
 * password, too many attempts) produces the same answer, and every attempt costs
 * one bcrypt comparison, so response time does not give it away either.
 * The real reason is only written to security_events for our own analysis.
 */
import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import { and, count, eq, gt, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { securityEvents } from '@/drizzle/schema/security'
import { logSecurityEvent } from '@/lib/db/queries/security'

/** Cost-12 bcrypt hash of 32 random bytes nobody kept: same work factor as real hashes. */
const DUMMY_HASH = '$2b$12$dwygW7e8oNdpQ6QazlKJGu78/1i88vxxs/xLbAVfBtz/E3X06ioFq'

const WINDOW_MS = 15 * 60_000
/** Failed attempts allowed per IP, and separately per email address, in the window. */
export const MAX_FAILURES = 10

/** Compares against a real hash, or the dummy one, so both paths take the same time. */
export async function checkPassword(password: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(password, hash || DUMMY_HASH)
  return ok && !!hash
}

/** Pseudonymous key for per-address throttling; the address itself is never stored. */
export function emailKey(email: string) {
  return createHash('sha256')
    .update('bonifatus-login:' + email.trim().toLowerCase())
    .digest('hex')
    .slice(0, 32)
}

export type FailureReason = 'user_not_found' | 'no_password' | 'wrong_password'

export type PasswordSignIn =
  | { status: 'ok'; user: typeof users.$inferSelect }
  | { status: 'unverified'; user: typeof users.$inferSelect }
  | { status: 'invalid' }
  | { status: 'rate_limited' }

async function recentFailures(where: SQL) {
  const [row] = await db
    .select({ n: count() })
    .from(securityEvents)
    .where(
      and(
        where,
        eq(securityEvents.eventType, 'login_failure'),
        gt(securityEvents.createdAt, new Date(Date.now() - WINDOW_MS))
      )
    )
  return row?.n ?? 0
}

export async function passwordSignIn(
  rawEmail: string,
  password: string,
  ctx: { ip: string; userAgent: string | null; source: 'mobile' | 'web' }
): Promise<PasswordSignIn> {
  const email = rawEmail.trim().toLowerCase()
  const key = emailKey(email)

  // Throttle by IP and by address. The address limit applies whether or not an
  // account exists, so "too many attempts" reveals nothing either.
  const [byIp, byEmail] = await Promise.all([
    recentFailures(eq(securityEvents.ipAddress, ctx.ip)),
    recentFailures(sql`${securityEvents.eventMetadata}->>'emailKey' = ${key}`),
  ])
  if (byIp >= MAX_FAILURES || byEmail >= MAX_FAILURES) return { status: 'rate_limited' }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const ok = await checkPassword(password, user?.password)
  if (user && ok)
    return user.emailVerified ? { status: 'ok', user } : { status: 'unverified', user }

  const reason: FailureReason = !user
    ? 'user_not_found'
    : !user.password
      ? 'no_password'
      : 'wrong_password'
  await logSecurityEvent({
    eventType: 'login_failure',
    severity: 'warning',
    userId: user?.id ?? null,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
    metadata: { reason, source: ctx.source, emailKey: key },
  }).catch((err) => console.error('[auth] failed to log login failure:', (err as Error).message))
  return { status: 'invalid' }
}
