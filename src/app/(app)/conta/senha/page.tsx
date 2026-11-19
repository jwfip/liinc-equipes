import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/schema'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import { LOGIN_MESSAGES } from '@/lib/login'

export const dynamic = 'force-dynamic'

export default async function SenhaPage() {
  const session = await auth()
  const mandatory = !!session?.user?.mustChangePassword
  const user = session?.user?.id
    ? await db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { passwordHash: true } })
    : undefined
  // Sessões abertas antes da troca para senha individual: ainda não há senha temporária.
  const noPassword = !user?.passwordHash

  return (
    <div className="max-w-md mx-auto px-4 py-8 md:py-12">
      <h1 className="font-display font-bold text-2xl">{mandatory ? 'Defina sua senha' : 'Alterar senha'}</h1>
      {mandatory && !noPassword && (
        <p className="text-slate-500 text-sm mt-1">Por segurança, troque a senha temporária antes de continuar.</p>
      )}
      <div className="card mt-6">
        {noPassword
          ? <p role="alert" className="text-sm font-semibold text-slate-700">{LOGIN_MESSAGES.no_password}</p>
          : <ChangePasswordForm mandatory={mandatory} />}
      </div>
    </div>
  )
}
