'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square, X, Loader2 } from 'lucide-react'
import { AUDIO_GUIDE } from '@/lib/ai/audio-guide'

const GUIDE_KEY = 'liinc_audio_guide'

export type AudioResult = {
  transcript: string; status: string | null; stepId: number | null; fields: Record<string, string>
  project?: string | null; pivot?: boolean
}

const MAX_SECONDS = 180

function pickMimeType(): string | undefined {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return options.find(t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t))
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Grava o relato, envia para transcrição e devolve os campos sugeridos. */
export default function AudioRecorder({ kind, onResult }: { kind: 'mentoring' | 'specialist'; onResult: (r: AudioResult) => void }) {
  const [supported, setSupported] = useState(false)
  const [state, setState] = useState<'idle' | 'recording' | 'sending'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const cancelled = useRef(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = useRef(0)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
    // Saindo da página no meio da gravação: descarta (não envia para transcrição) e libera o microfone.
    return () => {
      cancelled.current = true
      if (timer.current) clearInterval(timer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
      recorder.current?.stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Roteiro aberto por padrão; se a pessoa recolher, o navegador lembra (preferência só deste aparelho).
  const [guideOpen, setGuideOpen] = useState(true)
  useEffect(() => {
    try { if (localStorage.getItem(GUIDE_KEY) === 'closed') setGuideOpen(false) } catch { /* sem armazenamento: fica aberto */ }
  }, [])
  function rememberGuide(open: boolean) {
    setGuideOpen(open)
    try { localStorage.setItem(GUIDE_KEY, open ? 'open' : 'closed') } catch { /* ignora */ }
  }

  if (!supported) return null

  async function start() {
    setError(null)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Não foi possível usar o microfone. Verifique a permissão do navegador.')
      return
    }
    const mimeType = pickMimeType()
    let rec: MediaRecorder
    try {
      rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 })
    } catch {
      stream.getTracks().forEach(t => t.stop())
      setError('Este navegador não conseguiu gravar áudio. Digite o relato.')
      return
    }
    chunks.current = []
    cancelled.current = false
    rec.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data) }
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      if (timer.current) clearInterval(timer.current)
      if (cancelled.current) { setState('idle'); return }
      if (Date.now() - startedAt.current < 2000) { setState('idle'); setError('Gravação muito curta. Fale por alguns segundos.'); return }
      send(new Blob(chunks.current, { type: rec.mimeType || mimeType || 'audio/webm' }))
    }
    recorder.current = rec
    startedAt.current = Date.now()
    rec.start(1000)
    setSeconds(0)
    setState('recording')
    timer.current = setInterval(() => {
      setSeconds(s => {
        if (s + 1 >= MAX_SECONDS) rec.state === 'recording' && rec.stop()
        return s + 1
      })
    }, 1000)
  }

  async function send(blob: Blob) {
    setState('sending')
    try {
      const fd = new FormData()
      fd.set('audio', blob, 'relato')
      fd.set('kind', kind)
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Não foi possível transcrever. Tente de novo ou digite.'); return }
      onResult(data as AudioResult)
    } catch {
      setError('Sem conexão. Tente de novo ou digite.')
    } finally {
      setState('idle')
    }
  }

  const guideList = (
    <ul className="mt-2 space-y-1">
      {AUDIO_GUIDE[kind].map(item => (
        <li key={item.key} className="text-[12px] text-slate-600 leading-snug flex gap-1.5">
          <span aria-hidden="true" className="text-orange">•</span>{item.label}
        </li>
      ))}
    </ul>
  )
  // Parado: recolhível (a escolha fica lembrada). Gravando: sempre visível, sem como recolher.
  const guide = state === 'idle' ? (
    <details open={guideOpen}
      onToggle={e => rememberGuide((e.currentTarget as HTMLDetailsElement).open)}
      className="group rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
      <summary className="cursor-pointer text-xs font-bold text-slate-600 list-none flex items-center justify-between gap-2">
        O que falar
        <span className="text-[11px] font-semibold text-slate-500 group-open:hidden">mostrar</span>
      </summary>
      {guideList}
    </details>
  ) : (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
      <p className="text-xs font-bold text-slate-600">O que falar</p>
      {guideList}
    </div>
  )

  return (
    <div className="card p-4 flex flex-col gap-3">
      {state === 'idle' && (
        <button type="button" onClick={start} className="btn-secondary w-full">
          <Mic aria-hidden="true" size={18} /> Gravar relato
        </button>
      )}
      {state === 'recording' && (
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-red-600" role="status" aria-live="polite">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" aria-hidden="true" />
            Gravando {mmss(seconds)} / {mmss(MAX_SECONDS)}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => recorder.current?.stop()} className="btn-primary flex-1">
              <Square aria-hidden="true" size={14} /> Parar e preencher
            </button>
            <button type="button" aria-label="Cancelar gravação" className="btn-secondary px-3"
              onClick={() => { cancelled.current = true; recorder.current?.stop() }}>
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      )}
      {state === 'sending' && (
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 min-h-[44px]" role="status" aria-live="polite">
          <Loader2 aria-hidden="true" size={16} className="animate-spin" /> Transcrevendo e preenchendo…
        </p>
      )}
      {state !== 'sending' && guide}
      <p className="text-[11px] text-slate-500">
        Até 3 min. A IA preenche só os campos vazios para você revisar antes de enviar. O áudio não é guardado.
      </p>
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
    </div>
  )
}
