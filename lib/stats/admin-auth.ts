/**
 * Auth for the confidential /admin/stats dashboard and its JSON API.
 *
 * Stateless email-OTP login, independent of NextAuth: the pending code lives in
 * a short-lived HttpOnly cookie as "EXP.HMAC(code, exp)", the session as
 * "EXP.HMAC(exp)". Its HMAC key is derived from AUTH_SECRET under a fixed
 * label, so a NextAuth token can never validate here and vice versa. Cookies
 * are HttpOnly + SameSite=Strict + Secure (on https), scoped to /admin/stats
 * and /api/admin/usage-stats. Turnstile guards the send step; sends and wrong
 * codes are rate-limited per IP in the database (survives restarts/replicas).
 * Scripts use X-Admin-Key (STATS_ADMIN_KEY).
 */
import crypto from 'node:crypto'
import { pool } from '@/lib/db/client'

// Allow-list lives only in the server secret STATS_ADMIN_EMAILS (comma-separated),
// never in the code, the client bundle or any response. Unset → nobody can sign in.
// Compared as SHA-256 digests so the plain addresses are not kept around in memory.
const digest = (email: string) =>
  crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex')

let allowed: { raw: string; set: Set<string> } | null = null
function allowedDigests(): Set<string> {
  const raw = process.env.STATS_ADMIN_EMAILS ?? ''
  if (allowed?.raw !== raw) {
    allowed = {
      raw,
      set: new Set(
        raw
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
          .map(digest)
      ),
    }
  }
  return allowed.set
}

const SESSION_COOKIE = 'bstats_sess'
const OTP_COOKIE = 'bstats_otp'
const SESSION_TTL_SEC = 12 * 3600
const OTP_TTL_SEC = 10 * 60
const SEND_WINDOW_MS = 60 * 60 * 1000
const SEND_MAX = 3 // OTP emails per hour per IP
const VERIFY_WINDOW_MS = 15 * 60 * 1000
const VERIFY_MAX = 5 // wrong codes per 15 min per IP

function key(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('[admin-auth] AUTH_SECRET not set')
  return crypto.createHmac('sha256', s).update('bonifatus-stats-admin-v1').digest('base64')
}

const hmac = (data: string) => crypto.createHmac('sha256', key()).update(data).digest('base64url')

function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const nowSec = () => Math.floor(Date.now() / 1000)

export function isAllowedEmail(email: string): boolean {
  if (!email.includes('@')) return false
  return allowedDigests().has(digest(email))
}

export function generateOtp(): { code: string; state: string } {
  const code = String(crypto.randomInt(100000, 1000000))
  const exp = nowSec() + OTP_TTL_SEC
  return { code, state: `${exp}.${hmac(`otp:${code}:${exp}`)}` }
}

export function validateOtp(submitted: string, state: string | null): boolean {
  if (!submitted || !state) return false
  const dot = state.indexOf('.')
  if (dot < 1) return false
  const exp = state.slice(0, dot)
  if (parseInt(exp, 10) < nowSec()) return false
  const code = submitted.replace(/\D/g, '')
  if (code.length !== 6) return false
  return safeEq(state.slice(dot + 1), hmac(`otp:${code}:${exp}`))
}

export function generateSession(): string {
  const exp = nowSec() + SESSION_TTL_SEC
  return `${exp}.${hmac(`sess:${exp}`)}`
}

export function validateSession(value: string | null): boolean {
  if (!value) return false
  const dot = value.indexOf('.')
  if (dot < 1) return false
  const exp = value.slice(0, dot)
  if (parseInt(exp, 10) < nowSec()) return false
  return safeEq(value.slice(dot + 1), hmac(`sess:${exp}`))
}

// ── cookies ──────────────────────────────────────────────────────────────────
export const isHttps = (req: Request) =>
  (req.headers.get('x-forwarded-proto') ?? new URL(req.url).protocol.replace(':', '')).startsWith(
    'https'
  )

function cookie(name: string, value: string, maxAge: number, secure: boolean, path: string) {
  return [
    `${name}=${value}`,
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Strict',
    `Path=${path}`,
    `Max-Age=${maxAge}`,
  ]
    .filter(Boolean)
    .join('; ')
}

// The session must reach both the page (/admin/stats) and its API.
const SESSION_PATHS = ['/admin/stats', '/api/admin/usage-stats']

export const otpCookie = (state: string, secure: boolean) =>
  cookie(OTP_COOKIE, encodeURIComponent(state), OTP_TTL_SEC, secure, '/admin/stats')
export const clearOtpCookie = () => cookie(OTP_COOKIE, '', 0, false, '/admin/stats')
export const sessionCookies = (value: string, secure: boolean) =>
  SESSION_PATHS.map((p) => cookie(SESSION_COOKIE, value, SESSION_TTL_SEC, secure, p))
export const clearSessionCookies = () =>
  SESSION_PATHS.map((p) => cookie(SESSION_COOKIE, '', 0, false, p))

function readCookie(req: Request, name: string): string | null {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const eq = part.indexOf('=')
    if (eq < 1 || part.slice(0, eq).trim() !== name) continue
    try {
      return decodeURIComponent(part.slice(eq + 1).trim())
    } catch {
      return null
    }
  }
  return null
}

export const getOtpState = (req: Request) => readCookie(req, OTP_COOKIE)
export const hasSession = (req: Request) => validateSession(readCookie(req, SESSION_COOKIE))

/** Constant-time X-Admin-Key check (scripts / curl). Disabled when STATS_ADMIN_KEY is unset. */
export function hasAdminKey(req: Request): boolean {
  const expected = process.env.STATS_ADMIN_KEY
  const got = req.headers.get('x-admin-key')
  if (!expected || !got) return false
  const a = crypto.createHash('sha256').update(got).digest()
  const b = crypto.createHash('sha256').update(expected).digest()
  return crypto.timingSafeEqual(a, b)
}

export const isAdminRequest = (req: Request) => hasAdminKey(req) || hasSession(req)

// ── durable rate limits (stats_rate_limits) ──────────────────────────────────
async function hits(bucket: string, k: string, windowMs: number): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM stats_rate_limits
      WHERE bucket = $1 AND key = $2 AND ts > NOW() - ($3 || ' milliseconds')::interval`,
    [bucket, k, windowMs]
  )
  return rows[0].n
}
const hit = (bucket: string, k: string) =>
  pool.query('INSERT INTO stats_rate_limits (bucket, key) VALUES ($1, $2)', [bucket, k])

export const isSendLimited = async (ip: string) =>
  (await hits('admin:otp-send', ip, SEND_WINDOW_MS)) >= SEND_MAX
export const recordSend = (ip: string) => hit('admin:otp-send', ip)
export const isVerifyLimited = async (ip: string) =>
  (await hits('admin:otp-fail', ip, VERIFY_WINDOW_MS)) >= VERIFY_MAX
export const recordVerifyFail = (ip: string) => hit('admin:otp-fail', ip)
export const clearVerifyFails = (ip: string) =>
  pool.query(`DELETE FROM stats_rate_limits WHERE bucket = 'admin:otp-fail' AND key = $1`, [ip])

/** Generic per-key limiter for public writers (feedback). */
export async function takeToken(bucket: string, k: string, max: number, windowMs: number) {
  if ((await hits(bucket, k, windowMs)) >= max) return false
  await hit(bucket, k)
  return true
}
