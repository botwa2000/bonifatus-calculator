import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, accounts } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { eq, and } from 'drizzle-orm'
import { signMobileToken } from '@/lib/auth/mobile-token'
import { createPublicKey, createVerify } from 'node:crypto'

const BUNDLE_ID = 'dev.bonifatus.gradecalc'

interface AppleJwtHeader {
  kid: string
  alg: string
}

interface AppleJwtPayload {
  iss: string
  aud: string | string[]
  exp: number
  sub: string
  email?: string
  email_verified?: boolean | string
}

function decodePart(b64url: string): unknown {
  const padded = b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(b64url.length / 4) * 4, '=')
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
}

async function verifyAppleIdentityToken(
  identityToken: string
): Promise<{ sub: string; email?: string }> {
  const parts = identityToken.split('.')
  if (parts.length !== 3) throw new Error('Invalid identity token format')

  const [headerB64, payloadB64, signatureB64] = parts
  const header = decodePart(headerB64) as AppleJwtHeader
  const payload = decodePart(payloadB64) as AppleJwtPayload

  if (payload.iss !== 'https://appleid.apple.com') throw new Error('Invalid issuer')

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!aud.includes(BUNDLE_ID)) throw new Error('Token audience mismatch')

  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')

  const keysResp = await fetch('https://appleid.apple.com/auth/keys', {
    next: { revalidate: 3600 },
  })
  if (!keysResp.ok) throw new Error('Failed to fetch Apple public keys')
  const { keys } = (await keysResp.json()) as { keys: (JsonWebKey & { kid?: string })[] }

  const jwk = keys.find((k) => k.kid === header.kid)
  if (!jwk) throw new Error('No matching public key for kid: ' + header.kid)

  const publicKey = createPublicKey({ format: 'jwk', key: jwk })
  const verifier = createVerify('SHA256')
  verifier.update(`${headerB64}.${payloadB64}`)

  const sigBuf = Buffer.from(signatureB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  const isValid = verifier.verify(publicKey, sigBuf)
  if (!isValid) throw new Error('Invalid token signature')

  return {
    sub: payload.sub,
    email: payload.email,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identityToken, fullName, role, dateOfBirth } = body as {
      identityToken?: string
      fullName?: string
      role?: string
      dateOfBirth?: string
    }

    if (!identityToken) {
      return NextResponse.json({ error: 'identityToken required' }, { status: 400 })
    }

    const appleUser = await verifyAppleIdentityToken(identityToken)

    // Look up by linked Apple account first
    const [existingAccount] = await db
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(and(eq(accounts.provider, 'apple'), eq(accounts.providerAccountId, appleUser.sub)))
      .limit(1)

    let userId: string | null = existingAccount?.userId ?? null

    if (!userId && appleUser.email) {
      // Try to link to an existing email account
      const email = appleUser.email.toLowerCase()
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
            provider: 'apple',
            providerAccountId: appleUser.sub,
          })
          .onConflictDoNothing()
      }
    }

    if (!userId) {
      if (!appleUser.email) {
        return NextResponse.json(
          { error: 'Could not retrieve your email from Apple. Please sign in again.' },
          { status: 400 }
        )
      }

      // Brand-new user — need role + DOB before creating profile
      if (!role || !fullName || !dateOfBirth) {
        return NextResponse.json({
          status: 'needs_profile',
          name: fullName ?? '',
          email: appleUser.email,
        })
      }

      if (role !== 'parent' && role !== 'child') {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      const email = appleUser.email.toLowerCase()
      const newId = crypto.randomUUID()

      await db.insert(users).values({
        id: newId,
        name: fullName,
        email,
        emailVerified: new Date(),
      })
      await db.insert(accounts).values({
        userId: newId,
        type: 'oauth',
        provider: 'apple',
        providerAccountId: appleUser.sub,
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
      return NextResponse.json({
        status: 'needs_profile',
        name: fullName ?? '',
        email: appleUser.email ?? '',
      })
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    const token = await signMobileToken({
      userId,
      role: profile.role as 'parent' | 'child' | 'admin',
      email: user?.email ?? '',
    })

    return NextResponse.json({
      success: true,
      accessToken: token,
      user: {
        id: userId,
        email: user?.email ?? '',
        name: user?.name ?? profile.fullName,
        role: profile.role,
      },
    })
  } catch (err) {
    console.error('[mobile/auth/apple]', err)
    const message = err instanceof Error ? err.message : 'Authentication failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
