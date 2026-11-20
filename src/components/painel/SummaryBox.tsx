'use client'

import { useState, useTransition } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { refreshTeamSummary } from '@/actions/summaries'

export type TeamSummary = { teamId: string; kind: string; content: string; basedOnRecordId: string | null; createdAt: string | Date | null }

interface Props {
  summary:      TeamSummary | undefined
  stale:        boolean
  hasRecords:   boolean
  teamId:       string
  kind:         'mentoring' | 'specialist'
  compact?:     boolean          // card: texto curto, sem botão
  latestAt?:    number           // data (ms) do registro mais recente: recém-criado → resumo ainda sendo gerado
  onRefreshed?: () => void
}

function fmt(d: string | Date | null) {
  return d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
}

/** Resumo gerado por IA da equipe (evolução ou atendimentos). */
const GENERATING_WINDOW_MS = 90_000

export default function SummaryBox({ summary, stale, hasRecords, teamId, kind, compact = false, latestAt, onRefreshed }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  if (!hasRecords) return null

  // O formulário dispara a geração ao salvar; por alguns segundos o resumo ainda não chegou.
  const generating = isPending || (stale && !!latestAt && Date.now() - latestAt < GENERATING_WINDOW_MS)
  const title = kind === 'mentoring' ? 'Resumo da IA' : 'Resumo dos atendimentos (IA)'
  const refresh = () => startTransition(async () => {
    setError(null)
    const r = await refreshTeamSummary(teamId, kind).catch(() => ({ ok: false as const, error: 'Erro inesperado. Tente novamente.' }))
    if (!r.ok) setError(r.error)
    else onRefreshed?.()
  })

  return (
    <div className={`rounded-lg border border-orange/20 bg-orange-pale/60 ${compact ? 'p-2.5' : 'p-3.5'}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-dark mb-1">
        <Sparkles aria-hidden="true" size={12} /> {title}
        {!compact && (
          <button type="button" onClick={refresh} disabled={isPending}
            className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal text-[11px] font-bold text-orange-dark hover:underline disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={12} className={isPending ? 'animate-spin' : ''} />
            {isPending ? 'Gerando…' : summary ? 'Atualizar resumo' : 'Gerar resumo'}
          </button>
        )}
      </div>
      {summary ? (
        <>
          <p className={`text-[13px] leading-relaxed text-slate-700 ${compact && !expanded ? 'line-clamp-3' : ''}`}>{summary.content}</p>
          {compact && summary.content.length > 160 && (
            <button type="button" onClick={() => setExpanded(v => !v)} className="text-[11px] font-bold text-orange-dark mt-0.5">
              {expanded ? 'ver menos' : 'ver mais'}
            </button>
          )}
          <p className="text-[10px] text-slate-500 mt-1">
            {generating ? 'Atualizando com o registro mais recente…'
              : stale ? `Resumo de ${fmt(summary.createdAt)} · pode estar desatualizado` : `Atualizado em ${fmt(summary.createdAt)}`}
          </p>
        </>
      ) : (
        <p className="text-[12px] text-slate-500 italic">{generating ? 'Gerando resumo…' : 'Resumo indisponível.'}</p>
      )}
      {error && <p role="alert" className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>}
    </div>
  )
}
