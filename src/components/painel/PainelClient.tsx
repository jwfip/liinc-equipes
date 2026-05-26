'use client'

import { useState, useEffect } from 'react'
import { STATUS_ORDER, getLatestByTeam, type RecordWithRelations } from '@/lib/constants'
import SummaryStrip from './SummaryStrip'
import FilterBar    from './FilterBar'
import TeamCard     from './TeamCard'
import HistoryModal from './HistoryModal'

type Team = { id: string; number: number; name: string; active: boolean }

interface Props {
  initialRecords: RecordWithRelations[]
  teams:          Team[]
  activeBlock:    { label: string } | null
}

const SECTION_META: Record<string, any> = {
  emergency: { icon: '🚨', title: 'Emergência', dot: 'bg-red-600' },
  attention: { icon: '⚠️',  title: 'Atenção',    dot: 'bg-yellow-600' },
  ok:        { icon: '🛣️', title: 'No caminho', dot: 'bg-green-600' },
  flying:    { icon: '🚀', title: 'Voando',     dot: 'bg-blue-600' },
}

export default function PainelClient({ initialRecords, teams, activeBlock }: Props) {
  const [records, setRecords]           = useState(initialRecords)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [historyTeam, setHistoryTeam]   = useState<Team | null>(null)

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res  = await fetch('/api/records', { cache: 'no-store' })
        const data = await res.json()
        setRecords(data)
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const latestByTeam = getLatestByTeam(records)

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        String(t.number).includes(search)
    const record = latestByTeam[t.id]
    const matchStatus = statusFilter === 'all' || (record?.status === statusFilter) || (!record && statusFilter === 'none')
    return matchSearch && matchStatus
  })

  const grouped = STATUS_ORDER.reduce<Record<string, Team[]>>((acc, status) => {
    acc[status] = filtered
      .filter(t => latestByTeam[t.id]?.status === status)
      .sort((a, b) => a.number - b.number)
    return acc
  }, {})

  const noRecord = filtered
    .filter(t => !latestByTeam[t.id])
    .sort((a, b) => a.number - b.number)

  const historyRecords = historyTeam
    ? records.filter(r => r.teamId === historyTeam.id).sort((a, b) => {
        if (a.blockId !== b.blockId) return b.blockId - a.blockId
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      })
    : []

  // Build mentors matrix
  const mentorsMap: Record<string, Record<string, any[]>> = {}
  for (const r of records) {
    if (!r.mentor) continue
    const mName = r.mentor.name
    if (!mentorsMap[mName]) mentorsMap[mName] = {}
    const bLabel = r.block?.label || `Bloco ${r.blockId}`
    if (!mentorsMap[mName][bLabel]) mentorsMap[mName][bLabel] = []
    mentorsMap[mName][bLabel].push(r)
  }
  const sortedMentors = Object.entries(mentorsMap).sort((a, b) => a[0].localeCompare(b[0], 'pt'))

  return (
    <div className="bg-slate-50 text-slate-900 min-h-full pb-20 font-sans">
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        
        <SummaryStrip teams={teams} records={records} latestByTeam={latestByTeam} />

        {/* Legend */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-7 shadow-sm">
          <div className="font-display font-bold text-xs text-slate-400 uppercase tracking-wide mb-3">Etapas do processo de inovação</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {['Entendimento do problema','Explorando soluções','Escolha da solução','Protótipo','Testes','Pitch'].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-5 h-5 rounded-full bg-navy text-white font-display font-bold text-[10px] flex items-center justify-center shrink-0">{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
        </div>

        <FilterBar search={search} onSearch={setSearch} statusFilter={statusFilter} onStatusFilter={setStatusFilter} />

        {/* Status sections */}
        {STATUS_ORDER.map(status => {
          const group = grouped[status]
          if (!group?.length) return null
          const meta = SECTION_META[status]
          return (
            <section key={status} className="mb-2">
              <div className="flex items-center gap-3 mt-9 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                <h2 className="font-display font-bold text-lg text-navy">{meta.title}</h2>
                <div className="bg-slate-100 text-slate-600 font-display font-bold text-sm px-2.5 py-0.5 rounded-full">{group.length}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5">
                {group.map(team => (
                  <TeamCard key={team.id} team={team} record={latestByTeam[team.id]} onHistoryClick={setHistoryTeam} />
                ))}
              </div>
            </section>
          )
        })}

        {/* No record yet */}
        {noRecord.length > 0 && (
          <section className="mb-2">
            <div className="flex items-center gap-3 mt-9 mb-4 opacity-70">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-400" />
              <h2 className="font-display font-bold text-lg text-navy">Sem registro</h2>
              <div className="bg-slate-200 text-slate-600 font-display font-bold text-sm px-2.5 py-0.5 rounded-full">{noRecord.length}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5 opacity-75">
              {noRecord.map(team => (
                <TeamCard key={team.id} team={team} record={undefined} onHistoryClick={setHistoryTeam} />
              ))}
            </div>
          </section>
        )}

        {/* Mentor Section */}
        <div className="mt-14 pt-8 border-t-2 border-slate-200">
          <h2 className="font-display font-bold text-2xl text-navy mb-1">Distribuição por Mentor</h2>
          <p className="text-sm text-slate-400 mb-6">Equipes atendidas por cada mentor, organizadas por bloco de mentoria</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedMentors.map(([mentor, blocos_]) => {
              const allTeams = new Set(Object.values(blocos_).flat().map(r => r.team?.name))
              const totalMentorias = Object.values(blocos_).flat().length
              const initials = mentor.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()

              return (
                <div key={mentor} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-navy text-white px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange flex items-center justify-center font-display font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm">{mentor}</div>
                      <div className="text-[11px] opacity-50">{allTeams.size} equipe{allTeams.size>1?'s':''} · {totalMentorias} mentoria{totalMentorias>1?'s':''}</div>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    {Object.entries(blocos_).sort().map(([bLabel, recs]) => (
                      <div key={bLabel}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{bLabel}</div>
                        {recs.sort((a,b)=>(a.team?.number||0)-(b.team?.number||0)).map(r => {
                          const dot = r.status === 'emergency' ? 'bg-red-600' : r.status === 'attention' ? 'bg-yellow-600' : 'bg-green-600'
                          return (
                            <div key={r.id} className="flex items-center gap-2 py-1 text-[13px] text-slate-600 border-b border-slate-100 last:border-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                              <span className="truncate">{r.team?.number} - {r.team?.name}</span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </main>

      {historyTeam && <HistoryModal team={historyTeam} records={historyRecords} onClose={() => setHistoryTeam(null)} />}
    </div>
  )
}
