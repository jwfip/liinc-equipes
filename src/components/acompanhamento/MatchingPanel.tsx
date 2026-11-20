'use client'

import { useState, useTransition } from 'react'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { suggestMatching } from '@/actions/matching'
import type { MatchingRow } from '@/lib/event-data'
import { servedBlocks, type EventPerson } from '@/lib/follow-up'
import type { RecordWithRelations } from '@/lib/constants'

const time = (d: string | Date | null | undefined) => (d ? new Date(d).getTime() : 0)
const fmt = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : ''

interface Props {
  teamId:         string
  matching:       MatchingRow | undefined
  /** Registros (mentorias e atendimentos) desta equipe: "já atendeu" e "registros novos". */
  records:        RecordWithRelations[]
  personById:     Map<string, EventPerson>
  missingProfiles: number
  onProfile:      (p: EventPerson) => void
  onGenerated:    (row: MatchingRow) => void
}

/** Sugestão de mentores (IA, sob demanda) para uma equipe na tela Acompanhamento. */
export default function MatchingPanel({ teamId, matching, records, personById, missingProfiles, onProfile, onGenerated }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function generate() {
    setError(null)
    start(async () => {
      try {
        const r = await suggestMatching(teamId)
        if (!r.ok) { setError(r.error); return }
        onGenerated(r.matching)
        setOpen(true)
      } catch {
        setError('A IA não respondeu agora. Tente de novo.')
      }
    })
  }

  const hasNewer = !!matching && records.some(r => time(r.createdAt) > time(matching.createdAt))

  const group = (title: string, items: { id: string; reason: string }[]) => {
    const shown = items.filter(i => personById.get(i.id)?.active) // quem saiu do evento ou foi desativado depois da sugestão some
    if (shown.length === 0) return null
    return (
      <section>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</h4>
        <ul className="space-y-1.5">
          {shown.map(i => {
            const person = personById.get(i.id)!
            const served = servedBlocks(records, teamId, i.id)
            return (
              <li key={i.id} className="text-[13px] text-slate-700 leading-snug">
                <button type="button" onClick={() => onProfile(person)}
                  className="font-semibold text-navy underline decoration-dotted underline-offset-2 hover:text-orange-dark">{person.name}</button>
                {' — '}{i.reason}
                {served.length > 0 && (
                  <span className="ml-1.5 inline-flex text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full align-middle">
                    já atendeu {served.join(', ')}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  return (
    <div className="mt-3">
      {!matching ? (
        <button type="button" onClick={generate} disabled={pending}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange hover:text-orange-dark disabled:opacity-60">
          <Sparkles aria-hidden="true" size={14} />{pending ? 'Gerando sugestão…' : 'Sugerir mentores'}
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange hover:text-orange-dark">
          <Sparkles aria-hidden="true" size={14} />{open ? 'Ocultar sugestão' : 'Ver sugestão'}
          {open ? <ChevronUp aria-hidden="true" size={14} /> : <ChevronDown aria-hidden="true" size={14} />}
        </button>
      )}

      {error && <p role="status" className="text-xs text-red-600 mt-1.5">{error}</p>}

      {matching && open && (
        <div className="mt-2 rounded-xl border border-orange/30 bg-orange-pale/40 p-3.5 space-y-3">
          {matching.content.need && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Do que a equipe precisa agora</h4>
              <p className="text-[13px] text-navy leading-snug">{matching.content.need}</p>
            </section>
          )}
          {group('Mentores', matching.content.mentors)}
          {group('Especialistas', matching.content.specialists)}
          {missingProfiles > 0 && (
            <p className="text-[11px] text-slate-500 italic">
              {missingProfiles === 1 ? '1 pessoa sem perfil preenchido' : `${missingProfiles} pessoas sem perfil preenchido`} — a IA não teve como avaliá-las.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 border-t border-orange/20 pt-2">
            <span>Sugerido pela IA em {fmt(matching.createdAt)} por {matching.requestedBy ?? 'organização'}</span>
            {hasNewer && <span className="font-bold text-orange-dark">· Há registros novos desde então</span>}
            <button type="button" onClick={generate} disabled={pending}
              className="ml-auto inline-flex items-center gap-1 font-bold text-orange hover:text-orange-dark disabled:opacity-60">
              <RefreshCw aria-hidden="true" size={12} className={pending ? 'animate-spin' : ''} />
              {pending ? 'Gerando sugestão…' : 'Atualizar sugestão'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
