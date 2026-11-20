'use client'

import { MessagesSquare, CircleCheck } from 'lucide-react'

import { useRef, useState, useTransition } from 'react'
import { submitAtendimento, updateAtendimento } from '@/actions/mentoria'
import { fmtDate } from '@/lib/format'
import TeamPicker from './TeamPicker'
import AudioRecorder, { type AudioResult } from './AudioRecorder'
import { ProjectReadOnly } from './ProjectField'
import type { ProjectInfo } from '@/lib/project'

type Team  = { id: string; number: number; name: string }
type Block = { id: number; label: string; date: string } | null

interface Props {
  teams:         Team[]
  activeBlock:   Block
  projects:      Record<string, ProjectInfo>
  recordToEdit?: { id: string; teamId: string; topic: string | null; advice: string | null; obs: string | null }
}

export default function AtendimentoForm({ teams, activeBlock, projects, recordToEdit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [teamId, setTeamId] = useState(recordToEdit?.teamId ?? '')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function applyAudio(r: AudioResult) {
    setTranscript(r.transcript)
    for (const [name, value] of Object.entries(r.fields)) {
      const el = formRef.current?.elements.namedItem(name)
      if (el instanceof HTMLTextAreaElement && !el.value.trim()) el.value = value
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('teamId', teamId)
    setError(null)
    startTransition(async () => {
      try {
        const r = recordToEdit ? await updateAtendimento(recordToEdit.id, fd) : await submitAtendimento(fd)
        if (!r.ok) { setError(r.error); return }
        setSuccess(true)
        if (!recordToEdit) { setTeamId(''); setTranscript(''); form.reset() }
        setTimeout(() => setSuccess(false), 4000)
      } catch {
        setError('Erro inesperado. Tente novamente.')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} method="post" className="space-y-5">
      <div className="card flex items-center gap-3 bg-orange/10 border-orange/30">
        <MessagesSquare aria-hidden="true" size={26} className="text-orange shrink-0" />
        <div>
          {activeBlock ? (
            <>
              <p className="text-xs text-orange font-semibold">{recordToEdit ? 'Bloco do registro' : 'Bloco ativo'}</p>
              <p className="font-display font-bold">{activeBlock.label}</p>
              <p className="text-xs text-slate-500">{fmtDate(activeBlock.date)}</p>
            </>
          ) : (
            <>
              <p className="font-display font-bold">Fora de bloco</p>
              <p className="text-xs text-slate-500">{recordToEdit ? 'Registrado sem bloco ativo.' : 'Nenhum bloco ativo agora. O atendimento fica registrado mesmo assim.'}</p>
            </>
          )}
        </div>
      </div>

      {!recordToEdit && <TeamPicker teams={teams} value={teamId} onChange={setTeamId} />}
      {teamId && <ProjectReadOnly project={projects[teamId] ?? null} />}

      <AudioRecorder kind="specialist" onResult={applyAudio} />
      <input type="hidden" name="audioTranscript" value={transcript} />

      <Field name="topic"  label="Tema ou dúvida *" required defaultValue={recordToEdit?.topic} placeholder="Ex: Como precificar o produto" />
      <Field name="advice" label="Orientação dada *" required defaultValue={recordToEdit?.advice} />
      <Field name="obs"    label="Observações para facilitadores" hint="Visível só para facilitadores e organização." defaultValue={recordToEdit?.obs} />

      {error   && <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
      {success && <div role="status" className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-bold flex items-center gap-2"><CircleCheck aria-hidden="true" size={18} />Atendimento {recordToEdit ? 'atualizado' : 'registrado'}!</div>}

      <button type="submit" disabled={isPending || !teamId} className="btn-primary w-full">
        {isPending ? 'Salvando...' : recordToEdit ? 'Salvar alterações' : 'Registrar atendimento'}
      </button>
    </form>
  )
}

function Field({ name, label, required, defaultValue, placeholder, hint }: {
  name: string; label: string; required?: boolean; defaultValue?: string | null; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="label" htmlFor={`f-${name}`}>{label}</label>
      <textarea id={`f-${name}`} name={name} required={required} defaultValue={defaultValue ?? undefined}
        placeholder={placeholder} rows={3} className="input resize-y" />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}
