'use client'

import { type RecordWithRelations } from '@/lib/constants'

const SECTIONS = [
  { key: 'emergency', icon: '🚨', title: 'Emergência', accent: 'text-red-400' },
  { key: 'attention',  icon: '⚠️',  title: 'Atenção',    accent: 'text-yellow-400' },
  { key: 'ok',         icon: '🛣️', title: 'No caminho', accent: 'text-green-400' },
  { key: 'flying',     icon: '🚀', title: 'Voando',     accent: 'text-blue-400' },
]

export default function SummaryStrip({ latestByTeam }: { latestByTeam: Record<string, RecordWithRelations> }) {
  const counts = Object.values(latestByTeam).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {SECTIONS.map(s => (
        <div key={s.key} className="card flex items-center gap-3">
          <span className="text-2xl">{s.icon}</span>
          <div>
            <p className={`text-2xl font-display font-bold leading-none ${s.accent}`}>
              {counts[s.key] ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{s.title}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
