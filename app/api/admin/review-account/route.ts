/**
 * POST /api/admin/review-account — rebuild the store-review demo family
 * (lib/review/demo-account.ts) to a clean state. X-Admin-Key only: it deletes
 * and recreates accounts, so a dashboard session is not enough.
 * Body (optional): { "reset": false } only re-syncs password and verification.
 */
import { NextResponse } from 'next/server'
import { hasAdminKey } from '@/lib/stats/admin-auth'
import { ensureReviewAccounts, REVIEW_DEMO_EMAILS } from '@/lib/review/demo-account'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!hasAdminKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { reset?: unknown }
  try {
    const result = await ensureReviewAccounts({ reset: body.reset !== false })
    if (result.status === 'disabled') {
      return NextResponse.json({ error: 'APPREVIEW_PASSWORD is not set' }, { status: 503 })
    }
    return NextResponse.json({ ...result, accounts: REVIEW_DEMO_EMAILS })
  } catch (err) {
    console.error('[review-account]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
