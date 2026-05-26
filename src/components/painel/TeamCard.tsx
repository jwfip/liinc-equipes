'use client'

import { useState } from 'react'

export default function TeamCard({ team, record, onHistoryClick }: any) {
  const [expanded, setExpanded] = useState(false)
  
  const statusMap: any = {
    ok: { label: '🛣️ No caminho', pill: 'bg-green-100 text-green-700', stripe: 'bg-green-500', num: 'bg-navy', card: 'border-slate-200' },
    attention: { label: '⚠️ Atenção', pill: 'bg-yellow-100 text-yellow-700', stripe: 'bg-yellow-400', num: 'bg-yellow-400 text-navy', card: 'border-yellow-200 shadow-[0_0_0_2px_rgba(250,204,21,0.15)]' },
    emergency: { label: '🚨 Emergência', pill: 'bg-red-100 text-red-700', stripe: 'bg-gradient-to-r from-red-600 to-red-400', num: 'bg-red-600', card: 'border-red-200 shadow-[0_0_0_2px_rgba(220,38,38,0.15)]' },
    flying: { label: '🚀 Voando', pill: 'bg-blue-100 text-blue-700', stripe: 'bg-gradient-to-r from-blue-600 to-blue-400', num: 'bg-blue-600', card: 'border-blue-200 shadow-[0_0_0_2px_rgba(37,99,235,0.15)]' },
    none: { label: 'Sem registro', pill: 'bg-slate-100 text-slate-500', stripe: 'bg-slate-300', num: 'bg-slate-400', card: 'border-slate-200 opacity-75' },
  }
  
  const meta = statusMap[record?.status || 'none']
  
  const getStep = (r: any) => {
    if (!r) return 1
    if (typeof r.step === 'number') return r.step
    if (r.status === 'emergency') return 1
    const w = (r.working || '').toLowerCase()
    if ((w.includes('soluç') || w.includes('solução')) && !w.includes('definindo')) return 2
    return 1
  }
  const step = getStep(record)

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5 ${meta.card}`}>
      <div className={`h-1 w-full ${meta.stripe}`} />
      <div className="p-4 md:p-5">
        
        {/* Top */}
        <div className="flex items-start gap-2.5 mb-3.5">
          <div className={`font-display font-bold text-[13px] px-2.5 py-1 rounded-md shrink-0 text-white ${meta.num}`}>
            #{team.number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[15px] text-navy leading-tight">{team.name}</div>
            {record ? (
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">Última mentoria ·</span>
                <span className="font-semibold text-slate-600">👤 {record.mentor?.name}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 mt-1">Nenhuma mentoria</div>
            )}
          </div>
          <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${meta.pill}`}>
            {meta.label}
          </div>
        </div>

        {record ? (
          <>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Etapas do processo</div>
            <div className="flex gap-1 mb-3.5">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i < step ? 'bg-green-500' : i === step ? 'bg-orange' : 'bg-slate-200'}`} />
              ))}
            </div>

            <div className="mb-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Trabalhando em</div>
              <div className="text-[13px] text-navy font-medium leading-relaxed">{record.working || '(sem registro)'}</div>
            </div>

            {expanded && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Orientação principal</div>
                  <div className="text-[13px] text-slate-600 leading-relaxed">{record.advice}</div>
                </div>
                {record.pros && <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">✅ Pontos positivos</div><div className="text-[13px] text-slate-600 leading-relaxed">{record.pros}</div></div>}
                {record.cons && <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">🔧 A melhorar</div><div className="text-[13px] text-slate-600 leading-relaxed">{record.cons}</div></div>}
                {record.obs && <div><span className="inline-block bg-orange/10 text-orange-dark text-[11px] font-bold px-2 py-0.5 rounded mr-2 mb-1">Observação</span><div className="text-[13px] text-slate-600 leading-relaxed">{record.obs}</div></div>}
              </div>
            )}
          </>
        ) : (
          <div className="text-[13px] text-slate-400 italic py-2">Nenhum relatório de mentoria recebido ainda.</div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 mt-3 pt-3 flex gap-4">
          <button onClick={(e) => { e.stopPropagation(); onHistoryClick(team) }} className="text-orange hover:text-orange-dark font-display font-bold text-xs flex items-center gap-1 transition-colors">
            📋 Histórico
          </button>
          {record && (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }} className="text-slate-500 hover:text-navy font-display font-bold text-xs flex items-center gap-1 transition-colors">
              {expanded ? 'Menos ▲' : 'Detalhes ▼'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
