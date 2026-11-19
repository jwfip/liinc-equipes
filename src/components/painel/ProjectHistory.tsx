'use client'

import { useState, useTransition } from 'react'
import { Pencil, Shuffle, Flag, PenLine } from 'lucide-react'
import { correctProject } from '@/actions/projects'
import type { ProjectRow } from '@/lib/project'

const KIND: Record<ProjectRow['kind'], { label: string; Icon: typeof Flag }> = {
  initial:    { label: 'Projeto inicial', Icon: Flag },
  pivot:      { label: 'Pivô',            Icon: Shuffle },
  correction: { label: 'Correção do texto', Icon: PenLine },
}
const time = (d: ProjectRow['createdAt']) => (d ? new Date(d).getTime() : 0)
const fmt = (d: ProjectRow['createdAt']) =>
  d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

interface Props {
  teamId:      string
  rows:        ProjectRow[]
  /** Bloco de cada mentoria (id → rótulo), para mostrar em que bloco houve o pivô. */
  blockOf:     (recordId: string) => string | null
  canCorrect:  boolean
  onChanged?:  () => void
}

/** Aba "Projeto" do histórico: versões do projeto (inicial, pivôs, correções) e correção do texto. */
export default function ProjectHistory({ teamId, rows, blockOf, canCorrect, onChanged }: Props) {
  const sorted = [...rows].sort((a, b) => time(b.createdAt) - time(a.createdAt) || b.id - a.id)
  const current = sorted[0]
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(current?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!current) return <div className="text-center py-10 text-slate-400 text-sm">O projeto ainda não foi registrado. O próximo mentor da equipe vai preenchê-lo.</div>

  function save() {
    setError(null)
    start(async () => {
      const r = await correctProject(teamId, text)
      if (!r.ok) { setError(r.error); return }
      setEditing(false)
      onChanged?.()
    })
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Projeto atual</h3>
          {canCorrect && !editing && (
            <button type="button" onClick={() => { setText(current.description); setEditing(true) }}
              className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:text-orange-dark">
              <Pencil aria-hidden="true" size={13} />Corrigir texto do projeto
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <label className="sr-only" htmlFor={`fix-${teamId}`}>Texto corrigido do projeto</label>
            <textarea id={`fix-${teamId}`} value={text} onChange={e => setText(e.target.value)} rows={3} className="input resize-y" />
            <p className="text-xs text-slate-500">Use para ajustar a redação. Se a equipe mudou de projeto, o mentor registra o pivô na mentoria.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-xs" disabled={pending}>Cancelar</button>
              <button type="button" onClick={save} className="btn-primary text-xs" disabled={pending || !text.trim()}>{pending ? 'Salvando...' : 'Salvar correção'}</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-navy mt-1 whitespace-pre-line">{current.description}</p>
        )}
      </section>

      <ol className="space-y-2">
        {sorted.map(r => {
          const { label, Icon } = KIND[r.kind]
          const block = r.recordId ? blockOf(r.recordId) : null
          return (
            <li key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                <span className={`inline-flex items-center gap-1 font-bold ${r.kind === 'pivot' ? 'text-orange-dark' : 'text-navy'}`}>
                  <Icon aria-hidden="true" size={13} />{label}
                </span>
                {block && <span>· {block}</span>}
                {r.author && <span>· {r.author.name}</span>}
                <span className="text-slate-400">· {fmt(r.createdAt)}</span>
              </div>
              <p className="text-slate-700 mt-1 whitespace-pre-line">{r.description}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
