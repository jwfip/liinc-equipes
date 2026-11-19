'use client'

import { useState, useTransition } from 'react'
import type { ActionResult } from '@/lib/action-result'

interface Props {
  action:     () => Promise<ActionResult>
  children:   React.ReactNode
  className?: string
  confirm?:   string
  title?:     string
}

/** Botão que executa uma action e mostra o erro ao lado, sem recarregar a página. */
export default function ActionButton({ action, children, className, confirm, title }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        title={title}
        aria-label={title}
        disabled={isPending}
        className={className ?? 'btn-secondary text-xs py-1.5'}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return
          setError(null)
          startTransition(async () => {
            try {
              const r = await action()
              if (!r.ok) setError(r.error)
            } catch {
              setError('Erro inesperado. Tente novamente.')
            }
          })
        }}
      >
        {children}
      </button>
      {error && <span role="alert" className="text-[11px] font-semibold text-red-600 max-w-[220px] text-right">{error}</span>}
    </span>
  )
}
