'use client'

import { useState, useTransition } from 'react'
import { submitMentoria } from '@/actions/mentoria'
import { STATUS_OPTIONS } from '@/lib/constants'

type Team  = { id: string; number: number; name: string }
type Block = { id: number; label: string; date: string } | null

interface Props {
  teams:       Team[]
  activeBlock: Block
}

export default function MentoriaForm({ teams, activeBlock }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const filteredTeams = teams.filter(t =>
    `${t.number} ${t.name}`.toLowerCase().includes(teamSearch.toLowerCase())
  )
  const selectedTeamObj = teams.find(t => t.id === selectedTeam)

  if (!activeBlock) {
    return (
      <div className="card text-center py-12">
        <p className="text-4xl mb-3">⏸️</p>
        <h2 className="font-display font-bold text-lg mb-1">Nenhum bloco ativo no momento</h2>
        <p className="text-slate-500 text-sm">Aguarde o organizador ativar um bloco.</p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('teamId', selectedTeam)
    formData.set('status', selectedStatus)
    setError(null)
    startTransition(async () => {
      try {
        await submitMentoria(formData)
        setSuccess(true)
        setSelectedTeam('')
        setSelectedStatus('')
        setTeamSearch('')
        e.currentTarget?.reset()
        setTimeout(() => setSuccess(false), 4000)
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const colorMap: Record<string, { border: string; bg: string; text: string }> = {
    green:  { border: 'border-green-500',  bg: 'bg-green-50',  text: 'text-green-700'  },
    yellow: { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    red:    { border: 'border-red-500',    bg: 'bg-red-50',    text: 'text-red-700'    },
    blue:   { border: 'border-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Active block banner */}
      <div className="card flex items-center gap-3 bg-orange/10 border-orange/30">
        <span className="text-2xl">🕐</span>
        <div>
          <p className="text-xs text-orange font-semibold">Bloco ativo</p>
          <p className="font-display font-bold">{activeBlock.label}</p>
          <p className="text-xs text-slate-500">{new Date(activeBlock.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Team dropdown */}
      <div className="relative">
        <label className="label">Equipe *</label>
        <div
          className="input cursor-pointer flex items-center justify-between"
          onClick={() => setDropdownOpen(v => !v)}
        >
          <span className={selectedTeamObj ? 'text-navy' : 'text-slate-400'}>
            {selectedTeamObj ? `${selectedTeamObj.number} — ${selectedTeamObj.name}` : 'Selecione a equipe...'}
          </span>
          <span className="text-slate-500 text-xs">▼</span>
        </div>
        {dropdownOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-200">
              <input type="text" placeholder="Buscar..." value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)} className="input" autoFocus />
            </div>
            <ul className="max-h-48 overflow-y-auto">
              {filteredTeams.map(t => (
                <li key={t.id} className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-navy cursor-pointer transition-colors"
                  onClick={() => { setSelectedTeam(t.id); setTeamSearch(''); setDropdownOpen(false) }}>
                  {t.number} — {t.name}
                </li>
              ))}
              {filteredTeams.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Nenhuma equipe</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="label">Status da equipe *</label>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map(opt => {
            const c = colorMap[opt.color]
            const isSelected = selectedStatus === opt.value
            return (
              <button key={opt.value} type="button" onClick={() => setSelectedStatus(opt.value)}
                className={`rounded-xl border-2 py-3 px-4 text-[13px] font-bold transition-all
                  ${isSelected ? `${c.border} ${c.bg} ${c.text}` : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <Textarea name="working" label="Qual o projeto da equipe atualmente? *" required />
      <Textarea name="advice"  label="Que orientação você deu? *"       required />
      <Textarea name="pros"       label="Pontos positivos" />
      <Textarea name="cons"       label="A melhorar" />
      <Textarea name="obs"        label="Observações para facilitadores" />
      <Textarea name="suggestion" label="Sugestão para o próximo mentor" />

      {error   && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-bold">✅ Mentoria registrada!</div>}

      <button type="submit" disabled={isPending || !selectedTeam || !selectedStatus}
        className="btn-primary w-full justify-center py-3 text-base">
        {isPending ? 'Registrando...' : 'Registrar mentoria'}
      </button>
    </form>
  )
}

function Textarea({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea name={name} required={required} rows={3} className="input resize-y" />
    </div>
  )
}
