/**
 * /api/admin/usage-stats — data for the confidential /admin/stats dashboard.
 * Auth: admin session cookie (email OTP, lib/stats/admin-auth.ts) or X-Admin-Key.
 *
 * GET  ?range=today|7d|30d|90d&platform=all|web|ios|android → aggregates
 * POST {"action":"import","only":["play_listing",...]?} → start the store import
 *      in the background (the iOS ratings sweep takes ~10 min); poll GET for
 *      health.imports to see the result.
 */
import { NextResponse } from 'next/server'
import { hasAdminKey, isAdminRequest } from '@/lib/stats/admin-auth'
import { getStats } from '@/lib/stats/aggregate'
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
  if (!body || body.action !== 'import') return send(400, { error: 'Unknown action' })
  const only = Array.isArray(body.only)
    ? body.only.filter((s: unknown) => SOURCES.some((x) => x.id === s))
    : undefined
  runImports({ only }).catch((e) => console.error('[admin/usage-stats] import:', e.message))
  return send(202, { ok: true, started: only || SOURCES.map((s) => s.id) })
}
