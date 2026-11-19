'use client'

import { useState } from 'react'
import AdminForm from '@/components/admin/AdminForm'
import { changePassword } from '@/actions/account'

export default function ChangePasswordForm({ mandatory: mandatoryProp }: { mandatory: boolean }) {
  // Congela o modo inicial: após salvar, a página é revalidada já com mandatory=false
  // e o formulário voltaria no lugar do botão "Continuar".
  const [mandatory] = useState(mandatoryProp)
  const [done, setDone] = useState(false)

  if (done && mandatory) {
    return (
      <div className="text-center py-4">
        <p className="text-green-700 font-semibold mb-4">✅ Senha definida.</p>
        {/* <a> e não <Link>: o prefetch do Link guardaria o redirecionamento para /conta/senha feito antes da troca. */}
        <a href="/painel" className="btn-primary justify-center w-full sm:w-auto">Continuar</a>
      </div>
    )
  }

  return (
    <AdminForm
      action={async (fd) => { const r = await changePassword(fd); if (r.ok) setDone(true); return r }}
      submitLabel={mandatory ? 'Definir senha' : 'Alterar senha'}
      successMessage="Senha alterada."
      className="flex flex-col gap-4"
    >
      <div>
        <label className="label" htmlFor="current">{mandatory ? 'Senha temporária' : 'Senha atual'}</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="next">Nova senha</label>
        <input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <p className="text-xs text-slate-500 mt-1">Pelo menos 8 caracteres, diferente do seu usuário.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Repita a nova senha</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
    </AdminForm>
  )
}
