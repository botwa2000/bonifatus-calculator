import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db/client'
import { eq } from 'drizzle-orm'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import bcrypt from 'bcryptjs'
import { dbg, dbgWarn, dbgError } from '@/lib/debug'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        dbg('auth', 'authorize called', {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
        })

        if (!credentials?.email || !credentials?.password) {
          dbgWarn('auth', 'missing credentials')
          return null
        }

        const email = (credentials.email as string).toLowerCase()
        const password = credentials.password as string

        try {
          const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

          if (!user || !user.password) {
            dbg('auth', 'user not found or no password', { email })
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) {
            dbg('auth', 'invalid password', { email })
            return null
          }

          if (!user.emailVerified) {
            dbgWarn('auth', 'email not verified', { email })
            return null
          }

          dbg('auth', 'authorize success', { email, userId: user.id })
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (err) {
          dbgError('auth', 'authorize threw', { email, error: String(err) })
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        try {
          const [profile] = await db
            .select({ role: userProfiles.role })
            .from(userProfiles)
            .where(eq(userProfiles.id, user.id!))
            .limit(1)
          if (!profile && account?.provider === 'google') {
            // New Google user — needs profile setup
            token.role = 'setup_needed'
            token.needsSetup = true
            dbg('auth', 'jwt callback — google user needs profile setup', { userId: user.id })
          } else {
            token.role = profile?.role ?? 'child'
            token.needsSetup = false
          }
          token.roleRefreshedAt = Date.now()
          dbg('auth', 'jwt callback — role resolved', { userId: user.id, role: token.role })
        } catch (err) {
          dbgError('auth', 'jwt callback — role fetch failed', {
            userId: user.id,
            error: String(err),
          })
          token.role = 'child'
          token.needsSetup = false
          token.roleRefreshedAt = Date.now()
        }
      } else {
        // Refresh role from DB at most once per hour so role changes take effect within the session
        const refreshedAt = token.roleRefreshedAt as number | undefined
        if (!refreshedAt || Date.now() - refreshedAt > 60 * 60 * 1000) {
          try {
            const [profile] = await db
              .select({ role: userProfiles.role })
              .from(userProfiles)
              .where(eq(userProfiles.id, token.id as string))
              .limit(1)
            if (profile) {
              token.role = profile.role
            }
            token.roleRefreshedAt = Date.now()
          } catch (err) {
            dbgError('auth', 'jwt callback — periodic role refresh failed', {
              userId: token.id,
              error: String(err),
            })
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'parent' | 'child' | 'admin'
        session.user.needsSetup = token.needsSetup as boolean | undefined
      }
      dbg('auth', 'session callback', { userId: session.user?.id, role: session.user?.role })
      return session
    },
  },
})
