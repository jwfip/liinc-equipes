'use client'

import { ChevronDown } from 'lucide-react'

import { useState } from 'react'

type Team = { id: string; number: number; name: string }

/** Seletor de equipe com busca (usado nos formulários de mentoria e atendimento). */
export default function TeamPicker({ teams, value, onChange }: { teams: Team[]; value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = teams.filter(t => `${t.number} ${t.name}`.toLowerCase().includes(search.toLowerCase()))
  const selected = teams.find(t => t.id === value)

  return (
    <div className="relative">
      <label className="label" id="team-label">Equipe *</label>
      <button type="button" aria-labelledby="team-label" aria-expanded={open}
        className="input cursor-pointer flex items-center justify-between text-left"
        onClick={() => setOpen(v => !v)}>
        <span className={selected ? 'text-navy' : 'text-slate-400'}>
          {selected ? `${selected.number} — ${selected.name}` : 'Selecione a equipe...'}
        </span>
        <ChevronDown aria-hidden="true" size={16} className="text-slate-500" />
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <input type="text" placeholder="Buscar..." value={search} aria-label="Buscar equipe"
              onChange={e => setSearch(e.target.value)} className="input" autoFocus />
          </div>
          <ul className="max-h-60 overflow-y-auto" role="listbox">
            {filtered.map(t => (
              <li key={t.id} role="option" aria-selected={t.id === value}
                className="px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-navy cursor-pointer transition-colors"
                onClick={() => { onChange(t.id); setSearch(''); setOpen(false) }}>
                {t.number} — {t.name}
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Nenhuma equipe</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
