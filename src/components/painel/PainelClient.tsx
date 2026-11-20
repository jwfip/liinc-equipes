'use client'

import { useState, useEffect, useCallback } from 'react'
import { STATUS_ORDER, type RecordWithRelations, type Step } from '@/lib/constants'
import {
  blockRankOf, getLatestByTeam, splitByKind, countByTeam, groupTeams, currentStepFor, defaultHistoryTab, type StepChange,
} from '@/lib/records'
import SummaryStrip from './SummaryStrip'
import FilterBar    from './FilterBar'
import TeamCard     from './TeamCard'
import HistoryModal from './HistoryModal'
import type { TeamSummary } from './SummaryBox'
import { summaryBoxProps } from './summary-props'
import type { EventRole } from '@/lib/event-pick'
import { currentProject, recentPivot, recentBlockIds, heldBlockIds, type ProjectRow } from '@/lib/project'
import { todayISO } from '@/lib/format'

type Team = { id: string; number: number; name: string; active: boolean }

interface Props {
  initialRecords:     RecordWithRelations[]
  initialStepChanges: StepChange[]
  initialSummaries:   TeamSummary[]
  teams:              Team[]
  steps:              Step[]
  activeBlock:        { label: string } | null
  currentUser:        string
  viewerRole:         EventRole | null
  isAdmin:            boolean
  initialProjects:    ProjectRow[]
  blocks:             { id: number; label: string; date: string; active: boolean }[]
  canCorrectProject:  boolean
}

const SECTION_META: Record<string, { title: string; dot: string }> = {
  emergency: { title: 'Emergência', dot: 'bg-red-600' },
  attention: { title: 'Atenção',    dot: 'bg-yellow-600' },
  ok:        { title: 'No caminho', dot: 'bg-green-600' },
  flying:    { title: 'Voando',     dot: 'bg-blue-600' },
}
const DOT: Record<string, string> = { emergency: 'bg-red-600', attention: 'bg-yellow-600', ok: 'bg-green-600', flying: 'bg-blue-600' }
const time = (d: string | Date | null) => (d ? new Date(d).getTime() : 0)

export default function PainelClient({
  initialRecords, initialStepChanges, initialSummaries, teams, steps, currentUser, viewerRole, isAdmin,
  initialProjects, blocks: initialBlocks, canCorrectProject,
}: Props) {
  const [records, setRecords]           = useState(initialRecords)
  const [stepChanges, setStepChanges]   = useState(initialStepChanges)
  const [summaries, setSummaries]       = useState(initialSummaries)
  const [projects, setProjects]         = useState(initialProjects)
  const [blocks, setBlocks]             = useState(initialBlocks)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [historyTeam, setHistoryTeam]   = useState<Team | null>(null)

  const reload = useCallback(async () => {
    try {
      const res  = await fetch(`/api/records?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data?.records)) setRecords(data.records)
      if (Array.isArray(data?.stepChanges)) setStepChanges(data.stepChanges)
      if (Array.isArray(data?.summaries)) setSummaries(data.summaries)
      if (Array.isArray(data?.projects)) setProjects(data.projects)
      if (Array.isArray(data?.blocks)) setBlocks(data.blocks)
    } catch { /* ignora: tenta de novo no próximo ciclo */ }
  }, [])

  useEffect(() => {
    const id = setInterval(reload, 5000)
    return () => clearInterval(id)
  }, [reload])

  const { mentoring, specialist } = splitByKind(records)
  const latestByTeam = getLatestByTeam(mentoring, blockRankOf(blocks))
  const specialistCount = countByTeam(specialist)
  const recordBlock = new Map(mentoring.filter(r => r.blockId !== null).map(r => [r.id, r.blockId as number]))
  const recentBlocks = recentBlockIds(blocks, todayISO(), 2, heldBlockIds(blocks, mentoring))
  const changesFor = (teamId: string) => stepChanges.filter(c => c.teamId === teamId)
  const summaryProps = (teamId: string, kind: 'mentoring' | 'specialist') => summaryBoxProps(records, summaries, teamId, kind, reload)

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || String(t.number).includes(search)
    const record = latestByTeam[t.id]
    const matchStatus = statusFilter === 'all' || record?.status === statusFilter || (!record && statusFilter === 'none')
    return matchSearch && matchStatus
  })
  const grouped = groupTeams(filtered, latestByTeam)

  const card = (team: Team) => (
    <TeamCard key={team.id} team={team} record={latestByTeam[team.id]} steps={steps}
      current={currentStepFor(latestByTeam[team.id], changesFor(team.id))}
      specialistCount={specialistCount[team.id] ?? 0}
      project={currentProject(projects, team.id)?.description ?? null}
      pivoted={!!recentPivot(projects, team.id, recordBlock, recentBlocks)}
      isAdmin={isAdmin} onAdjusted={reload} onHistoryClick={setHistoryTeam}
      summary={summaryProps(team.id, 'mentoring')} />
  )

  // Distribuição por mentor: só mentorias.
  const mentorsMap: Record<string, Record<string, RecordWithRelations[]>> = {}
  for (const r of mentoring) {
    if (!r.mentor) continue
    const bLabel = r.block?.label || 'Sem bloco'
    ;((mentorsMap[r.mentor.name] ??= {})[bLabel] ??= []).push(r)
  }
  const sortedMentors = Object.entries(mentorsMap).sort((a, b) => a[0].localeCompare(b[0], 'pt'))

  // Atendimentos por especialista.
  const specialistsMap: Record<string, RecordWithRelations[]> = {}
  for (const r of specialist) if (r.mentor) (specialistsMap[r.mentor.name] ??= []).push(r)
  const sortedSpecialists = Object.entries(specialistsMap).sort((a, b) => a[0].localeCompare(b[0], 'pt'))

  return (
    <div className="bg-slate-50 text-slate-900 min-h-full pb-20 font-sans">
      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8">

        <SummaryStrip teams={teams} records={mentoring} latestByTeam={latestByTeam} atendimentos={specialist.length} />

        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-7 shadow-sm">
          <div className="font-display font-bold text-xs text-slate-500 uppercase tracking-wide mb-3">Etapas do processo de inovação</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {steps.length === 0 && <span className="text-xs text-slate-500">Nenhuma etapa configurada para este evento.</span>}
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-5 h-5 rounded-full bg-navy text-white font-display font-bold text-[10px] flex items-center justify-center shrink-0">{i + 1}</div>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <FilterBar search={search} onSearch={setSearch} statusFilter={statusFilter} onStatusFilter={setStatusFilter} />

        {STATUS_ORDER.map(status => {
          const group = grouped[status]
          if (!group.length) return null
          const meta = SECTION_META[status]
          return (
            <section key={status} className="mb-2">
              <div className="flex items-center gap-3 mt-9 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                <h2 className="font-display font-bold text-lg text-navy">{meta.title}</h2>
                <div className="bg-slate-100 text-slate-600 font-display font-bold text-sm px-2.5 py-0.5 rounded-full">{group.length}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5">{group.map(card)}</div>
            </section>
          )
        })}

        {grouped.none.length > 0 && (
          <section className="mb-2">
            <div className="flex items-center gap-3 mt-9 mb-4">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-400" />
              <h2 className="font-display font-bold text-lg text-navy">Sem mentoria ainda</h2>
              <div className="bg-slate-200 text-slate-600 font-display font-bold text-sm px-2.5 py-0.5 rounded-full">{grouped.none.length}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5">{grouped.none.map(card)}</div>
          </section>
        )}

        {sortedMentors.length > 0 && (
          <div className="mt-14 pt-8 border-t-2 border-slate-200">
            <h2 className="font-display font-bold text-2xl text-navy mb-1">Distribuição por Mentor</h2>
            <p className="text-sm text-slate-500 mb-6">Equipes atendidas por cada mentor, organizadas por bloco de mentoria</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedMentors.map(([mentor, byBlock]) => {
                const all = Object.values(byBlock).flat()
                const teamCount = new Set(all.map(r => r.teamId)).size
                return (
                  <PersonCard key={mentor} name={mentor} sub={`${teamCount} equipe${teamCount > 1 ? 's' : ''} · ${all.length} mentoria${all.length > 1 ? 's' : ''}`}>
                    {Object.entries(byBlock).sort().map(([bLabel, recs]) => (
                      <div key={bLabel}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{bLabel}</div>
                        {latestPerTeam(recs).map(({ r, count }) => (
                          <TeamLine key={r.teamId} dot={DOT[r.status ?? ''] ?? 'bg-slate-400'} team={r.team} suffix={count > 1 ? `×${count}` : undefined} />
                        ))}
                      </div>
                    ))}
                  </PersonCard>
                )
              })}
            </div>
          </div>
        )}

        {sortedSpecialists.length > 0 && (
          <div className="mt-14 pt-8 border-t-2 border-slate-200">
            <h2 className="font-display font-bold text-2xl text-navy mb-1">Atendimentos de especialistas</h2>
            <p className="text-sm text-slate-500 mb-6">Dúvidas atendidas por cada especialista</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedSpecialists.map(([name, recs]) => {
                const byTeam = countByTeam(recs)
                const teamsSeen = Array.from(new Map(recs.map(r => [r.teamId, r.team])).values())
                  .sort((a, b) => (a?.number || 0) - (b?.number || 0))
                return (
                  <PersonCard key={name} name={name} accent="bg-blue-600"
                    sub={`${teamsSeen.length} equipe${teamsSeen.length > 1 ? 's' : ''} · ${recs.length} atendimento${recs.length > 1 ? 's' : ''}`}>
                    <div>
                      {teamsSeen.map(t => t && (
                        <TeamLine key={t.id} dot="bg-blue-500" team={t} suffix={byTeam[t.id] > 1 ? `×${byTeam[t.id]}` : undefined} />
                      ))}
                    </div>
                  </PersonCard>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {historyTeam && (
        <HistoryModal
          team={historyTeam}
          mentoring={mentoring.filter(r => r.teamId === historyTeam.id)}
          specialist={specialist.filter(r => r.teamId === historyTeam.id)}
          stepChanges={changesFor(historyTeam.id).sort((a, b) => time(b.createdAt) - time(a.createdAt))}
          steps={steps}
          initialTab={defaultHistoryTab(viewerRole)}
          mentoringSummary={summaryProps(historyTeam.id, 'mentoring')}
          specialistSummary={summaryProps(historyTeam.id, 'specialist')}
          currentUser={currentUser}
          projects={projects.filter(p => p.teamId === historyTeam.id)}
          canCorrectProject={canCorrectProject}
          onProjectChanged={reload}
          onClose={() => setHistoryTeam(null)}
        />
      )}
    </div>
  )
}

/** Uma linha por equipe (status da mentoria mais recente do mentor naquele bloco) + quantidade. */
function latestPerTeam(recs: RecordWithRelations[]) {
  const byTeam = new Map<string, { r: RecordWithRelations; count: number }>()
  for (const r of recs) {
    const cur = byTeam.get(r.teamId)
    const newer = !cur || time(r.createdAt) > time(cur.r.createdAt)
    byTeam.set(r.teamId, { r: newer ? r : cur!.r, count: (cur?.count ?? 0) + 1 })
  }
  return Array.from(byTeam.values()).sort((a, b) => (a.r.team?.number || 0) - (b.r.team?.number || 0))
}

function PersonCard({ name, sub, accent = 'bg-orange', children }: { name: string; sub: string; accent?: string; children: React.ReactNode }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-navy text-white px-4 py-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full ${accent} flex items-center justify-center font-display font-bold text-sm shrink-0`}>{initials}</div>
        <div className="min-w-0">
          <div className="font-display font-bold text-sm truncate">{name}</div>
          <div className="text-[11px] opacity-50">{sub}</div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}

function TeamLine({ dot, team, suffix }: { dot: string; team: { number: number; name: string } | null; suffix?: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-[13px] text-slate-600 border-b border-slate-100 last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="truncate">{team?.number} - {team?.name}</span>
      {suffix && <span className="ml-auto text-[11px] text-slate-500">{suffix}</span>}
    </div>
  )
}
