'use client'

import { useRef, useState, useTransition } from 'react'
import type { ActionResult } from '@/lib/action-result'

interface Props {
  action:          (fd: FormData) => Promise<ActionResult>
  children:        React.ReactNode
  className?:      string
  submitLabel?:    string
  successMessage?: string
  resetOnSuccess?: boolean
}

export default function AdminForm({
  action, children, className, submitLabel = '+ Adicionar', successMessage = 'Salvo!', resetOnSuccess = true,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      let result: ActionResult
      try {
        result = await action(fd)
      } catch {
        result = { ok: false, error: 'Erro inesperado. Tente novamente.' }
      }
      if (result.ok) {
        if (resetOnSuccess) formRef.current?.reset()
        setFeedback({ ok: true, text: result.message ?? successMessage })
        setTimeout(() => setFeedback(f => (f?.ok ? null : f)), 3000)
      } else {
        setFeedback({ ok: false, text: result.error })
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className={className ?? 'flex flex-col sm:flex-row gap-3'}>
        {children}
        <div className="flex items-end">
          <button type="submit" disabled={isPending} className="btn-primary h-[38px] w-full sm:w-auto justify-center">
            {isPending ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </div>
      {feedback && (
        <p role="status" className={`mt-3 text-sm font-semibold ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}>
          {feedback.ok ? '✅ ' : ''}{feedback.text}
        </p>
      )}
    </form>
  )
}
