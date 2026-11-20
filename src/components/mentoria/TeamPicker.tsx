'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Team = { id: string; number: number; name: string }

/** Seletor de equipe com busca e teclado (↑/↓ navegam, Enter escolhe, Esc fecha). */
export default function TeamPicker({ teams, value, onChange }: { teams: Team[]; value: string; onChange: (id: string) => void }) {
  const uid = useId()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const filtered = teams.filter(t => `${t.number} ${t.name}`.toLowerCase().includes(search.toLowerCase()))
  const selected = teams.find(t => t.id === value)
  const optionId = (i: number) => `${uid}-opt-${i}`
  const trigger = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)

  function close(refocus = true) {
    setOpen(false); setSearch('')
    if (refocus) trigger.current?.focus()
  }
  function choose(t: Team) {
    onChange(t.id); close()
  }

  // Mantém a opção destacada visível ao navegar com as setas.
  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' })
  }, [active, open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clique fora fecha.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) close(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) choose(filtered[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'Tab') { close(false) }
  }

  return (
    <div className="relative" ref={root}>
      <label className="label" id={`${uid}-label`}>Equipe *</label>
      <button ref={trigger} type="button" aria-labelledby={`${uid}-label`} aria-haspopup="listbox" aria-expanded={open}
        className="input cursor-pointer flex items-center justify-between text-left"
        onClick={() => { setOpen(v => !v); setActive(0) }}>
        <span className={selected ? 'text-navy' : 'text-slate-400'}>
          {selected ? `${selected.number} — ${selected.name}` : 'Selecione a equipe...'}
        </span>
        <ChevronDown aria-hidden="true" size={16} className="text-slate-500" />
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <input type="text" role="combobox" aria-label="Buscar equipe" aria-expanded="true"
              aria-controls={`${uid}-list`} aria-activedescendant={filtered[active] ? optionId(active) : undefined}
              placeholder="Buscar..." value={search} autoFocus className="input"
              onChange={e => { setSearch(e.target.value); setActive(0) }} onKeyDown={onKeyDown} />
          </div>
          <ul id={`${uid}-list`} role="listbox" aria-labelledby={`${uid}-label`} className="max-h-60 overflow-y-auto">
            {filtered.map((t, i) => (
              <li key={t.id} id={optionId(i)} role="option" aria-selected={t.id === value}
                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                  i === active ? 'bg-orange/10 text-navy' : 'text-slate-600 hover:bg-slate-50 hover:text-navy'}`}
                onMouseEnter={() => setActive(i)} onClick={() => choose(t)}>
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
