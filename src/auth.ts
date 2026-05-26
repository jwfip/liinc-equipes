import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
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
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        code:  { label: 'Código de Acesso', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null
        
        // Verifica o código do evento (senha global)
        if (credentials.code !== process.env.EVENT_ACCESS_CODE) {
          throw new Error('Código de acesso incorreto')
        }

        const userEmail = (credentials.email as string).toLowerCase()
        const user = await db.query.users.findFirst({
          where: eq(users.email, userEmail),
        })

        if (!user) {
          throw new Error('E-mail não cadastrado. Fale com a organização.')
        }

        return user
      }
    })
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
