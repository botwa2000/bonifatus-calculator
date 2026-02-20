import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { getAvatarPath, getAvatarUrl, processAvatar } from '@/lib/utils/avatar'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No avatar file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const processed = await processAvatar(buffer)

    const avatarPath = getAvatarPath(user.id)
    const fullPath = path.join(process.cwd(), avatarPath)

    await mkdir(path.dirname(fullPath), { recursive: true })
    await writeFile(fullPath, processed)

    const avatarUrl = getAvatarUrl(user.id)

    await db.update(userProfiles).set({ avatarUrl }).where(eq(userProfiles.id, user.id))

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while uploading avatar' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [profile] = await db
      .select({ avatarUrl: userProfiles.avatarUrl })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

    if (!profile?.avatarUrl) {
      return NextResponse.json({ success: false, error: 'No avatar found' }, { status: 404 })
    }

    const avatarPath = getAvatarPath(user.id)
    const fullPath = path.join(process.cwd(), avatarPath)

    try {
      const fileBuffer = await readFile(fullPath)
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
      })
    } catch {
      return NextResponse.json({ success: false, error: 'Avatar file not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Avatar serve error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while serving avatar' },
      { status: 500 }
    )
  }
}
