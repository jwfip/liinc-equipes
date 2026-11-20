'use client'

import { CirclePause, Clock, CircleCheck } from 'lucide-react'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitMentoria, updateMentoria } from '@/actions/mentoria'
import { STATUS_OPTIONS, type Step } from '@/lib/constants'
import TeamPicker from './TeamPicker'
import AudioRecorder, { type AudioResult } from './AudioRecorder'
import AiHint from './AiHint'
import ProjectField, { ProjectReadOnly } from './ProjectField'
import type { ProjectInfo } from '@/lib/project'
import { StatusIcon } from '@/components/ui/StatusIcon'

type Team  = { id: string; number: number; name: string }
type Block = { id: number; label: string; date: string } | null

interface Props {
  teams:        Team[]
  steps:        Step[]
  activeBlock:  Block
  projects:     Record<string, ProjectInfo>
  recordToEdit?: any
}

export default function MentoriaForm({ teams, steps, activeBlock, projects, recordToEdit }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState(recordToEdit?.teamId || '')
  const [selectedStatus, setSelectedStatus] = useState(recordToEdit?.status || '')
  const [selectedStep, setSelectedStep] = useState<number | null>(recordToEdit?.stepId ?? null)
  const [aiSuggested, setAiSuggested] = useState<{ status: boolean; step: boolean }>({ status: false, step: false })
  const [transcript, setTranscript] = useState('')
  const [pivoted, setPivoted] = useState(false)
  const [projectText, setProjectText] = useState('')
  const [projectAi, setProjectAi] = useState<{ filled: boolean; pivotText: string | null }>({ filled: false, pivotText: null })
  const formRef = useRef<HTMLFormElement>(null)
  const project = selectedTeam ? projects[selectedTeam] ?? null : null

  function resetProject() {
    setPivoted(false)
    setProjectText('')
    setProjectAi({ filled: false, pivotText: null })
  }
  function chooseTeam(id: string) {
    setSelectedTeam(id)
    resetProject()
  }

  /** Preenche só o que está vazio; status/etapa sugeridos ficam marcados para confirmação. */
  function applyAudio(r: AudioResult) {
    setTranscript(r.transcript)
    const form = formRef.current
    for (const [name, value] of Object.entries(r.fields)) {
      const el = form?.elements.namedItem(name)
      if (el instanceof HTMLTextAreaElement && !el.value.trim()) el.value = value
    }
    const sug = { status: false, step: false }
    if (r.status && !selectedStatus) { setSelectedStatus(r.status); sug.status = true }
    if (r.stepId && !selectedStep) { setSelectedStep(r.stepId); sug.step = true }
    setAiSuggested(sug)
    // Projeto: sem projeto, preenche se vazio; com projeto, um pivô só vira sugestão — o mentor confirma.
    if (r.project && !project && !projectText.trim()) { setProjectText(r.project); setProjectAi({ filled: true, pivotText: null }) }
    else if (r.project && project && r.pivot && !pivoted) setProjectAi({ filled: false, pivotText: r.project })
  }
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
    // O que o formulário mostrou: o servidor usa para não perder o texto se a lista de projetos estiver velha.
    if (!recordToEdit) formData.set('projectMode', !project ? 'initial' : pivoted ? 'pivot' : 'none')
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
        setSuccess(true)
        router.refresh() // projetos atualizados: a próxima mentoria da mesma equipe já vê o projeto salvo
        if (!recordToEdit) {
          setSelectedTeam('')
          setSelectedStatus('')
          setSelectedStep(null)
          setAiSuggested({ status: false, step: false })
          setTranscript('')
          resetProject()
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
    <form ref={formRef} onSubmit={handleSubmit} method="post" className="space-y-5">
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

      <TeamPicker teams={teams} value={selectedTeam} onChange={chooseTeam} />

      {recordToEdit
        ? <ProjectReadOnly project={project} />
        : selectedTeam && (
          <ProjectField project={project} pivoted={pivoted} onPivoted={setPivoted}
            text={projectText} onText={v => { setProjectText(v); setProjectAi(a => ({ ...a, filled: false })) }}
            aiFilled={projectAi.filled} aiPivotText={projectAi.pivotText}
            onUseAiPivot={() => { setPivoted(true); setProjectText(projectAi.pivotText ?? ''); setProjectAi({ filled: false, pivotText: null }) }} />
        )}

      <AudioRecorder kind="mentoring" onResult={applyAudio} />
      <input type="hidden" name="audioTranscript" value={transcript} />

      {/* Status */}
      <div>
        <label className="label">Status da equipe *</label>
        {aiSuggested.status && <AiHint />}
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map(opt => {
            const c = colorMap[opt.color]
            const isSelected = selectedStatus === opt.value
            return (
              <button key={opt.value} type="button" onClick={() => { setSelectedStatus(opt.value); setAiSuggested(a => ({ ...a, status: false })) }}
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
          {aiSuggested.step && <AiHint />}
        </div>
        {steps.length === 0 ? (
          <p className="text-sm text-red-600 mt-2">Este evento ainda não tem etapas configuradas. Fale com a organização.</p>
        ) : (
          <div role="radiogroup" aria-labelledby="step-label" className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {steps.map((s, i) => {
              const isSelected = selectedStep === s.id
              return (
                <button key={s.id} type="button" role="radio" aria-checked={isSelected} onClick={() => { setSelectedStep(s.id); setAiSuggested(a => ({ ...a, step: false })) }}
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

      <Textarea name="working" label="No que a equipe trabalhou nesta mentoria? *" defaultValue={recordToEdit?.working} required />
      <Textarea name="advice"  label="Que orientação você deu? *"       defaultValue={recordToEdit?.advice} required />
      <Textarea name="pros"       label="Pontos positivos" defaultValue={recordToEdit?.pros} />
      <Textarea name="cons"       label="A melhorar" defaultValue={recordToEdit?.cons} />
      <Textarea name="obs"        label="Observações para facilitadores" hint="Visível só para facilitadores e organização." defaultValue={recordToEdit?.obs} />
      <Textarea name="suggestion" label="Sugestão para o próximo mentor" defaultValue={recordToEdit?.suggestion} />

      {error   && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-bold flex items-center gap-2"><CircleCheck aria-hidden="true" size={18} />Mentoria {recordToEdit ? 'atualizada' : 'registrada'}!</div>}

      <button type="submit" disabled={isPending || !selectedTeam || !selectedStatus || !selectedStep}
        className="btn-primary w-full">
        {isPending ? (recordToEdit ? 'Atualizando...' : 'Registrando...') : (recordToEdit ? 'Salvar alterações' : 'Registrar mentoria')}
      </button>
    </form>
  )
}

function Textarea({ name, label, required, defaultValue, hint }: { name: string; label: string; required?: boolean; defaultValue?: string; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={`f-${name}`}>{label}</label>
      <textarea id={`f-${name}`} name={name} required={required} defaultValue={defaultValue} rows={3} className="input resize-y" />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}
