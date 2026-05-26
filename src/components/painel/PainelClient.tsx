'use client'

import { useState, useEffect, useCallback } from 'react'
import { STATUS_ORDER, getLatestByTeam, type RecordWithRelations } from '@/lib/constants'
import SummaryStrip from './SummaryStrip'
import FilterBar    from './FilterBar'
import TeamCard     from './TeamCard'
import HistoryModal from './HistoryModal'

const SECTION_META = {
  emergency: { icon: '🚨', title: 'Emergência', color: 'text-red-400'    },
  attention:  { icon: '⚠️',  title: 'Atenção',    color: 'text-yellow-400' },
  ok:         { icon: '🛣️', title: 'No caminho', color: 'text-green-400'  },
  flying:     { icon: '🚀', title: 'Voando',     color: 'text-blue-400'   },
}

type Team = { id: string; number: number; name: string; active: boolean }

interface Props {
  initialRecords: RecordWithRelations[]
  teams:          Team[]
  activeBlock:    { label: string } | null
  headerActions?: React.ReactNode
}

export default function PainelClient({ initialRecords, teams, activeBlock, headerActions }: Props) {
  const [records, setRecords]           = useState(initialRecords)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [historyTeam, setHistoryTeam]   = useState<Team | null>(null)

  // Polling a cada 5s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res  = await fetch('/api/records', { cache: 'no-store' })
        const data = await res.json()
        setRecords(data)
      } catch { /* silently ignore */ }
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const latestByTeam = getLatestByTeam(records)

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        String(t.number).includes(search)
    const record = latestByTeam[t.id]
    const matchStatus = !statusFilter || (record?.status === statusFilter)
    return matchSearch && matchStatus
  })

  const grouped = STATUS_ORDER.reduce<Record<string, Team[]>>((acc, status) => {
    acc[status] = filtered
      .filter(t => latestByTeam[t.id]?.status === status)
      .sort((a, b) => a.number - b.number)
    return acc
  }, {} as Record<string, Team[]>)

  const noRecord = filtered
    .filter(t => !latestByTeam[t.id])
    .sort((a, b) => a.number - b.number)

  const historyRecords = historyTeam
    ? records.filter(r => r.teamId === historyTeam.id)
    : []

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <header className="bg-navy-light border-b border-navy-muted sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <h1 className="font-display font-bold text-base leading-tight">Liinc Mentorias</h1>
              <p className="text-xs text-slate-400">Painel de Acompanhamento</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeBlock ? (
              <div className="flex items-center gap-2 bg-orange/10 border border-orange/30 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
                <span className="text-xs text-orange font-semibold">{activeBlock.label} — ao vivo</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-navy border border-navy-muted rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-xs text-slate-400 hidden sm:block">Sem bloco ativo</span>
              </div>
            )}
            {headerActions}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SummaryStrip latestByTeam={latestByTeam} />
        <FilterBar
          search={search} onSearch={setSearch}
          statusFilter={statusFilter} onStatusFilter={setStatusFilter}
        />

        {/* Status sections */}
        {STATUS_ORDER.map(status => {
          const group = grouped[status]
          if (!group?.length) return null
          const meta = SECTION_META[status]
          return (
            <section key={status} className="mb-8">
              <h2 className={`font-display font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2 ${meta.color}`}>
                <span>{meta.icon}</span>
                <span>{meta.title}</span>
                <span className="text-slate-500">({group.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.map(team => (
                  <TeamCard key={team.id} team={team} record={latestByTeam[team.id]} onHistoryClick={setHistoryTeam} />
                ))}
              </div>
            </section>
          )
        })}

        {/* No record yet */}
        {noRecord.length > 0 && !statusFilter && (
          <section className="mb-8">
            <h2 className="font-display font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-500">
              <span>📋</span><span>Sem registro ainda</span>
              <span className="text-slate-600">({noRecord.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {noRecord.map(team => (
                <TeamCard key={team.id} team={team} record={undefined} onHistoryClick={setHistoryTeam} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">🔍</p>
            <p>Nenhuma equipe encontrada.</p>
          </div>
        )}
      </main>

      <HistoryModal team={historyTeam} records={historyRecords} onClose={() => setHistoryTeam(null)} />
    </div>
  )
}
