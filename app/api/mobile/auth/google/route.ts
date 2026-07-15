import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, accounts } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { eq, and } from 'drizzle-orm'
import { signMobileToken } from '@/lib/auth/mobile-token'

interface GoogleTokenInfo {
  sub: string
  email: string
  email_verified: string
  name: string
  picture: string
  aud: string
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
  const resp = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  )
  if (!resp.ok) throw new Error('Invalid Google token')
  const data = (await resp.json()) as GoogleTokenInfo
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (clientId && data.aud !== clientId) throw new Error('Token audience mismatch')
  if (data.email_verified !== 'true') throw new Error('Email not verified by Google')
  return data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken, role, fullName, dateOfBirth } = body as {
      idToken?: string
      role?: string
      fullName?: string
      dateOfBirth?: string
    }

    if (!idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 })
    }

    const googleUser = await verifyGoogleToken(idToken)
    const email = googleUser.email.toLowerCase()

    // Look up by linked Google account first
    const [existingAccount] = await db
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(and(eq(accounts.provider, 'google'), eq(accounts.providerAccountId, googleUser.sub)))
      .limit(1)

    let userId: string | null = existingAccount?.userId ?? null

    if (!userId) {
      // Fall back to email match (links Google to an existing email/password account)
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existingUser) {
        userId = existingUser.id
        await db
          .insert(accounts)
          .values({
            userId,
            type: 'oauth',
            provider: 'google',
            providerAccountId: googleUser.sub,
          })
          .onConflictDoNothing()
      }
    }

    if (!userId) {
      // Brand-new user — need role + DOB before we can create the profile
      if (!role || !fullName || !dateOfBirth) {
        return NextResponse.json({
          status: 'needs_profile',
          name: googleUser.name,
          email: googleUser.email,
          picture: googleUser.picture,
        })
      }

      if (role !== 'parent' && role !== 'child') {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      const newId = crypto.randomUUID()
      await db.insert(users).values({
        id: newId,
        name: fullName,
        email,
        emailVerified: new Date(),
        image: googleUser.picture,
      })
      await db.insert(accounts).values({
        userId: newId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleUser.sub,
      })
      await db.insert(userProfiles).values({
        id: newId,
        role: role as 'parent' | 'child',
        fullName,
        dateOfBirth,
      })
      userId = newId
    }

    const [profile] = await db
      .select({ role: userProfiles.role, fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1)

    if (!profile) {
      // Linked account but profile missing — ask for profile data
      return NextResponse.json({
        status: 'needs_profile',
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
      })
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const token = await signMobileToken({
      userId,
      role: profile.role as 'parent' | 'child' | 'admin',
      email,
    })

    return NextResponse.json({
      success: true,
      accessToken: token,
      user: {
        id: userId,
        email,
        name: user?.name ?? profile.fullName,
        role: profile.role,
      },
    })
  } catch (err) {
    console.error('[mobile/auth/google]', err)
    const message = err instanceof Error ? err.message : 'Authentication failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
