'use client'

import { ArrowLeftRight } from 'lucide-react'

import { useState, useTransition } from 'react'
import { adjustTeamStep } from '@/actions/admin'
import type { Step } from '@/lib/constants'

interface Props {
  teamId:        string
  teamName:      string
  steps:         Step[]
  currentStepId: number | null
  onAdjusted?:   () => void
}

/** Controle do admin para mover a equipe de etapa sem depender de uma mentoria. */
export default function StepAdjuster({ teamId, teamName, steps, currentStepId, onAdjusted }: Props) {
  const [open, setOpen] = useState(false)
  const [stepId, setStepId] = useState<number | ''>(currentStepId ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button type="button" onClick={() => { setOpen(true); setStepId(currentStepId ?? '') }}
        aria-label={`Ajustar etapa da equipe ${teamName}`}
        className="ml-auto inline-flex items-center gap-1 text-slate-500 hover:text-navy font-display font-bold text-xs transition-colors">
        <ArrowLeftRight aria-hidden="true" size={14} /> Ajustar etapa
      </button>
    )
  }

  return (
    <div className="w-full flex flex-col gap-2 pt-1">
      <label className="sr-only" htmlFor={`adj-${teamId}`}>Etapa da equipe {teamName}</label>
      <select id={`adj-${teamId}`} className="input py-2" value={stepId} onChange={e => setStepId(Number(e.target.value))}>
        <option value="" disabled>Selecione a etapa...</option>
        {steps.map((s, i) => <option key={s.id} value={s.id}>{i + 1} — {s.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="button" disabled={isPending || stepId === '' || stepId === currentStepId}
          className="btn-primary text-xs py-1.5 flex-1"
          onClick={() => startTransition(async () => {
            setError(null)
            const r = await adjustTeamStep(teamId, Number(stepId)).catch(() => ({ ok: false as const, error: 'Erro inesperado. Tente novamente.' }))
            if (!r.ok) { setError(r.error); return }
            setOpen(false)
            onAdjusted?.()
          })}>
          {isPending ? 'Salvando...' : 'Confirmar'}
        </button>
        <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
      {error && <p role="alert" className="text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  )
}
