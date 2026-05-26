import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/schema'
import { eq } from 'drizzle-orm'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable:              users,
    accountsTable:           accounts,
    sessionsTable:           sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      from:    'Liinc Mentorias <mentoria@liinc.com.br>',
      apiKey:  process.env.AUTH_RESEND_KEY,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Busca role atual do banco (pode ter sido atualizado)
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      })
      session.user.role = dbUser?.role ?? 'mentor'
      session.user.id   = user.id
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
