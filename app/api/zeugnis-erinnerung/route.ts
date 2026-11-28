/**
 * POST /api/zeugnis-erinnerung — sign up for the Zeugnis-Erinnerung (growth plan B8).
 * Body: { email, land, page, turnstileToken }. Starts the double opt-in; the answer is the
 * same whether or not the address was signed up already. lib/reminders/zeugnis.ts.
 */
import { NextResponse } from 'next/server'
import { getLandReminder } from '@/content/ratgeber/laender/reminder'
import { getClientIp, verifyTurnstileToken } from '@/lib/auth/turnstile'
import { isSourcePage, normalizeEmail, subscribe } from '@/lib/reminders/zeugnis'
import { recordAction, requestContext, type Outcome } from '@/lib/stats/usage'

// Per IP, in this process (one replica): enough for a family, not for a mail bomb.
const IP_LIMIT = 5
const IP_WINDOW_MS = 60 * 60_000
const recent = new Map<string, number[]>()

function ipAllowed(ip: string, now = Date.now()): boolean {
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS)
  if (hits.length >= IP_LIMIT) {
    recent.set(ip, hits)
    return false
  }
  hits.push(now)
  recent.set(ip, hits)
  if (recent.size > 10_000) recent.clear()
  return true
}

export async function POST(req: Request) {
  const started = Date.now()
  let page: string | null = null
  const done = (status: number, body: object, outcome: Outcome, reason: string) => {
    requestContext(req.headers)
      .then((ctx) =>
        recordAction(ctx, {
          action: 'reminder_signup',
          outcome,
          statusCode: status,
          latencyMs: Date.now() - started,
          source: page,
          reason,
        })
      )
      .catch(() => {})
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return done(400, { error: 'invalid' }, 'invalid', 'body')
  }
  page = isSourcePage(body.page) ? body.page : null
  const email = normalizeEmail(body.email)
  const land = typeof body.land === 'string' ? getLandReminder(body.land) : undefined
  if (!page) return done(400, { error: 'invalid' }, 'invalid', 'page')
  if (!email) return done(400, { error: 'email' }, 'invalid', 'email')
  if (!land) return done(400, { error: 'land' }, 'invalid', 'land')

  const ip = getClientIp(req.headers) ?? 'unknown'
  if (!ipAllowed(ip)) return done(429, { error: 'rate_limited' }, 'rate_limited', 'ip')

  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''
  const bot = await verifyTurnstileToken(token, ip)
  if (!bot.success) return done(403, { error: 'bot' }, 'denied', 'turnstile')

  try {
    const r = await subscribe(email, land, page)
    if (r.status === 'closed') return done(410, { error: 'closed' }, 'invalid', 'closed')
    if (r.status === 'mail_failed') return done(502, { error: 'mail' }, 'fail', 'mail')
    // 'resend_skipped': already confirmed, or the last opt-in mail is too recent.
    return done(200, { ok: true }, 'ok', r.mailed ? 'mailed' : 'resend_skipped')
  } catch (e) {
    console.error('[zeugnis-erinnerung] subscribe:', (e as Error).message)
    return done(500, { error: 'server' }, 'fail', 'server')
  }
}
