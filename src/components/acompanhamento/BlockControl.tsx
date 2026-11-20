'use client'

import { useState, useTransition } from 'react'
import { Clock, CirclePause } from 'lucide-react'
import { activateEventBlock, closeActiveBlock } from '@/actions/blocks'
import { blockSwitchMessage } from '@/lib/blocks'
import { fmtDate } from '@/lib/format'
import type { ActionResult } from '@/lib/action-result'

type Block = { id: number; label: string; date: string; active: boolean }

const dayMonth = (d: string) => fmtDate(d).slice(0, 5)

/** Facilitador (ou admin) ativa e encerra os blocos do evento, com confirmação. */
export default function BlockControl({ blocks, onChanged }: { blocks: Block[]; onChanged: () => void }) {
  const active = blocks.find(b => b.active) ?? null
  const others = blocks.filter(b => !b.active)
  const [choice, setChoice] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function run(message: string, action: () => Promise<ActionResult>) {
    if (!window.confirm(message)) return
    setError(null)
    start(async () => {
      try {
        const r = await action()
        if (!r.ok) { setError(r.error); return }
        setChoice('')
        onChanged()
      } catch {
        setError('Erro inesperado. Tente novamente.')
      }
    })
  }

  const next = others.find(b => String(b.id) === choice) ?? null

  return (
    <section aria-label="Bloco de mentoria" className="card mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {active ? (
          <>
            <Clock aria-hidden="true" size={18} className="text-orange shrink-0" />
            <p className="flex-1 min-w-0 text-sm">
              <span className="text-slate-500">Bloco ativo: </span>
              <span className="font-display font-bold text-navy">{active.label}</span>
              <span className="text-slate-500"> ({dayMonth(active.date)})</span>
            </p>
            <button type="button" disabled={pending} className="btn-danger"
              onClick={() => run(blockSwitchMessage(active.label, null), closeActiveBlock)}>
              Encerrar bloco
            </button>
          </>
        ) : (
          <>
            <CirclePause aria-hidden="true" size={18} className="text-slate-400 shrink-0" />
            <p className="flex-1 text-sm font-semibold text-slate-600">Nenhum bloco ativo — os mentores não conseguem registrar mentorias.</p>
          </>
        )}
      </div>

      {others.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <div className="flex-1">
            <label htmlFor="block-choice" className="label">{active ? 'Ativar outro bloco' : 'Ativar bloco'}</label>
            <select id="block-choice" value={choice} onChange={e => setChoice(e.target.value)} className="input">
              <option value="">Selecione…</option>
              {others.map(b => <option key={b.id} value={b.id}>{b.label} — {dayMonth(b.date)}</option>)}
            </select>
          </div>
          <button type="button" disabled={pending || !next} className="btn-primary h-[38px] justify-center"
            onClick={() => next && run(blockSwitchMessage(active?.label ?? null, next.label), () => activateEventBlock(next.id))}>
            {pending ? 'Salvando…' : 'Ativar'}
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
