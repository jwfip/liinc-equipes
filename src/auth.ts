import NextAuth from 'next-auth'
import { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens, loginAttempts } from '@/schema'
import { and, eq, gt, lt } from 'drizzle-orm'
import { checkLogin, normalizeUsername, type LoginReason } from '@/lib/login'
import { LOCKOUT_WINDOW_MS } from '@/lib/lockout'
import { verifyPassword } from '@/lib/password'

/** Erro de login com motivo; o NextAuth repassa `code` na URL (?code=...). */
export class LoginError extends CredentialsSignin {
  constructor(reason: LoginReason) {
    super()
    this.code = reason
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable:              users,
    accountsTable:           accounts,
    sessionsTable:           sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const username = normalizeUsername(credentials?.username)
        const password = String(credentials?.password ?? '')
        if (!username || !password) throw new LoginError('invalid')

        const now = new Date()
        const since = new Date(now.getTime() - LOCKOUT_WINDOW_MS)
        // Registra a tentativa ANTES de contar: requisições paralelas não escapam do bloqueio.
        const [[attempt], user] = await Promise.all([
          db.insert(loginAttempts).values({ username }).returning({ id: loginAttempts.id }),
          db.query.users.findFirst({ where: eq(users.email, username) }),
        ])
        const previous = await db.select({ at: loginAttempts.attemptedAt }).from(loginAttempts)
          .where(and(eq(loginAttempts.username, username), gt(loginAttempts.attemptedAt, since), lt(loginAttempts.id, attempt.id)))

        const outcome = await checkLogin({
          user, password, now, verify: verifyPassword, failures: previous.map(f => f.at),
        })

        if (!outcome.ok) {
          // A tentativa já ficou registrada (inclusive para usuário inexistente: não revela quem existe).
          throw new LoginError(outcome.reason)
        }

        await db.delete(loginAttempts).where(eq(loginAttempts.username, username))
        const u = user!
        return { id: u.id, name: u.name, email: u.email, role: u.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Busca role atual do banco (pode ter sido atualizado)
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, token.id as string),
      })
      session.user.role = dbUser?.role ?? 'mentor'
      session.user.mustChangePassword = dbUser?.mustChangePassword ?? false
      session.user.id   = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
