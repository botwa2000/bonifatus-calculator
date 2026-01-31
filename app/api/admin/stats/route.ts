import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { getAdminStats, getGradeStats } from '@/lib/db/queries/admin'

export async function GET() {
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

  const [stats, gradeStats] = await Promise.all([getAdminStats(), getGradeStats()])

  return NextResponse.json({ success: true, data: { ...stats, gradeStats } })
}
