import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/schema'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import { LOGIN_MESSAGES } from '@/lib/login'

export const dynamic = 'force-dynamic'

/** Configurações da própria conta. A troca obrigatória de senha temporária continua em /conta/senha. */
export default async function ContaPage() {
  const session = await auth()
  const user = session?.user?.id
    ? await db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { name: true, email: true, passwordHash: true } })
    : undefined

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <h1 className="font-display font-bold text-2xl">Configurações</h1>

      <section className="card" aria-labelledby="conta-dados">
        <h2 id="conta-dados" className="font-display font-semibold text-sm text-slate-600 mb-4">Sua conta</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><dt className="label">Nome</dt><dd className="font-medium text-navy">{user?.name ?? '—'}</dd></div>
          <div><dt className="label">Usuário</dt><dd className="font-medium text-navy">{user?.email ?? session?.user?.email ?? '—'}</dd></div>
        </dl>
        <p className="text-xs text-slate-500 mt-4">Para mudar o nome ou o usuário, fale com a organização.</p>
      </section>

      <section className="card" aria-labelledby="conta-senha">
        <h2 id="conta-senha" className="font-display font-semibold text-sm text-slate-600 mb-4">Senha</h2>
        {user?.passwordHash
          ? <ChangePasswordForm mandatory={false} />
          : <p role="alert" className="text-sm font-semibold text-slate-700">{LOGIN_MESSAGES.no_password}</p>}
      </section>
    </div>
  )
}
