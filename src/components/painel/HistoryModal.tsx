'use client'

import { useEffect } from 'react'
import Link from 'next/link'

function fmtDateTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryModal({ team, records, onClose, currentUser }: any) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!team) return null

  const uniqueMentors = Array.from(new Set(records.map((r:any) => r.mentor?.name).filter(Boolean)))

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-navy/80 backdrop-blur-sm p-0 md:p-5 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white md:rounded-2xl rounded-t-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[92vh] md:max-h-[85vh]">
        
        <div className="bg-navy text-white p-5 md:p-6 md:rounded-t-2xl rounded-t-2xl shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
          <button onClick={onClose} className="absolute top-4 right-4 md:top-5 md:right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">✕</button>
          <div className="font-display font-bold text-xs text-white/50 uppercase tracking-wider mb-0.5">Equipe #{team.number}</div>
          <div className="font-display font-bold text-xl md:text-2xl leading-tight">{team.name}</div>
          <div className="text-xs text-white/50 mt-1.5">Mentores: <span className="text-white/80">{uniqueMentors.length ? uniqueMentors.join(', ') : 'Nenhum'}</span></div>
        </div>

        <div className="p-5 md:p-7 overflow-y-auto bg-slate-50">
          {records.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Nenhuma mentoria registrada ainda.</div>
          ) : (
            <div className="relative pl-7">
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />
              <div className="space-y-8">
                {records.map((r: any) => {
                  const statusMap: any = {
                    ok: { label: '🛣️ No caminho', pill: 'bg-green-100 text-green-700', dot: 'bg-green-500 ring-green-500' },
                    attention: { label: '⚠️ Atenção', pill: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400 ring-yellow-400' },
                    emergency: { label: '🚨 Emergência', pill: 'bg-red-100 text-red-700', dot: 'bg-red-600 ring-red-600' },
                    flying: { label: '🚀 Voando', pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500 ring-blue-500' },
                  }
                  const meta = statusMap[r.status]

                  const getStep = (r: any) => {
                    if (!r || r.status === 'emergency') return 1
                    const w = (r.working || '').toLowerCase()
                    if ((w.includes('soluç') || w.includes('solução')) && !w.includes('definindo')) return 2
                    return 1
                  }
                  const step = getStep(r)

                  return (
                    <div key={r.id} className="relative">
                      <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${meta.dot}`} />
                      
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <div className="font-display font-bold text-[13px] text-navy">{r.block?.label}</div>
                        <div className="text-[12px] text-slate-400">{fmtDateTime(r.createdAt)}</div>
                        <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</div>
                        <div className="text-[11px] font-bold bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full md:ml-auto">👤 {r.mentor?.name}</div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Etapa do processo</div>
                          <div className="flex gap-1">
                            {[1,2,3,4,5,6].map(i => (
                              <div key={i} className={`flex-1 h-1 rounded-full ${i < step ? 'bg-green-500' : i === step ? 'bg-orange' : 'bg-slate-200'}`} />
                            ))}
                          </div>
                        </div>

                        {r.working && <Field label="Projeto atual" value={r.working} dark />}
                        <Field label="Orientação do mentor" value={r.advice} />
                        {r.pros && <Field label="✅ Pontos positivos" value={r.pros} />}
                        {r.cons && <Field label="🔧 A melhorar" value={r.cons} />}
                        {r.obs && (
                          <div className="bg-orange/10 rounded-lg p-3 flex gap-2 items-start mt-1">
                            <span className="text-[13px] shrink-0">📌</span>
                            <div className="text-[12px] text-orange-dark leading-relaxed">{r.obs}</div>
                          </div>
                        )}
                        {r.suggestion && <Field label="💡 Sugestão p/ Próx. Mentor" value={r.suggestion} />}

                        {currentUser === r.mentor?.email && (
                          <div className="mt-2 pt-3 border-t border-slate-100 flex justify-end">
                            <Link href={`/mentoria/edit/${r.id}`} className="text-[12px] font-bold text-orange hover:text-orange-dark bg-orange/10 hover:bg-orange/20 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2">
                              ✏️ Editar resposta
                            </Link>
                          </div>
                        )}
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

function Field({ label, value, dark = false }: any) {
  if (!value) return null
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
      <div className={`text-[13px] leading-relaxed whitespace-pre-line ${dark ? 'text-navy font-medium' : 'text-slate-600'}`}>{value}</div>
    </div>
  )
}
