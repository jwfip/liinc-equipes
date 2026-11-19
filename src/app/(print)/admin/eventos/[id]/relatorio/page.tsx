import { notFound, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { MessagesSquare, User } from 'lucide-react'
import { auth } from '@/auth'
import { db } from '@/db'
import { events, eventMembers, teamSummaries } from '@/schema'
import { getEventProjects, getEventSteps, getEventStepChanges } from '@/lib/event-data'
import { projectContext } from '@/lib/project'
import { currentStepFor, getLatestByTeam } from '@/lib/records'
import { evolutionPoints } from '@/lib/evolution'
import { parseHidden, type ReportSection } from '@/lib/report/options'
import { STATUS_ORDER, type StatusValue } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import { StatusIcon } from '@/components/ui/StatusIcon'
import EvolutionChart from '@/components/painel/EvolutionChart'
import ReportToolbar from '@/components/report/ReportToolbar'
import FinalSummaryEditor from '@/components/report/FinalSummaryEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Relatório final — Liinc Mentorias' }

const TZ = 'America/Sao_Paulo'
const STATUS: Record<StatusValue, { label: string; pill: string; bar: string }> = {
  emergency: { label: 'Emergência', pill: 'bg-red-100 text-red-700 border-red-200',          bar: 'bg-red-600'    },
  attention: { label: 'Atenção',    pill: 'bg-yellow-100 text-yellow-800 border-yellow-200', bar: 'bg-yellow-500' },
  ok:        { label: 'No caminho', pill: 'bg-green-100 text-green-700 border-green-200',    bar: 'bg-green-600'  },
  flying:    { label: 'Voando',     pill: 'bg-blue-100 text-blue-700 border-blue-200',       bar: 'bg-blue-600'   },
}
const fmtDateTime = (d: Date | string | null) => d
  ? new Date(d).toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

function StatusPill({ status }: { status: string | null }) {
  const meta = STATUS[status as StatusValue]
  if (!meta) return null
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.pill}`}>
      <StatusIcon status={status} size={11} />{meta.label}
    </span>
  )
}
function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-[12px] leading-snug whitespace-pre-line text-slate-700">{value}</div>
    </div>
  )
}

export default async function FinalReportPage({ params, searchParams }: {
  params: { id: string }; searchParams: { ocultar?: string | string[] }
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin' || session.user.mustChangePassword) redirect('/painel')
  const eventId = Number(params.id)
  const event = Number.isInteger(eventId) ? await db.query.events.findFirst({ where: eq(events.id, eventId) }) : undefined
  if (!event) notFound()

  const hidden = parseHidden(searchParams.ocultar)
  const show = (s: ReportSection) => !hidden.has(s)

  const [records, allTeams, blocks, steps, stepChanges, members, finals, projects] = await Promise.all([
    db.query.mentoringRecords.findMany({
      where: (r, { eq }) => eq(r.eventId, eventId),
      columns: { audioTranscript: false },
      with: { mentor: { columns: { id: true, name: true } }, block: true, step: true },
      orderBy: (r, { asc }) => [asc(r.createdAt)],
    }),
    db.query.teams.findMany({ where: (t, { eq }) => eq(t.eventId, eventId), orderBy: (t, { asc }) => [asc(t.number)] }),
    db.query.blocks.findMany({ where: (b, { eq }) => eq(b.eventId, eventId), orderBy: (b, { asc }) => [asc(b.date)] }),
    getEventSteps(eventId),
    getEventStepChanges(eventId),
    db.select({ role: eventMembers.role }).from(eventMembers).where(eq(eventMembers.eventId, eventId)),
    db.select().from(teamSummaries).where(and(eq(teamSummaries.eventId, eventId), eq(teamSummaries.kind, 'final'))),
    getEventProjects(eventId),
  ])

  const mentoring = records.filter(r => r.kind === 'mentoring')
  const atendimentos = records.filter(r => r.kind === 'specialist')
  const teamIdsWithRecords = new Set(records.map(r => r.teamId))
  const teams = allTeams.filter(t => t.active || teamIdsWithRecords.has(t.id))
  const latestByTeam = getLatestByTeam(mentoring)
  const finalByTeam = new Map(finals.map(f => [f.teamId, f]))

  const statusCount: Record<StatusValue, number> = { emergency: 0, attention: 0, ok: 0, flying: 0 }
  for (const t of teams) {
    const s = latestByTeam[t.id]?.status as StatusValue | undefined
    if (s && s in statusCount) statusCount[s]++
  }
  const maxStatus = Math.max(1, ...Object.values(statusCount))
  const mentorCount = members.filter(m => m.role === 'mentor').length
  const specialistCount = members.filter(m => m.role === 'specialist').length

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-navy">
      <style>{`
        @page { size: A4; margin: 14mm 12mm; }
        @media print {
          html, body { background: #fff !important; color: #000222 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .page-break { break-before: page; page-break-before: always; }
        }
      `}</style>

      <ReportToolbar
        eventId={eventId}
        hidden={Array.from(hidden)}
        teams={teams.filter(t => teamIdsWithRecords.has(t.id)).map(t => ({ id: t.id, name: t.name, number: t.number }))}
        finals={finals.map(f => ({ teamId: f.teamId, editedByAdmin: f.editedByAdmin }))}
      />

      <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 my-6 shadow-sm rounded-2xl print:my-0 print:p-0 print:shadow-none print:rounded-none print:max-w-none">
        {/* Capa */}
        <section aria-label="Capa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/liinc-logo.svg" alt="Liinc" width={150} height={35} className="h-9 w-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-orange-dark mt-10">Relatório final</p>
          <h1 className="font-display font-bold text-3xl mt-2 leading-tight">{event.name}</h1>
          {event.company && <p className="text-lg text-slate-600 mt-1">{event.company}</p>}
          <p className="text-sm text-slate-500 mt-2">
            {fmtDate(event.startDate)}{event.endDate ? ` a ${fmtDate(event.endDate)}` : ''} · gerado em {fmtDateTime(new Date())}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
            {[
              ['Equipes', teams.length], ['Mentores', mentorCount], ['Especialistas', specialistCount],
              ['Mentorias', mentoring.length], ['Atendimentos', atendimentos.length],
            ].map(([label, value]) => (
              <div key={label as string} className="border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                <div className="font-display font-bold text-2xl">{value}</div>
              </div>
            ))}
          </div>

          <h2 className="font-display font-bold text-sm mt-8 mb-3">Situação final das equipes</h2>
          <div className="space-y-2">
            {STATUS_ORDER.map(s => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-28 shrink-0"><StatusPill status={s} /></span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${STATUS[s].bar}`} style={{ width: `${(statusCount[s] / maxStatus) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-sm">{statusCount[s]}</span>
              </div>
            ))}
          </div>

          {steps.length > 0 && (
            <>
              <h2 className="font-display font-bold text-sm mt-8 mb-2">Etapas do processo</h2>
              <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {steps.map((s, i) => <li key={s.id}><span className="font-bold text-navy">{i + 1}.</span> {s.label}</li>)}
              </ol>
            </>
          )}
          {blocks.length > 0 && <p className="text-xs text-slate-500 mt-4">{blocks.length} bloco(s) de mentoria: {blocks.map(b => b.label).join(', ')}.</p>}
        </section>

        {/* Uma seção por equipe */}
        {teams.map(t => {
          const tm = mentoring.filter(r => r.teamId === t.id)
          const ta = atendimentos.filter(r => r.teamId === t.id)
          const changes = stepChanges.filter(c => c.teamId === t.id)
          const latest = latestByTeam[t.id]
          const step = currentStepFor(latest, changes).step
          const stepIdx = step ? steps.findIndex(s => s.id === step.id) : -1
          const pts = evolutionPoints(steps, tm, changes)
          const final = finalByTeam.get(t.id)
          const mentorNames = Array.from(new Set(tm.map(r => r.mentor?.name).filter(Boolean)))
          const proj = projectContext(projects, t.id)

          return (
            <article key={t.id} className="page-break pt-10 print:pt-0 border-t-4 border-orange mt-10 print:mt-0 print:border-t-0">
              <header className="avoid-break mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Equipe #{t.number}</p>
                <h2 className="font-display font-bold text-2xl leading-tight">{t.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                  <StatusPill status={latest?.status ?? null} />
                  {stepIdx >= 0 && <span className="font-bold text-orange-dark">Etapa {stepIdx + 1} — {steps[stepIdx].label}</span>}
                  <span>· {tm.length} mentoria(s){show('atendimentos') ? ` · ${ta.length} atendimento(s)` : ''}</span>
                  {mentorNames.length > 0 && <span>· Mentores: {mentorNames.join(', ')}</span>}
                </div>
              </header>

              {proj.current && (
                <div className="avoid-break border border-slate-200 rounded-xl p-3.5 mb-4">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Projeto atual</div>
                  <p className="text-[13px] leading-relaxed whitespace-pre-line">{proj.current}</p>
                  {proj.pivots.length > 0 && (
                    <ul className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                      {proj.pivots.map((p, i) => (
                        <li key={i}><span className="font-bold text-orange-dark">Pivô em {fmtDateTime(p.at ?? null)}:</span> {p.description}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <FinalSummaryEditor teamId={t.id} content={final?.content ?? null} edited={!!final?.editedByAdmin} />

              {show('chart') && pts.length > 0 && (
                <div className="avoid-break border border-slate-200 rounded-xl p-3.5 mb-4">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Evolução</div>
                  <EvolutionChart steps={steps} points={pts} fit />
                </div>
              )}

              {show('timeline') && tm.length > 0 && (
                <section className="mb-4">
                  <h3 className="font-display font-bold text-sm mb-2">Mentorias</h3>
                  <div className="space-y-2.5">
                    {tm.map(r => {
                      const i = steps.findIndex(s => s.id === r.stepId)
                      return (
                        <div key={r.id} className="avoid-break border border-slate-200 rounded-xl p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5 pb-1.5 border-b border-slate-100">
                            <span className="font-display font-bold text-[12px]">{r.block?.label ?? 'Sem bloco'}</span>
                            <span className="text-[11px] text-slate-500">{fmtDateTime(r.createdAt)}</span>
                            <StatusPill status={r.status} />
                            {i >= 0 && <span className="text-[11px] text-orange-dark font-bold">Etapa {i + 1} — {steps[i].label}</span>}
                            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-slate-600"><User aria-hidden="true" size={12} />{r.mentor?.name ?? '—'}</span>
                          </div>
                          <div className="grid gap-1.5">
                            <Field label="Trabalhou em" value={r.working} />
                            <Field label="Orientação" value={r.advice} />
                            <Field label="Pontos positivos" value={r.pros} />
                            {show('cons') && <Field label="A melhorar" value={r.cons} />}
                            {show('obs') && <Field label="Observações para facilitadores" value={r.obs} />}
                            {show('suggestion') && <Field label="Sugestão ao próximo mentor" value={r.suggestion} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {show('atendimentos') && ta.length > 0 && (
                <section>
                  <h3 className="font-display font-bold text-sm mb-2 flex items-center gap-1.5"><MessagesSquare aria-hidden="true" size={15} />Atendimentos de especialistas</h3>
                  <div className="space-y-2">
                    {ta.map(a => (
                      <div key={a.id} className="avoid-break border border-blue-100 bg-blue-50/40 rounded-xl p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-display font-bold text-[12px]">{a.block?.label ?? 'Fora de bloco'}</span>
                          <span className="text-[11px] text-slate-500">{fmtDateTime(a.createdAt)}</span>
                          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-blue-700"><User aria-hidden="true" size={12} />{a.mentor?.name ?? '—'}</span>
                        </div>
                        <div className="grid gap-1.5">
                          <Field label="Tema ou dúvida" value={a.topic} />
                          <Field label="Orientação dada" value={a.advice} />
                          {show('obs') && <Field label="Observações" value={a.obs} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {tm.length === 0 && ta.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum registro para esta equipe.</p>}
            </article>
          )
        })}
      </div>
    </div>
  )
}
