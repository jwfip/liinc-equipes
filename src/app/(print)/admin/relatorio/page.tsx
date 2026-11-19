import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { STATUS_ORDER, type StatusValue } from '@/lib/constants'
import { getEventContext } from '@/lib/event-context'
import { getEventSteps } from '@/lib/event-data'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Relatório do Evento — Liinc Mentorias' }

const TZ = 'America/Sao_Paulo'

const STATUS: Record<StatusValue, { label: string; pill: string; bar: string }> = {
  emergency: { label: '🚨 Emergência', pill: 'bg-red-100 text-red-700 border-red-200',          bar: 'bg-red-600'    },
  attention: { label: '⚠️ Atenção',    pill: 'bg-yellow-100 text-yellow-800 border-yellow-200', bar: 'bg-yellow-500' },
  ok:        { label: '🛣️ No caminho', pill: 'bg-green-100 text-green-700 border-green-200',    bar: 'bg-green-600'  },
  flying:    { label: '🚀 Voando',     pill: 'bg-blue-100 text-blue-700 border-blue-200',       bar: 'bg-blue-600'   },
}

function fmtDateTime(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function makeStepLabel(steps: { id: number; label: string }[]) {
  return (stepId: number | null | undefined) => {
    const i = steps.findIndex(s => s.id === stepId)
    return i >= 0 ? `${i + 1} — ${steps[i].label}` : '—'
  }
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS[status as StatusValue]
  if (!meta) return <span className="text-xs">{status}</span>
  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.pill}`}>
      {meta.label}
    </span>
  )
}

export default async function RelatorioPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/painel')
  const ctx = await getEventContext()
  if (!ctx.event) redirect('/admin/eventos')
  const eventId = ctx.event.id

  const [records, allTeams, allMentors, allBlocks, steps, atendimentos] = await Promise.all([
    db.query.mentoringRecords.findMany({
      where: (r, { and, eq }) => and(eq(r.eventId, eventId), eq(r.kind, 'mentoring')),
      with: { team: true, mentor: true, block: true },
      orderBy: (r, { asc }) => [asc(r.blockId), asc(r.createdAt)],
    }),
    db.query.teams.findMany({ where: (t, { eq }) => eq(t.eventId, eventId), orderBy: (t, { asc }) => [asc(t.number)] }),
    db.query.mentors.findMany({ orderBy: (m, { asc }) => [asc(m.name)] }),
    db.query.blocks.findMany({ where: (b, { eq }) => eq(b.eventId, eventId), orderBy: (b, { asc }) => [asc(b.id)] }),
    getEventSteps(eventId),
    db.query.mentoringRecords.findMany({
      where: (r, { and, eq }) => and(eq(r.eventId, eventId), eq(r.kind, 'specialist')),
      with: { mentor: true, block: true },
      orderBy: (r, { asc }) => [asc(r.createdAt)],
    }),
  ])
  const atendimentosByTeam = new Map<string, typeof atendimentos>()
  for (const a of atendimentos) atendimentosByTeam.set(a.teamId, [...(atendimentosByTeam.get(a.teamId) ?? []), a])
  const stepLabel = makeStepLabel(steps)

  // Equipes no relatório: ativas + inativas que tenham registros
  const teamIdsWithRecords = new Set([...records, ...atendimentos].map(r => r.teamId))
  const teams = allTeams.filter(t => t.active || teamIdsWithRecords.has(t.id))

  const recordsByTeam = new Map<string, typeof records>()
  for (const r of records) {
    const list = recordsByTeam.get(r.teamId) ?? []
    list.push(r)
    recordsByTeam.set(r.teamId, list)
  }

  // Registro mais recente = maior blockId, depois maior createdAt (já ordenado assim)
  const latestByTeam = new Map<string, (typeof records)[number]>()
  recordsByTeam.forEach((list, teamId) => latestByTeam.set(teamId, list[list.length - 1]))

  const statusCount: Record<StatusValue, number> = { emergency: 0, attention: 0, ok: 0, flying: 0 }
  latestByTeam.forEach(r => {
    if (r.status && r.status in statusCount) statusCount[r.status as StatusValue]++
  })
  const teamsWithoutMentoring = teams.filter(t => !latestByTeam.has(t.id)).length

  const mentorStats = allMentors
    .map(m => {
      const mine = records.filter(r => r.mentorId === m.id)
      return { ...m, count: mine.length, teams: new Set(mine.map(r => r.teamId)).size }
    })
    .filter(m => m.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const blockStats = allBlocks.map(b => {
    const mine = records.filter(r => r.blockId === b.id)
    const byStatus: Record<StatusValue, number> = { emergency: 0, attention: 0, ok: 0, flying: 0 }
    mine.forEach(r => { if (r.status && r.status in byStatus) byStatus[r.status as StatusValue]++ })
    return { ...b, count: mine.length, teams: new Set(mine.map(r => r.teamId)).size, byStatus }
  })

  const teamsSorted = [...teams].sort((a, b) => a.number - b.number)
  const maxStatus = Math.max(1, ...Object.values(statusCount))

  return (
    <div className="report min-h-screen bg-slate-100 text-navy print:bg-white">
      <style>{`
        @page { size: A4; margin: 14mm 12mm; }
        @media print {
          html, body { background: #fff !important; color: #1A2744 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .page-break { break-before: page; page-break-before: always; }
        }
      `}</style>

      {/* Barra de ações (não impressa) */}
      <div className="print:hidden sticky top-0 z-10 bg-navy text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/admin/eventos" className="text-sm text-slate-300 hover:text-white">← Voltar</Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-400">Na janela de impressão, escolha “Salvar como PDF”</span>
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 my-6 shadow-sm rounded-2xl print:my-0 print:p-0 print:shadow-none print:rounded-none print:max-w-none">
        {/* Capa / cabeçalho */}
        <header className="border-b-4 border-orange pb-5 mb-6">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-3xl text-orange tracking-tighter">Liinc</span>
            <div className="w-px h-8 bg-slate-300" />
            <span className="font-display font-semibold text-lg">Mentorias</span>
          </div>
          <h1 className="font-display font-bold text-2xl mt-4">Relatório — {ctx.event.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerado em {fmtDateTime(new Date())}
            {allBlocks.length > 0 && <> · {fmtDate(allBlocks[0].date)} a {fmtDate(allBlocks[allBlocks.length - 1].date)}</>}
          </p>
        </header>

        {/* Números gerais */}
        <section className="avoid-break mb-8">
          <h2 className="font-display font-bold text-lg mb-3">Resumo</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Mentorias registradas', value: records.length },
              { label: 'Equipes', value: teams.length },
              { label: 'Mentores participantes', value: mentorStats.filter(m => m.count > 0).length },
              { label: 'Blocos', value: allBlocks.length },
            ].map(s => (
              <div key={s.label} className="border border-slate-200 rounded-xl p-3">
                <div className="font-display font-bold text-2xl">{s.value}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">{s.label}</div>
              </div>
            ))}
          </div>

          <h3 className="font-display font-semibold text-sm mt-6 mb-2 text-slate-600">Situação atual das equipes (último registro)</h3>
          <div className="space-y-1.5">
            {STATUS_ORDER.map(s => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <div className="w-32 shrink-0">{STATUS[s].label}</div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${STATUS[s].bar}`} style={{ width: `${(statusCount[s] / maxStatus) * 100}%` }} />
                </div>
                <div className="w-8 text-right font-bold">{statusCount[s]}</div>
              </div>
            ))}
            {teamsWithoutMentoring > 0 && (
              <p className="text-xs text-slate-500 pt-1">{teamsWithoutMentoring} equipe(s) sem nenhuma mentoria registrada.</p>
            )}
          </div>
        </section>

        {/* Visão geral por equipe */}
        <section className="mb-8">
          <h2 className="font-display font-bold text-lg mb-3">Visão geral por equipe</h2>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b-2 border-navy text-left">
                <th className="py-1.5 pr-2">#</th>
                <th className="py-1.5 pr-2">Equipe</th>
                <th className="py-1.5 pr-2">Status atual</th>
                <th className="py-1.5 pr-2">Etapa</th>
                <th className="py-1.5 pr-2 text-center">Mentorias</th>
                <th className="py-1.5">Último mentor</th>
              </tr>
            </thead>
            <tbody>
              {teamsSorted.map(t => {
                const last = latestByTeam.get(t.id)
                return (
                  <tr key={t.id} className="border-b border-slate-200 avoid-break">
                    <td className="py-1.5 pr-2 font-bold text-orange">{t.number}</td>
                    <td className="py-1.5 pr-2 font-medium">
                      {t.name}{!t.active && <span className="text-slate-400 text-[10px]"> (inativa)</span>}
                    </td>
                    <td className="py-1.5 pr-2">{last ? <StatusPill status={last.status ?? ''} /> : <span className="text-slate-400">—</span>}</td>
                    <td className="py-1.5 pr-2">{last ? stepLabel(last.stepId) : '—'}</td>
                    <td className="py-1.5 pr-2 text-center">{recordsByTeam.get(t.id)?.length ?? 0}</td>
                    <td className="py-1.5">{last?.mentor?.name ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* Blocos */}
        <section className="avoid-break mb-8">
          <h2 className="font-display font-bold text-lg mb-3">Mentorias por bloco</h2>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b-2 border-navy text-left">
                <th className="py-1.5 pr-2">Bloco</th>
                <th className="py-1.5 pr-2">Data</th>
                <th className="py-1.5 pr-2 text-center">Mentorias</th>
                <th className="py-1.5 pr-2 text-center">Equipes</th>
                {STATUS_ORDER.map(s => <th key={s} className="py-1.5 pr-2 text-center whitespace-nowrap">{STATUS[s].label}</th>)}
              </tr>
            </thead>
            <tbody>
              {blockStats.map(b => (
                <tr key={b.id} className="border-b border-slate-200">
                  <td className="py-1.5 pr-2 font-medium">{b.label}</td>
                  <td className="py-1.5 pr-2">{fmtDate(b.date)}</td>
                  <td className="py-1.5 pr-2 text-center font-bold">{b.count}</td>
                  <td className="py-1.5 pr-2 text-center">{b.teams}</td>
                  {STATUS_ORDER.map(s => <td key={s} className="py-1.5 pr-2 text-center">{b.byStatus[s] || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Mentores */}
        <section className="avoid-break mb-8">
          <h2 className="font-display font-bold text-lg mb-3">Participação dos mentores</h2>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b-2 border-navy text-left">
                <th className="py-1.5 pr-2">Mentor</th>
                <th className="py-1.5 pr-2 text-center">Mentorias</th>
                <th className="py-1.5 text-center">Equipes atendidas</th>
              </tr>
            </thead>
            <tbody>
              {mentorStats.map(m => (
                <tr key={m.id} className="border-b border-slate-200">
                  <td className="py-1.5 pr-2 font-medium">{m.name}</td>
                  <td className="py-1.5 pr-2 text-center font-bold">{m.count}</td>
                  <td className="py-1.5 text-center">{m.teams}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Histórico detalhado */}
        <section className="page-break">
          <h2 className="font-display font-bold text-lg mb-1">Histórico detalhado por equipe</h2>
          <p className="text-xs text-slate-500 mb-5">Todas as mentorias registradas, em ordem cronológica.</p>

          {teamsSorted.map((t, i) => {
            const list = recordsByTeam.get(t.id) ?? []
            const mentorsOfTeam = Array.from(new Set(list.map(r => r.mentor?.name).filter(Boolean)))
            return (
              <article key={t.id} className={`mb-8 ${i > 0 ? 'page-break' : ''}`}>
                <div className="avoid-break bg-navy text-white rounded-xl px-4 py-3 mb-4">
                  <div className="text-[10px] uppercase tracking-wider text-white/60 font-bold">Equipe #{t.number}</div>
                  <div className="font-display font-bold text-xl leading-tight">{t.name}</div>
                  <div className="text-[11px] text-white/70 mt-1">
                    {list.length} mentoria(s) · Mentores: {mentorsOfTeam.length ? mentorsOfTeam.join(', ') : 'nenhum'}
                  </div>
                </div>

                {list.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nenhuma mentoria registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {list.map(r => (
                      <div key={r.id} className="avoid-break border border-slate-200 rounded-xl p-3.5">
                        <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                          <span className="font-display font-bold text-[13px]">{r.block?.label}</span>
                          <span className="text-[11px] text-slate-500">{fmtDateTime(r.createdAt)}</span>
                          <StatusPill status={r.status ?? ''} />
                          <span className="text-[11px] text-orange font-bold">Etapa {stepLabel(r.stepId)}</span>
                          <span className="ml-auto text-[11px] font-bold text-slate-600">👤 {r.mentor?.name ?? '—'}</span>
                        </div>
                        <div className="grid gap-2">
                          <Field label="Projeto atual" value={r.working} />
                          <Field label="Orientação do mentor" value={r.advice} />
                          <Field label="✅ Pontos positivos" value={r.pros} />
                          <Field label="🔧 A melhorar" value={r.cons} />
                          <Field label="📌 Observações" value={r.obs} />
                          <Field label="💡 Sugestão p/ próximo mentor" value={r.suggestion} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(atendimentosByTeam.get(t.id) ?? []).length > 0 && (
                  <div className="mt-5">
                    <h3 className="font-display font-bold text-sm mb-2">💬 Atendimentos de especialistas</h3>
                    <div className="space-y-2">
                      {atendimentosByTeam.get(t.id)!.map(a => (
                        <div key={a.id} className="avoid-break border border-blue-100 bg-blue-50/40 rounded-xl p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-display font-bold text-[12px]">{a.block?.label ?? 'Fora de bloco'}</span>
                            <span className="text-[11px] text-slate-500">{fmtDateTime(a.createdAt)}</span>
                            <span className="ml-auto text-[11px] font-bold text-blue-700">💬 {a.mentor?.name ?? '—'}</span>
                          </div>
                          <div className="grid gap-1.5">
                            <Field label="Tema ou dúvida" value={a.topic} />
                            <Field label="Orientação dada" value={a.advice} />
                            <Field label="Observações" value={a.obs} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-[12px] leading-snug whitespace-pre-line text-slate-700">{value}</div>
    </div>
  )
}
