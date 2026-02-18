import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi } from '@/lib/auth/session'
import { getProfile, updateProfile } from '@/lib/db/queries/profile'

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getProfile(user.id)
    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}

const schema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().nullable().optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  schoolName: z.string().max(200).nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    await updateProfile(user.id, {
      ...parsed.data,
      dateOfBirth: parsed.data.dateOfBirth ?? undefined,
      schoolName: parsed.data.schoolName ?? undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while updating profile' },
      { status: 500 }
    )
  }
}
