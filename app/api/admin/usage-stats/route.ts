/**
 * /api/admin/usage-stats — data for the confidential /admin/stats dashboard.
 * Auth: admin session cookie (email OTP, lib/stats/admin-auth.ts) or X-Admin-Key.
 *
 * GET  ?range=day|week|month|ytd|7d|30d|90d|12m|custom (&at= anchor of day/week/month,
 *      &from=&to= of custom, all YYYY-MM-DD)
 *      &platform=all|web|ios|android &traffic=real|all &bucket=day|week|month → aggregates
 * POST {"action":"import","only":["play_listing",...]?} → start the store import
 *      in the background (the iOS ratings sweep takes ~10 min); poll GET for
 *      health.imports to see the result.
 * POST {"action":"classify","email":"…","class":"internal|review|test|real|auto"}
 *      → count an account as a real user or not (lib/stats/classify.ts)
 * POST {"action":"login-link"} (X-Admin-Key only) → one-time sign-in link for
 *      the dashboard, valid 10 minutes, single use.
 */
import { NextResponse } from 'next/server'
import { createLoginLink, hasAdminKey, isAdminRequest, isHttps } from '@/lib/stats/admin-auth'
import { getStats } from '@/lib/stats/aggregate'
import { CLASSES, setAccountClass, type AccountClass } from '@/lib/stats/classify'
import { runImports, SOURCES } from '@/lib/stats/store-import'

export const dynamic = 'force-dynamic'

const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
const send = (status: number, body: unknown) =>
  NextResponse.json(body, { status, headers: HEADERS })

const OWN_ORIGIN = /^https:\/\/(www\.|dev\.)?bonifatus\.com$|^http:\/\/localhost(:\d+)?$/

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return send(401, { error: 'Unauthorized' })
  const url = new URL(req.url)
  try {
    const stats = await getStats({
      range: url.searchParams.get('range') ?? undefined,
      platform: url.searchParams.get('platform') ?? undefined,
      at: url.searchParams.get('at'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      traffic: url.searchParams.get('traffic') ?? undefined,
      bucket: url.searchParams.get('bucket') ?? undefined,
    })
    return send(200, stats)
  } catch (err) {
    console.error('[admin/usage-stats]', (err as Error).message)
    return send(500, { error: 'Internal error' })
  }
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return send(401, { error: 'Unauthorized' })
  // Cookie-authenticated POSTs must come from our own page (SameSite=Strict
  // already blocks cross-site cookies; this also rejects odd same-site origins).
  const origin = req.headers.get('origin')
  if (!hasAdminKey(req) && origin && !OWN_ORIGIN.test(origin))
    return send(403, { error: 'Bad origin' })
  const body = await req.json().catch(() => null)
  if (body?.action === 'login-link') {
    // Key only: a browser session must not be able to mint further sessions.
    if (!hasAdminKey(req)) return send(403, { error: 'Admin key required' })
    const { token, expiresIn } = await createLoginLink()
    const host = req.headers.get('x-forwarded-host') ?? new URL(req.url).host
    const proto = isHttps(req) ? 'https' : 'http'
    console.warn('[admin/usage-stats] one-time login link minted')
    return send(201, { url: `${proto}://${host}/admin/stats/link#${token}`, expiresIn })
  }
  if (body?.action === 'classify') {
    const cls = String(body.class ?? '')
    const email = String(body.email ?? '').slice(0, 254)
    if (!email.includes('@') || !(cls === 'auto' || (CLASSES as readonly string[]).includes(cls)))
      return send(400, { error: 'Need an email and a class' })
    const r = await setAccountClass(email, cls as AccountClass | 'auto')
    return r === 'ok' ? send(200, { ok: true }) : send(404, { error: 'No account with that email' })
  }
  if (!body || body.action !== 'import') return send(400, { error: 'Unknown action' })
  const only = Array.isArray(body.only)
    ? body.only.filter((s: unknown) => SOURCES.some((x) => x.id === s))
    : undefined
  runImports({ only }).catch((e) => console.error('[admin/usage-stats] import:', e.message))
  return send(202, { ok: true, started: only || SOURCES.map((s) => s.id) })
}
