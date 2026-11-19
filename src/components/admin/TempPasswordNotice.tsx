'use client'

import { useState } from 'react'

export default function TempPasswordNotice({ username, password }: { username: string; password: string }) {
  const [copied, setCopied] = useState(false)
  const text = `Usuário: ${username}\nSenha temporária: ${password}`

  return (
    <div role="status" className="mt-3 rounded-xl border-2 border-orange/40 bg-orange-pale p-4 text-left">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-dark mb-2">Senha temporária</p>
      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-slate-500">Usuário</dt><dd className="font-mono font-bold text-navy break-all">{username}</dd>
        <dt className="text-slate-500">Senha</dt><dd className="font-mono font-bold text-navy text-base tracking-wider select-all">{password}</dd>
      </dl>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
        <button type="button" className="btn-secondary text-xs py-1.5 justify-center"
          onClick={async () => {
            try { await navigator.clipboard.writeText(text); setCopied(true) } catch { setCopied(false) }
          }}>
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <p className="text-xs text-slate-600">Anote agora: esta senha não será mostrada de novo. A pessoa vai trocá-la no primeiro acesso.</p>
      </div>
    </div>
  )
}
