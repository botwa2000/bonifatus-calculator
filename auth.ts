import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        try {
          const [profile] = await db
            .select({ role: userProfiles.role })
            .from(userProfiles)
            .where(eq(userProfiles.id, user.id!))
            .limit(1)
          token.role = profile?.role ?? 'child'
          dbg('auth', 'jwt callback — role resolved', { userId: user.id, role: token.role })
        } catch (err) {
          dbgError('auth', 'jwt callback — role fetch failed', {
            userId: user.id,
            error: String(err),
          })
          token.role = 'child'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'parent' | 'child' | 'admin'
      }
      dbg('auth', 'session callback', { userId: session.user?.id, role: session.user?.role })
      return session
    },
  },
})
