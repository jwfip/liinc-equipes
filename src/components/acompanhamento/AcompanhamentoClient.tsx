'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, CircleCheck, TriangleAlert, Users } from 'lucide-react'
import PersonProfile from './PersonProfile'
import MatchingPanel from './MatchingPanel'
import type { MatchingRow } from '@/lib/event-data'
import HistoryModal from '@/components/painel/HistoryModal'
import { summaryBoxProps } from '@/components/painel/summary-props'
import type { TeamSummary } from '@/components/painel/SummaryBox'
import { StatusIcon } from '@/components/ui/StatusIcon'
import { eventAlerts } from '@/lib/alerts'
import { sortForFollowUp, recentMentors, groupPeople, type EventPerson } from '@/lib/follow-up'
import { currentProject, heldBlockIds, type ProjectRow } from '@/lib/project'
import { blockRankOf, getLatestByTeam, splitByKind, type StepChange } from '@/lib/records'
import { todayISO } from '@/lib/format'
import type { RecordWithRelations, Step } from '@/lib/constants'

type Team  = { id: string; number: number; name: string }
type Block = { id: number; label: string; date: string; active: boolean }

interface Props {
  eventName:          string
  initialRecords:     RecordWithRelations[]
  initialStepChanges: StepChange[]
  initialSummaries:   TeamSummary[]
  initialProjects:    ProjectRow[]
  teams:              Team[]
  steps:              Step[]
  blocks:             Block[]
  canCorrectProject:  boolean
  currentUser:        string
  people:             EventPerson[]
  initialMatchings:   MatchingRow[]
}

const time = (d: string | Date | null) => (d ? new Date(d).getTime() : 0)

/** Tela do facilitador: equipes com sinais de que podem estar ficando para trás, com o motivo e as evidências. */
export default function AcompanhamentoClient({
  eventName, initialRecords, initialStepChanges, initialSummaries, initialProjects, teams, steps, blocks: initialBlocks, canCorrectProject, currentUser, people, initialMatchings,
}: Props) {
  const [matchings, setMatchings] = useState(initialMatchings)
  const missingProfiles = people.filter(p => p.active && !p.area && !p.experience).length
  const [profile, setProfile] = useState<EventPerson | null>(null)
  const personById = new Map(people.map(p => [p.id, p]))
  const groups = groupPeople(people)
  const [records, setRecords]         = useState(initialRecords)
  const [stepChanges, setStepChanges] = useState(initialStepChanges)
  const [summaries, setSummaries]     = useState(initialSummaries)
  const [projects, setProjects]       = useState(initialProjects)
  const [blocks, setBlocks]           = useState(initialBlocks)
  const [historyTeam, setHistoryTeam] = useState<Team | null>(null)

  const reload = useCallback(async () => {
    try {
      const res  = await fetch(`/api/records?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data?.records)) setRecords(data.records)
      if (Array.isArray(data?.stepChanges)) setStepChanges(data.stepChanges)
      if (Array.isArray(data?.summaries)) setSummaries(data.summaries)
      if (Array.isArray(data?.projects)) setProjects(data.projects)
      if (Array.isArray(data?.blocks)) setBlocks(data.blocks)
    } catch { /* tenta de novo no próximo ciclo */ }
  }, [])

  useEffect(() => {
    const id = setInterval(reload, 5000)
    return () => clearInterval(id)
  }, [reload])

  const today = todayISO()
  const { mentoring, specialist } = splitByKind(records)
  const latestByTeam = getLatestByTeam(mentoring, blockRankOf(blocks))
  const alerts = useMemo(
    () => eventAlerts({ teams, records, stepChanges, projects, blocks, today, steps }),
    [teams, records, stepChanges, projects, blocks, today, steps],
  )
  const statusByTeam = Object.fromEntries(teams.map(t => [t.id, latestByTeam[t.id]?.status]))
  const { flagged, clear } = sortForFollowUp(teams, alerts, statusByTeam)
  const held = heldBlockIds(blocks, mentoring)
  const startedBlocks = blocks.filter(b => b.date <= today && held.has(b.id))
  const activeBlock = blocks.find(b => b.active)

  const row = (team: Team) => {
    const project = currentProject(projects, team.id)
    const mentors = recentMentors(mentoring, startedBlocks, team.id)
    const teamAlerts = alerts[team.id] ?? []
    return (
      <li key={team.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="font-display font-bold text-[13px] px-2.5 py-1 rounded-md bg-navy text-white shrink-0">#{team.number}</span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold text-[15px] text-navy">{team.name}</h3>
              <StatusIcon status={latestByTeam[team.id]?.status} size={15} />
            </div>
            {teamAlerts.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {teamAlerts.map(a => (
                  <li key={a.code} className="text-[13px] font-semibold text-orange-dark flex items-start gap-1.5">
                    <TriangleAlert aria-hidden="true" size={14} className="shrink-0 mt-0.5" />{a.text}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[12px] text-slate-600 mt-2 line-clamp-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Projeto</span>
              {project?.description ?? 'ainda não registrado'}
            </p>
            <p className="text-[12px] text-slate-600 mt-0.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Mentores</span>
              {mentors.length ? mentors.map((m, i) => {
                const person = personById.get(m.mentorId)
                return (
                  <span key={`${m.mentorId}-${m.block}`}>
                    {i > 0 && ', '}
                    {person
                      ? <button type="button" onClick={() => setProfile(person)} className="font-semibold text-navy underline decoration-dotted underline-offset-2 hover:text-orange-dark">{m.name}</button>
                      : m.name}
                    {` (${m.block})`}
                  </span>
                )
              }) : 'nenhuma mentoria nos últimos blocos'}
            </p>
          </div>
          <button type="button" onClick={() => setHistoryTeam(team)}
            className="btn-secondary text-xs shrink-0 inline-flex items-center gap-1.5">
            <History aria-hidden="true" size={14} />Histórico
          </button>
        </div>
        <MatchingPanel teamId={team.id} matching={matchings.find(m => m.teamId === team.id)}
          records={records.filter(r => r.teamId === team.id)} personById={personById} missingProfiles={missingProfiles}
          onProfile={setProfile}
          onGenerated={row => setMatchings(ms => [...ms.filter(m => m.teamId !== row.teamId), row])} />
      </li>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-24">
      <header className="mb-6">
        <h2 className="font-display font-bold text-2xl text-navy">Acompanhamento</h2>
        <p className="text-slate-500 text-sm mt-1">
          {eventName}{activeBlock ? ` · ${activeBlock.label} ativo` : ' · nenhum bloco ativo'}
        </p>
        <p className="text-slate-500 text-xs mt-2">Equipes com sinais de que podem estar ficando para trás. Abra o histórico para ver as evidências e quem mentorou.</p>
      </header>

      {flagged.length === 0 ? (
        <div className="card text-center py-10">
          <CircleCheck aria-hidden="true" size={32} className="mx-auto mb-2 text-green-600" />
          <p className="font-display font-bold text-navy">Nenhuma equipe com alerta agora.</p>
        </div>
      ) : (
        <ul className="space-y-3">{flagged.map(row)}</ul>
      )}

      {clear.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-bold text-slate-500">Sem alertas ({clear.length})</summary>
          <ul className="space-y-3 mt-3">{clear.map(row)}</ul>
        </details>
      )}

      {people.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-bold text-slate-500 inline-flex items-center gap-1.5">
            <Users aria-hidden="true" size={15} />Mentores e especialistas do evento ({people.length})
          </summary>
          {([['mentor', 'Mentores'], ['specialist', 'Especialistas']] as const).map(([role, title]) => groups[role].length > 0 && (
            <section key={role} className="mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</h3>
              <ul className="space-y-2">
                {groups[role].map(p => (
                  <li key={p.id} className="bg-white border border-slate-200 rounded-xl p-3">
                    <p className="font-display font-bold text-[14px] text-navy">{p.name}</p>
                    <p className={`text-[12px] mt-0.5 ${p.area ? 'text-navy font-semibold' : 'text-slate-400 italic'}`}>{p.area ?? 'Perfil não preenchido'}</p>
                    {p.experience && <p className="text-[12px] text-slate-600 mt-1 line-clamp-3 whitespace-pre-line">{p.experience}</p>}
                    {p.experience && (
                      <button type="button" onClick={() => setProfile(p)} className="text-xs font-bold text-orange hover:text-orange-dark mt-1">ver mais</button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </details>
      )}

      {profile && <PersonProfile person={profile} onClose={() => setProfile(null)} />}

      {historyTeam && (
        <HistoryModal
          team={historyTeam}
          mentoring={mentoring.filter(r => r.teamId === historyTeam.id)}
          specialist={specialist.filter(r => r.teamId === historyTeam.id)}
          stepChanges={stepChanges.filter(c => c.teamId === historyTeam.id).sort((a, b) => time(b.createdAt) - time(a.createdAt))}
          steps={steps}
          initialTab="mentoring"
          mentoringSummary={summaryBoxProps(records, summaries, historyTeam.id, 'mentoring', reload)}
          specialistSummary={summaryBoxProps(records, summaries, historyTeam.id, 'specialist', reload)}
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
