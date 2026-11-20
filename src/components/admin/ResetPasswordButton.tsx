'use client'

import { useState, useTransition } from 'react'
import { resetPassword } from '@/actions/admin'
import TempPasswordNotice from './TempPasswordNotice'

export default function ResetPasswordButton({ mentorId, name }: { mentorId: string; name: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState<{ subject: string; value: string } | null>(null)

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1 w-full sm:w-auto">
      <button type="button" disabled={isPending} className="btn-secondary btn-sm"
        onClick={() => {
          if (!window.confirm(`Gerar nova senha temporária para ${name}?`)) return
          setError(null); setSecret(null)
          startTransition(async () => {
            const r = await resetPassword(mentorId).catch(() => ({ ok: false as const, error: 'Erro inesperado. Tente novamente.' }))
            if (r.ok && r.secret) setSecret({ subject: r.subject ?? '', value: r.secret })
            else if (!r.ok) setError(r.error)
          })
        }}>
        {isPending ? 'Gerando...' : 'Redefinir senha'}
      </button>
      {error && <span role="alert" className="text-[11px] font-semibold text-red-600">{error}</span>}
      {secret && <TempPasswordNotice username={secret.subject} password={secret.value} />}
    </div>
  )
}
