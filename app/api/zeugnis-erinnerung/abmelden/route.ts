/**
 * POST /api/zeugnis-erinnerung/abmelden?id=…&t=… — unsubscribe in one click.
 * Used by the unsubscribe page and, as RFC 8058 one-click unsubscribe, by mail apps
 * (List-Unsubscribe-Post: List-Unsubscribe=One-Click, sent as a form body). The id and the
 * token may come in the query string or a JSON body.
 */
import { NextResponse } from 'next/server'
import { unsubscribe } from '@/lib/reminders/zeugnis'
import { recordAction, requestContext } from '@/lib/stats/usage'

export async function POST(req: Request) {
  const started = Date.now()
  const url = new URL(req.url)
  let id: unknown = url.searchParams.get('id')
  let token: unknown = url.searchParams.get('t')
  if (!id || !token) {
    try {
      const body = await req.json()
      id = body?.id
      token = body?.t
    } catch {
      // A one-click form body carries no id; the query string must have it.
    }
  }
  try {
    const r = await unsubscribe(id, token)
    const ok = r.status !== 'invalid'
    requestContext(req.headers)
      .then((ctx) =>
        recordAction(ctx, {
          action: 'reminder_unsubscribe',
          outcome: ok ? 'ok' : 'invalid',
          statusCode: ok ? 200 : 400,
          latencyMs: Date.now() - started,
          source: r.status === 'removed' ? r.sourcePage : null,
          reason: r.status === 'removed' ? (r.confirmed ? 'confirmed' : 'unconfirmed') : r.status,
        })
      )
      .catch(() => {})
    return NextResponse.json(
      { status: r.status === 'invalid' ? 'invalid' : 'removed' },
      { status: ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e) {
    console.error('[zeugnis-erinnerung] unsubscribe:', (e as Error).message)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
