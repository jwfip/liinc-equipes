'use client'

import { useState } from 'react'
import { User, ThumbsUp, Wrench, MessagesSquare, History, ChevronUp, ChevronDown, Shuffle } from 'lucide-react'
import { StatusIcon } from '@/components/ui/StatusIcon'
import StepProgress from './StepProgress'
import StepAdjuster from './StepAdjuster'
import SummaryBox from './SummaryBox'

export default function TeamCard({ team, record, steps, current, specialistCount = 0, isAdmin = false, onAdjusted, onHistoryClick, summary, project = null, pivoted = false }: any) {
  const step = current?.step ?? null
  const adjusted = current?.source === 'organization'
  const stepBlock = step ? (
    <div className="mb-3.5">
      <StepProgress steps={steps} current={step} />
      {adjusted && <p className="text-[10px] text-slate-400 mt-1 text-right">ajustada pela organização</p>}
    </div>
  ) : null
  const [expanded, setExpanded] = useState(false)
  
  const statusMap: any = {
    ok: { label: 'No caminho', pill: 'bg-green-100 text-green-700', stripe: 'bg-green-500', num: 'bg-navy', card: 'border-slate-200' },
    attention: { label: 'Atenção', pill: 'bg-yellow-100 text-yellow-700', stripe: 'bg-yellow-400', num: 'bg-yellow-400 text-navy', card: 'border-yellow-200 shadow-[0_0_0_2px_rgba(250,204,21,0.15)]' },
    emergency: { label: 'Emergência', pill: 'bg-red-100 text-red-700', stripe: 'bg-gradient-to-r from-red-600 to-red-400', num: 'bg-red-600', card: 'border-red-200 shadow-[0_0_0_2px_rgba(220,38,38,0.15)]' },
    flying: { label: 'Voando', pill: 'bg-blue-100 text-blue-700', stripe: 'bg-gradient-to-r from-blue-600 to-blue-400', num: 'bg-blue-600', card: 'border-blue-200 shadow-[0_0_0_2px_rgba(37,99,235,0.15)]' },
    none: { label: 'Sem mentoria', pill: 'bg-slate-100 text-slate-500', stripe: 'bg-slate-300', num: 'bg-slate-400', card: 'border-slate-200 opacity-75' },
  }
  
  const meta = statusMap[record?.status || 'none']
  

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
              <p className="text-[11px] text-slate-500 mt-1 truncate" title={`Última mentoria: ${record.mentor?.name ?? ''}`}>
                <span className="font-bold uppercase tracking-wider text-[10px]">Última mentoria · </span>
                <User aria-hidden="true" size={12} className="inline -mt-0.5 mr-0.5" />
                <span className="font-semibold text-slate-600">{record.mentor?.name}</span>
              </p>
            ) : (
              <div className="text-[11px] text-slate-400 mt-1">Nenhuma mentoria</div>
            )}
          </div>
          <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${meta.pill}`}>
            <span className="inline-flex items-center gap-1"><StatusIcon status={record?.status} size={12} />{meta.label}</span>
          </div>
        </div>

        {project && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projeto</span>
              {pivoted && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-pale text-orange-dark px-2 py-0.5 rounded-full"><Shuffle aria-hidden="true" size={11} />Pivotou</span>}
            </div>
            <div className="text-[13px] text-slate-700 leading-relaxed line-clamp-2">{project}</div>
          </div>
        )}

        {record ? (
          <>
            {stepBlock}

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
                {record.pros && <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1"><ThumbsUp aria-hidden="true" size={11} />Pontos positivos</div><div className="text-[13px] text-slate-600 leading-relaxed">{record.pros}</div></div>}
                {record.cons && <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1"><Wrench aria-hidden="true" size={11} />A melhorar</div><div className="text-[13px] text-slate-600 leading-relaxed">{record.cons}</div></div>}
                {record.obs && <div><span className="inline-block bg-orange/10 text-orange-dark text-[11px] font-bold px-2 py-0.5 rounded mr-2 mb-1">Para facilitadores</span><div className="text-[13px] text-slate-600 leading-relaxed">{record.obs}</div></div>}
              </div>
            )}
          </>
        ) : (
          <>
            {stepBlock}
            <div className="text-[13px] text-slate-400 italic py-2">Nenhum relatório de mentoria recebido ainda.</div>
          </>
        )}

        {summary?.hasRecords && (
          <div className="mt-3"><SummaryBox {...summary} compact /></div>
        )}

        {specialistCount > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
            <MessagesSquare aria-hidden="true" size={12} /> {specialistCount} atendimento{specialistCount > 1 ? 's' : ''}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 mt-3 pt-3 flex flex-wrap items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); onHistoryClick(team) }} className="text-orange hover:text-orange-dark font-display font-bold text-xs flex items-center gap-1 transition-colors">
            <History aria-hidden="true" size={14} /> Histórico
          </button>
          {record && (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }} className="text-slate-500 hover:text-navy font-display font-bold text-xs flex items-center gap-1 transition-colors">
              {expanded ? <>Menos <ChevronUp aria-hidden="true" size={14} /></> : <>Detalhes <ChevronDown aria-hidden="true" size={14} /></>}
            </button>
          )}
          {isAdmin && steps.length > 0 && (
            <StepAdjuster teamId={team.id} teamName={team.name} steps={steps} currentStepId={step?.id ?? null} onAdjusted={onAdjusted} />
          )}
        </div>
      </div>
    </div>
  )
}
