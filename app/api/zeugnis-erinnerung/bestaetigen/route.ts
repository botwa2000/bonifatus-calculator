/**
 * POST /api/zeugnis-erinnerung/bestaetigen — the double opt-in. Body: { id, t }.
 * Called by the confirmation page when the person presses "Bestätigen" (a link click alone
 * does not confirm, so mail scanners that open links cannot sign anyone up).
 */
import { NextResponse } from 'next/server'
import { confirm } from '@/lib/reminders/zeugnis'
import { recordAction, requestContext } from '@/lib/stats/usage'

export async function POST(req: Request) {
  const started = Date.now()
  let id: unknown = null
  let token: unknown = null
  try {
    const body = await req.json()
    id = body?.id
    token = body?.t
  } catch {
    // invalid below
  }
  try {
    const r = await confirm(id, token)
    const ok = r.status !== 'invalid'
    requestContext(req.headers)
      .then((ctx) =>
        recordAction(ctx, {
          action: 'reminder_confirm',
          outcome: ok ? 'ok' : 'invalid',
          statusCode: ok ? 200 : 400,
          latencyMs: Date.now() - started,
          source: ok ? r.sourcePage : null,
          // Only a first confirmation counts as a sign-up in /admin/stats.
          reason: r.status,
        })
      )
      .catch(() => {})
    return NextResponse.json(
      ok ? { status: r.status, land: r.land, landName: r.landName } : { status: 'invalid' },
      { status: ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e) {
    console.error('[zeugnis-erinnerung] confirm:', (e as Error).message)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
