'use client'

import { STATUS_META, type StatusValue, type RecordWithRelations } from '@/lib/constants'

type Team = { id: string; number: number; name: string; active: boolean }

interface TeamCardProps {
  team:           Team
  record:         RecordWithRelations | undefined
  onHistoryClick: (team: Team) => void
}

export default function TeamCard({ team, record, onHistoryClick }: TeamCardProps) {
  const meta = record ? STATUS_META[record.status as StatusValue] : null

  return (
    <div
      className={`card border-l-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5
        ${meta ? meta.borderClass : 'border-l-navy-muted'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-slate-400 font-semibold">Equipe {team.number}</span>
          <h3 className="font-display font-bold text-base leading-tight mt-0.5">{team.name}</h3>
        </div>
        {meta ? (
          <span className={meta.badgeClass}>{meta.label}</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700/50 text-slate-400 border border-slate-600/30">
            Sem registro
          </span>
        )}
      </div>

      {/* Last record summary */}
      {record && meta && (
        <div className={`rounded-lg p-2.5 text-xs space-y-1 ${meta.bgClass}`}>
          {record.working && (
            <p className="text-slate-300 line-clamp-2">
              <span className="font-semibold text-slate-200">Trabalhando em:</span> {record.working}
            </p>
          )}
          {record.mentor && (
            <p className="text-slate-400">Mentor: <span className="text-slate-300">{record.mentor.name}</span></p>
          )}
          {record.block && (
            <p className="text-slate-400">Bloco: <span className="text-slate-300">{record.block.label}</span></p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end mt-auto pt-1">
        <button
          onClick={() => onHistoryClick(team)}
          className="text-xs text-orange hover:text-orange-dark font-semibold transition-colors"
        >
          Ver histórico →
        </button>
      </div>
    </div>
  )
}
