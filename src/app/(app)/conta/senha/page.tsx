import { auth } from '@/auth'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'

export const dynamic = 'force-dynamic'

export default async function SenhaPage() {
  const session = await auth()
  const mandatory = !!session?.user?.mustChangePassword

  return (
    <div className="max-w-md mx-auto px-4 py-8 md:py-12">
      <h1 className="font-display font-bold text-2xl">{mandatory ? 'Defina sua senha' : 'Alterar senha'}</h1>
      {mandatory && (
        <p className="text-slate-500 text-sm mt-1">Por segurança, troque a senha temporária antes de continuar.</p>
      )}
      <div className="card mt-6">
        <ChangePasswordForm mandatory={mandatory} />
      </div>
    </div>
  )
}
