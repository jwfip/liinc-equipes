'use client'

import { CirclePause, Clock, CircleCheck } from 'lucide-react'

import { useState, useTransition } from 'react'
import { submitMentoria, updateMentoria } from '@/actions/mentoria'
import { refreshTeamSummary } from '@/actions/summaries'
import { STATUS_OPTIONS, type Step } from '@/lib/constants'
import TeamPicker from './TeamPicker'
import { StatusIcon } from '@/components/ui/StatusIcon'

type Team  = { id: string; number: number; name: string }
type Block = { id: number; label: string; date: string } | null

interface Props {
  teams:        Team[]
  steps:        Step[]
  activeBlock:  Block
  recordToEdit?: any
}

export default function MentoriaForm({ teams, steps, activeBlock, recordToEdit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedTeam, setSelectedTeam] = useState(recordToEdit?.teamId || '')
  const [selectedStatus, setSelectedStatus] = useState(recordToEdit?.status || '')
  const [selectedStep, setSelectedStep] = useState<number | null>(recordToEdit?.stepId ?? null)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)


  if (!activeBlock) {
    return (
      <div className="card text-center py-12">
        <CirclePause aria-hidden="true" size={40} className="mx-auto mb-3 text-slate-400" />
        <h2 className="font-display font-bold text-lg mb-1">Nenhum bloco ativo no momento</h2>
        <p className="text-slate-500 text-sm">Aguarde o organizador ativar um bloco.</p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget // guardar já: depois do await, e.currentTarget vira null
    const formData = new FormData(form)
    formData.set('teamId', selectedTeam)
    formData.set('status', selectedStatus)
    setError(null)
    startTransition(async () => {
      try {
        const result = recordToEdit
          ? await updateMentoria(recordToEdit.id, formData)
          : await submitMentoria(formData)
        if (!result.ok) {
          setError(result.error)
          return
        }
        // Resumo por IA em segundo plano: não bloqueia o mentor e uma falha não afeta o registro.
        refreshTeamSummary(recordToEdit?.teamId ?? selectedTeam, 'mentoring').catch(() => {})
        setSuccess(true)
        if (!recordToEdit) {
          setSelectedTeam('')
          setSelectedStatus('')
          setSelectedStep(null)
          form.reset()
        }
        setTimeout(() => setSuccess(false), 4000)
      } catch (err: any) {
        setError(err?.message || 'Erro inesperado. Tente novamente.')
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
      {activeBlock && (
        <div className="card flex items-center gap-3 bg-orange/10 border-orange/30">
          <Clock aria-hidden="true" size={26} className="text-orange shrink-0" />
          <div>
            <p className="text-xs text-orange font-semibold">{recordToEdit ? 'Bloco do registro' : 'Bloco ativo'}</p>
            <p className="font-display font-bold">{activeBlock.label}</p>
            <p className="text-xs text-slate-500">{new Date(activeBlock.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      )}

      <TeamPicker teams={teams} value={selectedTeam} onChange={setSelectedTeam} />

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
                <span className="inline-flex items-center justify-center gap-1.5"><StatusIcon status={opt.value} size={15} />{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Progress Selector */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="label" id="step-label">Em qual etapa do processo a equipe está? *</label>
        </div>
        {steps.length === 0 ? (
          <p className="text-sm text-red-600 mt-2">Este evento ainda não tem etapas configuradas. Fale com a organização.</p>
        ) : (
          <div role="radiogroup" aria-labelledby="step-label" className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {steps.map((s, i) => {
              const isSelected = selectedStep === s.id
              return (
                <button key={s.id} type="button" role="radio" aria-checked={isSelected} onClick={() => setSelectedStep(s.id)}
                  className={`min-h-[52px] px-3 py-2 rounded-xl border-2 text-left transition-all flex items-center gap-2
                    ${isSelected
                      ? 'border-orange bg-orange/5 text-orange shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>
                  <span className={`w-6 h-6 rounded-full font-display font-bold text-[11px] flex items-center justify-center shrink-0 ${isSelected ? 'bg-orange text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                  <span className="text-[12px] font-bold leading-tight">{s.label}</span>
                </button>
              )
            })}
          </div>
        )}
        <input type="hidden" name="stepId" value={selectedStep ?? ''} />
      </div>

      <Textarea name="working" label="Qual o projeto da equipe atualmente? *" defaultValue={recordToEdit?.working} required />
      <Textarea name="advice"  label="Que orientação você deu? *"       defaultValue={recordToEdit?.advice} required />
      <Textarea name="pros"       label="Pontos positivos" defaultValue={recordToEdit?.pros} />
      <Textarea name="cons"       label="A melhorar" defaultValue={recordToEdit?.cons} />
      <Textarea name="obs"        label="Observações para facilitadores" defaultValue={recordToEdit?.obs} />
      <Textarea name="suggestion" label="Sugestão para o próximo mentor" defaultValue={recordToEdit?.suggestion} />

      {error   && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-bold flex items-center gap-2"><CircleCheck aria-hidden="true" size={18} />Mentoria {recordToEdit ? 'atualizada' : 'registrada'}!</div>}

      <button type="submit" disabled={isPending || !selectedTeam || !selectedStatus || !selectedStep}
        className="btn-primary w-full justify-center py-3 text-base">
        {isPending ? (recordToEdit ? 'Atualizando...' : 'Registrando...') : (recordToEdit ? 'Salvar alterações' : 'Registrar mentoria')}
      </button>
    </form>
  )
}

function Textarea({ name, label, required, defaultValue }: { name: string; label: string; required?: boolean; defaultValue?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea name={name} required={required} defaultValue={defaultValue} rows={3} className="input resize-y" />
    </div>
  )
}
