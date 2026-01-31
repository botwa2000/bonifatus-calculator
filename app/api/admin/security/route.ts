import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { getRecentSecurityEvents } from '@/lib/db/queries/admin'

export async function GET(request: Request) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1)

  if (profile?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

  const events = await getRecentSecurityEvents(limit)
  return NextResponse.json({ success: true, data: events })
}
