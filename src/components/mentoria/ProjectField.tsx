'use client'

import { Shuffle, Sparkles } from 'lucide-react'
import type { ProjectInfo } from '@/lib/project'
import AiHint from './AiHint'

const fmtDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null)

/** Projeto atual da equipe, só leitura (atendimento, edição) — ou nada se a equipe ainda não tem projeto. */
export function ProjectReadOnly({ project }: { project: ProjectInfo | null }) {
  if (!project) return null
  const meta = [fmtDay(project.since) && `desde ${fmtDay(project.since)}`, project.author && `por ${project.author}`].filter(Boolean).join(', ')
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">Projeto atual{meta && <span className="font-normal"> · {meta}</span>}</p>
      <p className="text-sm text-navy mt-1 whitespace-pre-line">{project.description}</p>
    </div>
  )
}

interface Props {
  project:      ProjectInfo | null
  pivoted:      boolean
  onPivoted:    (v: boolean) => void
  text:         string
  onText:       (v: string) => void
  aiFilled:     boolean
  /** Texto sugerido pela IA quando o relato indica um pivô (a caixa nunca é marcada sozinha). */
  aiPivotText:  string | null
  onUseAiPivot: () => void
}

/** Novo registro de mentoria: cria o projeto (equipe sem projeto) ou registra um pivô. */
export default function ProjectField({ project, pivoted, onPivoted, text, onText, aiFilled, aiPivotText, onUseAiPivot }: Props) {
  if (!project) {
    return (
      <div>
        <label className="label" htmlFor="f-project">Projeto da equipe *</label>
        {aiFilled && <AiHint />}
        <textarea id="f-project" name="project" required rows={2} className="input resize-y"
          value={text} onChange={e => onText(e.target.value)} />
        <p className="text-xs text-slate-500 mt-1">Descreva o projeto em uma ou duas frases. Os próximos mentores vão ver este texto.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ProjectReadOnly project={project} />
      <label className="flex items-center gap-2 text-sm font-bold text-navy cursor-pointer">
        <input type="checkbox" name="pivoted" checked={pivoted} onChange={e => onPivoted(e.target.checked)} className="w-4 h-4 accent-orange" />
        <Shuffle aria-hidden="true" size={15} className="text-orange" />
        A equipe pivotou
      </label>
      {aiPivotText && !pivoted && (
        <div className="rounded-xl border border-orange/30 bg-orange/5 p-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="flex-1 inline-flex items-center gap-1.5 text-orange-dark font-semibold">
            <Sparkles aria-hidden="true" size={15} />A IA identificou um possível pivô — confira
          </span>
          <button type="button" onClick={onUseAiPivot} className="btn-secondary text-xs">Usar texto sugerido</button>
        </div>
      )}
      {pivoted && (
        <div>
          <label className="label" htmlFor="f-project">Novo projeto *</label>
          <textarea id="f-project" name="project" required rows={2} className="input resize-y"
            value={text} onChange={e => onText(e.target.value)} />
          <p className="text-xs text-slate-500 mt-1">Os próximos mentores vão ver este texto como o projeto atual.</p>
        </div>
      )}
    </div>
  )
}
