'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Sparkles, Loader2 } from 'lucide-react'
import { generateFinal, saveFinalSummary } from '@/actions/report'

interface Props {
  teamId:  string
  content: string | null
  edited:  boolean
}

/** Resumo final de uma equipe: texto na impressão; na tela, editar ou gerar com IA. */
export default function FinalSummaryEditor({ teamId, content, edited }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const generate = () => {
    if (edited && !window.confirm('Substituir o texto editado por um novo resumo da IA?')) return
    startTransition(async () => {
      setError(null)
      const r = await generateFinal(teamId, { overwriteEdited: true }).catch(() => ({ ok: false as const, error: 'Erro inesperado.' }))
      if (!r.ok) setError(r.error); else router.refresh()
    })
  }
  const save = () => startTransition(async () => {
    setError(null)
    const r = await saveFinalSummary(teamId, draft).catch(() => ({ ok: false as const, error: 'Erro inesperado.' }))
    if (!r.ok) setError(r.error); else { setEditing(false); router.refresh() }
  })

  return (
    <div className="avoid-break border-l-4 border-orange bg-orange-pale/60 rounded-r-xl p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-orange-dark">Parecer final</h3>
        {edited && <span className="print:hidden text-[10px] font-bold bg-white border border-orange/30 text-orange-dark px-1.5 rounded">Editado</span>}
        {!editing && (
          <div className="print:hidden ml-auto flex gap-3">
            <button type="button" onClick={() => { setDraft(content ?? ''); setEditing(true) }} className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-dark hover:underline">
              <Pencil aria-hidden="true" size={12} /> Editar
            </button>
            <button type="button" onClick={generate} disabled={isPending} className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-dark hover:underline disabled:opacity-50">
              {isPending ? <Loader2 aria-hidden="true" size={12} className="animate-spin" /> : <Sparkles aria-hidden="true" size={12} />}
              {content ? 'Gerar de novo com IA' : 'Gerar com IA'}
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="print:hidden">
          <label className="sr-only" htmlFor={`final-${teamId}`}>Parecer final</label>
          <textarea id={`final-${teamId}`} value={draft} onChange={e => setDraft(e.target.value)} rows={6} maxLength={2000} className="input resize-y text-[13px]" />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={save} disabled={isPending} className="btn-primary text-xs py-1.5">{isPending ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      ) : content ? (
        <p className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-line">{content}</p>
      ) : (
        <p className="text-[12px] italic text-slate-500">Sem parecer ainda.<span className="print:hidden"> Use “Gerar com IA” ou “Editar”.</span></p>
      )}
      {error && <p role="alert" className="print:hidden text-[11px] font-semibold text-red-600 mt-1">{error}</p>}
    </div>
  )
}
