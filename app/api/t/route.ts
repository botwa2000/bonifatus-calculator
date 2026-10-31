/**
 * POST /api/t — first-party usage events from the web beacon
 * (components/analytics/UsageBeacon.tsx) and the mobile apps (UsageService).
 * Body is JSON sent as text/plain (keeps sendBeacon a simple, preflight-free
 * request). Event names and prop keys are allow-listed in lib/stats/usage.ts.
 */
import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { recordEvents, type EventBatch } from '@/lib/stats/usage'

const MAX_BODY = 32_768

export async function POST(req: Request) {
  const raw = await req.text()
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 })
  let body: EventBatch
  try {
    body = JSON.parse(raw || '{}')
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  if (!body || typeof body !== 'object') return new NextResponse(null, { status: 400 })

  try {
    const user = await requireAuthApi().catch(() => null)
    const accepted = await recordEvents(req.headers, body, user?.id ?? null)
    return NextResponse.json({ accepted }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/t]', (err as Error).message)
    // Statistics must never surface as an error to the client.
    return NextResponse.json({ accepted: 0 }, { status: 202 })
  }
}
