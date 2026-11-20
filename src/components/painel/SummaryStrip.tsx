'use client'

import { MessagesSquare } from 'lucide-react'
import { StatusLabel } from '@/components/ui/StatusIcon'

export default function SummaryStrip({ teams, records, latestByTeam, atendimentos = 0 }: any) {
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
  // Evento só com atendimentos: os cards de status (todos zerados) só confundiriam.
  const showStatus = records.length > 0 || atendimentos === 0

  // Celular: faixa compacta que rola para o lado (os 7 cartões ocupavam mais de uma tela antes da 1ª equipe).
  const chips: { key: string; label: React.ReactNode; value: number; color: string }[] = [
    { key: 'total', label: 'Equipes', value: total, color: 'text-orange' },
    ...(showStatus ? [
      { key: 'emg', label: <StatusLabel status="emergency" size={12} />, value: emg, color: 'text-red-600' },
      { key: 'att', label: <StatusLabel status="attention" size={12} />, value: att, color: 'text-yellow-700' },
      { key: 'ok',  label: <StatusLabel status="ok" size={12} />,        value: ok,  color: 'text-green-700' },
      { key: 'fly', label: <StatusLabel status="flying" size={12} />,    value: fly, color: 'text-blue-600' },
    ] : []),
    { key: 'mentors', label: 'Mentores', value: mentors, color: 'text-navy' },
    ...(atendimentos > 0 ? [{ key: 'aten', label: 'Atendimentos', value: atendimentos, color: 'text-blue-700' }] : []),
  ]

  return (
    <>
    <ul aria-label="Resumo do evento" className="md:hidden -mx-4 px-4 mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map(c => (
        <li key={c.key} className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-3 pr-3.5 py-1.5 shadow-sm">
          <span className={`font-display font-bold text-base leading-none ${c.color}`}>{c.value}</span>
          <span className="text-[12px] font-semibold text-slate-600 whitespace-nowrap">{c.label}</span>
        </li>
      ))}
    </ul>
    <div className={`hidden md:grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 ${!showStatus ? 'lg:grid-cols-3' : atendimentos > 0 ? 'lg:grid-cols-7' : 'lg:grid-cols-6'}`}>
      <StatCard label="Total de equipes" value={total} sub="no evento" color="text-orange" />
      {showStatus && <>
        <StatCard label={<StatusLabel status="emergency" size={12} />} value={emg} sub="intervenção urgente" color="text-red-600" />
        <StatCard label={<StatusLabel status="attention" size={12} />} value={att} sub="monitorar de perto" color="text-yellow-600" />
        <StatCard label={<StatusLabel status="ok" size={12} />} value={ok} sub="evoluindo bem" color="text-green-600" />
        <StatCard label={<StatusLabel status="flying" size={12} />} value={fly} sub="acima das expectativas" color="text-blue-600" />
      </>}
      <StatCard label="Mentores" value={mentors} sub="com mentorias" color="text-navy" />
      {atendimentos > 0 && <StatCard label={<span className="inline-flex items-center gap-1.5"><MessagesSquare aria-hidden="true" size={12} />Atendimentos</span>} value={atendimentos} sub="de especialistas" color="text-blue-700" />}
    </div>
    </>
  )
}

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col gap-1 transition-shadow hover:shadow-md">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-display font-bold text-4xl leading-none ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  )
}
