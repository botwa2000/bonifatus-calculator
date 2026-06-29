import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { users } from '@/drizzle/schema/auth'
import { eq } from 'drizzle-orm'
import { requireAuthApi } from '@/lib/auth/session'

export async function GET() {
  try {
    const authUser = await requireAuthApi()
    if (!authUser?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [profile] = await db
      .select({
        id: userProfiles.id,
        role: userProfiles.role,
        fullName: userProfiles.fullName,
        dateOfBirth: userProfiles.dateOfBirth,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(userProfiles)
      .where(eq(userProfiles.id, authUser.id))
      .limit(1)

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1)

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      id: profile.id,
      email: user?.email ?? authUser.email ?? '',
      name: profile.fullName,
      role: profile.role,
      avatarUrl: profile.avatarUrl ?? null,
    })
  } catch (err) {
    console.error('[mobile/auth/me]', err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
