import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { eq } from 'drizzle-orm'
import { userProfiles } from '@/drizzle/schema/users'
import { users } from '@/drizzle/schema/auth'

const schema = z.object({
  role: z.enum(['parent', 'child']),
  fullName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow if profile doesn't exist yet
    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

    if (existing) {
      return NextResponse.json({ success: false, error: 'Profile already exists' }, { status: 409 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const dob = new Date(parsed.data.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
    if (age < 5 || age > 150 || dob > today) {
      return NextResponse.json({ success: false, error: 'Invalid date of birth' }, { status: 400 })
    }

    await db.transaction(async (tx) => {
      // Update the user's display name
      await tx.update(users).set({ name: parsed.data.fullName }).where(eq(users.id, user.id))

      // Create the profile
      await tx.insert(userProfiles).values({
        id: user.id,
        role: parsed.data.role,
        fullName: parsed.data.fullName,
        dateOfBirth: parsed.data.dateOfBirth,
      })
    })

    return NextResponse.json({ success: true, role: parsed.data.role })
  } catch (error) {
    console.error('[auth/google-setup] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create profile' }, { status: 500 })
  }
}
