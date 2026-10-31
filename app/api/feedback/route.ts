/**
 * POST /api/feedback — in-app feedback for /admin/stats.
 *   { kind: "app",    rating: 1..5, comment?, lang?, iid? }   parent rates Bonifatus (emailed to the team)
 *   { kind: "result", rating: 1..5, action, resultId?, iid? } one-tap rating of a scan / calculation
 * Same privacy model as usage events (lib/stats/usage.ts). Rate-limited per
 * account / install / IP so a client loop cannot flood the table or the inbox.
 */
import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { getClientIp } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'
import { takeToken } from '@/lib/stats/admin-auth'
import { cleanShort, recordFeedback, requestContext } from '@/lib/stats/usage'

const RATED_ACTIONS = new Set([
  'report_scan',
  'calculator_preview',
  'grade_term_save',
  'grade_quick_save',
])

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }
  const kind = body.kind === 'app' || body.kind === 'result' ? body.kind : null
  const rating = Number(body.rating)
  if (!kind || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: 'Invalid feedback' }, { status: 400 })
  }
  const action = kind === 'result' ? cleanShort(body.action) : null
  if (kind === 'result' && (!action || !RATED_ACTIONS.has(action))) {
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  }
  const comment =
    kind === 'app' && typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : ''

  const user = await requireAuthApi().catch(() => null)
  const ctx = await requestContext(req.headers, {
    bodyInstallId: body.iid,
    bodyLang: body.lang,
    userId: user?.id ?? null,
  })
  const who = ctx.userId || ctx.installId || getClientIp(req.headers) || 'unknown'
  if (!(await takeToken(`feedback:${kind}`, who, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
  }

  await recordFeedback(ctx, {
    kind,
    rating,
    comment: comment || null,
    action,
    resultId: typeof body.resultId === 'string' ? body.resultId : null,
  })

  if (kind === 'app') {
    const meta = `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} · ${ctx.platform}${ctx.version ? ` ${ctx.version}` : ''} · ${ctx.lang ?? '?'} · ${ctx.country ?? '?'}`
    const sent = await sendEmail({
      to: 'info@bonifatus.com',
      subject: `[Bonifatus feedback] ${rating}/5${comment ? `: ${comment.slice(0, 60)}` : ''}`,
      text: `${meta}\n\n${comment || '(no comment)'}`,
      html: `<div style="font-family:sans-serif;max-width:600px">
  <p style="font-size:20px;color:#f5a623;margin:0">${'★'.repeat(rating)}<span style="color:#ccc">${'★'.repeat(5 - rating)}</span></p>
  <p style="color:#666">${escapeHtml(meta)}</p>
  <p style="white-space:pre-wrap;background:#f9f9f9;padding:12px;border-radius:8px">${escapeHtml(comment || '(no comment)')}</p>
</div>`,
    })
    if (!sent) console.error('[feedback] team email failed — feedback is stored in the database')
  }

  return NextResponse.json({ success: true })
}
