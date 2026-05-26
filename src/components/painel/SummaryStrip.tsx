'use client'

import { type RecordWithRelations } from '@/lib/constants'

export default function SummaryStrip({ teams, records, latestByTeam }: any) {
  const total = teams.length
  let emg = 0, att = 0, ok = 0, fly = 0
  teams.forEach((t: any) => {
    const st = latestByTeam[t.id]?.status
    if (st === 'emergency') emg++
    if (st === 'attention') att++
    if (st === 'ok') ok++
    if (st === 'flying') fly++
  })
  
  const mentors = new Set(records.map((r: any) => r.mentorId)).size

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <StatCard label="Total de equipes" value={total} sub="no evento" color="text-orange" />
      <StatCard label="🚨 Emergência" value={emg} sub="intervenção urgente" color="text-red-600" />
      <StatCard label="⚠️ Atenção" value={att} sub="monitorar de perto" color="text-yellow-600" />
      <StatCard label="🛣️ No caminho" value={ok} sub="evoluindo bem" color="text-green-600" />
      <StatCard label="🚀 Voando" value={fly} sub="acima das expectativas" color="text-blue-600" />
      <StatCard label="Mentores" value={mentors} sub="com registros" color="text-navy" />
    </div>
  )
}

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col gap-1 transition-shadow hover:shadow-md">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`font-display font-bold text-4xl leading-none ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </div>
  )
}
