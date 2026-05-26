'use client'

import { useEffect } from 'react'
import { STATUS_META, type StatusValue, type RecordWithRelations } from '@/lib/constants'

function fmtDateTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  team:    { id: string; number: number; name: string } | null
  records: RecordWithRelations[]
  onClose: () => void
}

export default function HistoryModal({ team, records, onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!team) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-navy-light border border-navy-muted rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-navy-muted">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Histórico</p>
            <h2 className="font-display font-bold text-lg">{team.number} — {team.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold leading-none">×</button>
        </div>

        <div className="p-5">
          {records.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Nenhuma mentoria registrada ainda.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-navy-muted" />
              <div className="space-y-6 pl-10">
                {records.map(r => {
                  const meta = STATUS_META[r.status as StatusValue]
                  return (
                    <div key={r.id} className="relative">
                      <div className={`absolute -left-[34px] top-1.5 w-3 h-3 rounded-full border-2 border-navy-light
                        ${r.status === 'ok' ? 'bg-green-500' : r.status === 'attention' ? 'bg-yellow-500' : r.status === 'emergency' ? 'bg-red-500' : 'bg-blue-500'}`}
                      />
                      <div className="card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-semibold">
                            {r.block?.label} • {fmtDateTime(r.createdAt)}
                          </span>
                          <span className={meta.badgeClass}>{meta.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">Mentor: <span className="text-slate-300">{r.mentor?.name}</span></p>
                        <div className="space-y-1.5 text-sm">
                          {r.working && <Field label="Trabalhando em" value={r.working} />}
                          {r.advice  && <Field label="Orientação dada" value={r.advice} />}
                          {r.pros    && <Field label="Pontos positivos" value={r.pros} />}
                          {r.cons    && <Field label="A melhorar" value={r.cons} />}
                          {r.obs     && <Field label="Observações" value={r.obs} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-400">{label}:</span>
      <p className="text-slate-300 mt-0.5 whitespace-pre-line">{value}</p>
    </div>
  )
}
