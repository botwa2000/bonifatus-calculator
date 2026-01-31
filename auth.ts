import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db/client'
import { eq } from 'drizzle-orm'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import bcrypt from 'bcryptjs'

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
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        if (!user.emailVerified) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Fetch role from user_profiles
        const [profile] = await db
          .select({ role: userProfiles.role })
          .from(userProfiles)
          .where(eq(userProfiles.id, user.id!))
          .limit(1)
        token.role = profile?.role ?? 'child'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'parent' | 'child' | 'admin'
      }
      return session
    },
  },
})
