import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { ilike, or, eq, desc } from 'drizzle-orm'

const DIAG_SECRET = process.env.DIAG_SECRET ?? ''

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-diag-secret')
  if (!DIAG_SECRET || secret !== DIAG_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const email = request.nextUrl.searchParams.get('email') ?? ''
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

  const matchedUsers = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      hasPassword: users.password,
      name: userProfiles.fullName,
      role: userProfiles.role,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.id, users.id))
    .where(ilike(users.email, `%${email}%`))
    .limit(5)

  const codes =
    matchedUsers.length > 0
      ? await db
          .select({
            email: verificationCodes.email,
            purpose: verificationCodes.purpose,
            createdAt: verificationCodes.createdAt,
            expiresAt: verificationCodes.expiresAt,
            verifiedAt: verificationCodes.verifiedAt,
            ipAddress: verificationCodes.ipAddress,
          })
          .from(verificationCodes)
          .where(ilike(verificationCodes.email, `%${email}%`))
          .orderBy(desc(verificationCodes.createdAt))
          .limit(10)
      : []

  return NextResponse.json({
    users: matchedUsers.map((u) => ({
      ...u,
      hasPassword: !!u.hasPassword,
      emailVerified: u.emailVerified ? u.emailVerified.toISOString() : null,
    })),
    codes,
  })
}
