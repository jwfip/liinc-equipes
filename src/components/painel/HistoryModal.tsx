'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, MessagesSquare, User, ThumbsUp, Wrench, Pin, Lightbulb, Pencil, type LucideIcon } from 'lucide-react'
import { StatusIcon } from '@/components/ui/StatusIcon'
import StepProgress from './StepProgress'
import EvolutionChart from './EvolutionChart'
import { evolutionPoints } from '@/lib/evolution'
import type { RecordWithRelations, Step } from '@/lib/constants'
import type { StepChange } from '@/lib/records'

type Team = { id: string; number: number; name: string }
type Tab = 'mentoring' | 'specialist'

interface Props {
  team:        Team
  mentoring:   RecordWithRelations[]
  specialist:  RecordWithRelations[]
  stepChanges: StepChange[]
  steps:       Step[]
  initialTab:  Tab
  currentUser: string
  onClose:     () => void
}

const STATUS: Record<string, { label: string; pill: string; dot: string }> = {
  ok:        { label: 'No caminho', pill: 'bg-green-100 text-green-700',   dot: 'bg-green-500 ring-green-500' },
  attention: { label: 'Atenção',    pill: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400 ring-yellow-400' },
  emergency: { label: 'Emergência', pill: 'bg-red-100 text-red-700',       dot: 'bg-red-600 ring-red-600' },
  flying:    { label: 'Voando',     pill: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500 ring-blue-500' },
}

function fmtDateTime(d: string | Date | null) {
  if (!d) return ''
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const time = (d: string | Date | null) => (d ? new Date(d).getTime() : 0)
const names = (rs: RecordWithRelations[]) => Array.from(new Set(rs.map(r => r.mentor?.name).filter(Boolean)))

export default function HistoryModal({ team, mentoring, specialist, stepChanges, steps, initialTab, currentUser, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Linha do tempo de mentorias intercalada com ajustes de etapa, do mais novo para o mais antigo.
  const timeline = [
    ...mentoring.map(r => ({ type: 'record' as const, at: time(r.createdAt), r })),
    ...stepChanges.map(c => ({ type: 'change' as const, at: time(c.createdAt), c })),
  ].sort((a, b) => b.at - a.at)
  const atendimentos = [...specialist].sort((a, b) => time(b.createdAt) - time(a.createdAt))

  const points = evolutionPoints(steps, mentoring, stepChanges)
  const mentorNames = names(mentoring)
  const specialistNames = names(specialist)

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-navy/80 backdrop-blur-sm p-0 md:p-5"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-label={`Histórico da equipe ${team.name}`}
    >
      <div className="bg-white md:rounded-2xl rounded-t-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[92vh] md:max-h-[85vh]">
        <div className="bg-navy text-white p-5 md:p-6 rounded-t-2xl shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
          <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 md:top-5 md:right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X aria-hidden="true" size={18} /></button>
          <div className="font-display font-bold text-xs text-white/50 uppercase tracking-wider mb-0.5">Equipe #{team.number}</div>
          <div className="font-display font-bold text-xl md:text-2xl leading-tight pr-10">{team.name}</div>
          <div className="text-xs text-white/50 mt-1.5">Mentores: <span className="text-white/80">{mentorNames.length ? mentorNames.join(', ') : 'Nenhum'}</span></div>
          {specialistNames.length > 0 && (
            <div className="text-xs text-white/50 mt-0.5">Especialistas: <span className="text-white/80">{specialistNames.join(', ')}</span></div>
          )}
          <div role="tablist" className="flex gap-1 mt-4 -mb-1">
            {([['mentoring', `Mentorias (${mentoring.length})`], ['specialist', `Atendimentos (${specialist.length})`]] as const).map(([key, label]) => (
              <button key={key} role="tab" id={`tab-${key}`} aria-controls="history-panel" aria-selected={tab === key}
                tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    const next: Tab = tab === 'mentoring' ? 'specialist' : 'mentoring'
                    setTab(next)
                    document.getElementById(`tab-${next}`)?.focus()
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors ${
                  tab === key ? 'bg-white text-navy' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 md:p-7 overflow-y-auto bg-slate-50" role="tabpanel" id="history-panel" aria-labelledby={`tab-${tab}`}>
          {tab === 'mentoring' ? (
            timeline.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">Nenhuma mentoria registrada ainda.</div>
            ) : (
              <>
              {points.length > 0 && (
                <section className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm" aria-label="Evolução da equipe">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Evolução</h3>
                  <EvolutionChart steps={steps} points={points} />
                </section>
              )}
              <Timeline>
                {timeline.map(item => item.type === 'change' ? (
                  <div key={`c${item.c.id}`} className="relative">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 bg-navy ring-navy" />
                    <div className="text-[12px] text-slate-500">
                      <span className="font-bold text-navy">Etapa ajustada pela organização</span>
                      {item.c.step && <> → <span className="font-bold text-orange">{steps.findIndex(s => s.id === item.c.stepId) + 1} — {item.c.step.label}</span></>}
                      <span className="ml-2 text-slate-400">{fmtDateTime(item.c.createdAt)}</span>
                    </div>
                  </div>
                ) : (
                  <MentoringItem key={item.r.id} r={item.r} steps={steps} canEdit={currentUser === item.r.mentor?.email} />
                ))}
              </Timeline>
              </>
            )
          ) : atendimentos.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Nenhum atendimento de especialista ainda.</div>
          ) : (
            <Timeline>
              {atendimentos.map(r => (
                <div key={r.id} className="relative">
                  <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 bg-blue-500 ring-blue-500" />
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <div className="font-display font-bold text-[13px] text-navy">{r.block?.label ?? 'Fora de bloco'}</div>
                    <div className="text-[12px] text-slate-400">{fmtDateTime(r.createdAt)}</div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full md:ml-auto"><MessagesSquare aria-hidden="true" size={12} />{r.mentor?.name}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <Field label="Tema ou dúvida" value={r.topic} dark />
                    <Field label="Orientação dada" value={r.advice} />
                    <Field label="Observações" value={r.obs} />
                    {currentUser === r.mentor?.email && <EditLink id={r.id} />}
                  </div>
                </div>
              ))}
            </Timeline>
          )}
        </div>
      </div>
    </div>
  )
}

function Timeline({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pl-7">
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />
      <div className="space-y-8">{children}</div>
    </div>
  )
}

function MentoringItem({ r, steps, canEdit }: { r: RecordWithRelations; steps: Step[]; canEdit: boolean }) {
  const meta = STATUS[r.status ?? ''] ?? { label: r.status ?? '', pill: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400 ring-slate-400' }
  return (
    <div className="relative">
      <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${meta.dot}`} />
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <div className="font-display font-bold text-[13px] text-navy">{r.block?.label}</div>
        <div className="text-[12px] text-slate-400">{fmtDateTime(r.createdAt)}</div>
        <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${meta.pill}`}><StatusIcon status={r.status} size={12} />{meta.label}</div>
        <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full md:ml-auto"><User aria-hidden="true" size={12} />{r.mentor?.name}</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
        <StepProgress steps={steps} current={r.step ?? null} size="sm" />
        <Field label="Projeto atual" value={r.working} dark />
        <Field label="Orientação do mentor" value={r.advice} />
        <Field label="Pontos positivos" icon={ThumbsUp} value={r.pros} />
        <Field label="A melhorar" icon={Wrench} value={r.cons} />
        {r.obs && (
          <div className="bg-orange/10 rounded-lg p-3 flex gap-2 items-start mt-1">
            <Pin aria-hidden="true" size={14} className="text-orange-dark shrink-0 mt-0.5" />
            <div className="text-[12px] text-orange-dark leading-relaxed">{r.obs}</div>
          </div>
        )}
        <Field label="Sugestão p/ próximo mentor" icon={Lightbulb} value={r.suggestion} />
        {canEdit && <EditLink id={r.id} />}
      </div>
    </div>
  )
}

function EditLink({ id }: { id: string }) {
  return (
    <div className="mt-2 pt-3 border-t border-slate-100 flex justify-end">
      <Link href={`/mentoria/edit/${id}`} className="text-[12px] font-bold text-orange hover:text-orange-dark bg-orange/10 hover:bg-orange/20 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2">
        <Pencil aria-hidden="true" size={13} /> Editar
      </Link>
    </div>
  )
}

function Field({ label, value, dark = false, icon: Icon }: { label: string; value: string | null | undefined; dark?: boolean; icon?: LucideIcon }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">{Icon && <Icon aria-hidden="true" size={11} />}{label}</div>
      <div className={`text-[13px] leading-relaxed whitespace-pre-line ${dark ? 'text-navy font-medium' : 'text-slate-600'}`}>{value}</div>
    </div>
  )
}
