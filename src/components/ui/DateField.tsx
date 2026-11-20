'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { formatBrDate, maskDate, parseBrDate } from '@/lib/date-input'

interface Props {
  id:            string
  name:          string
  required?:     boolean
  /** aaaa-mm-dd, como vem do banco */
  defaultValue?: string | null
}

/**
 * Data sempre em dd/mm/aaaa (o campo nativo segue o idioma do aparelho e estoura no iPhone).
 * Digita só números ou abre o calendário do aparelho; o formulário recebe aaaa-mm-dd no mesmo `name`.
 */
export default function DateField({ id, name, required, defaultValue }: Props) {
  const [text, setText] = useState(formatBrDate(defaultValue))
  const [touched, setTouched] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLInputElement | null>(null)

  // O AdminForm limpa o formulário depois de salvar (form.reset()), que não alcança o estado do React.
  useEffect(() => {
    const form = textRef.current?.form
    if (!form) return
    const onReset = () => { setText(formatBrDate(defaultValue)); setTouched(false) }
    form.addEventListener('reset', onReset)
    return () => form.removeEventListener('reset', onReset)
  }, [defaultValue])
  const iso = parseBrDate(text)
  const invalid = text !== '' && !iso
  const showError = invalid && touched

  function openPicker() {
    const el = picker.current as (HTMLInputElement & { showPicker?: () => void }) | null
    if (el?.showPicker) {
      try { el.showPicker(); return } catch { /* sem gesto válido ou não suportado: cai no foco */ }
    }
    document.getElementById(id)?.focus()
  }

  return (
    <div>
      <div className="relative">
        <input
          id={id} type="text" inputMode="numeric" autoComplete="off" placeholder="dd/mm/aaaa" maxLength={10}
          required={required} value={text} aria-invalid={showError || undefined} aria-describedby={showError ? `${id}-err` : `${id}-hint`}
          onChange={e => setText(maskDate(e.target.value))}
          onBlur={() => setTouched(true)}
          onInvalid={() => setTouched(true)}
          ref={el => { textRef.current = el; el?.setCustomValidity(invalid ? 'Data inválida' : '') }}
          className={`input pr-12 ${showError ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
        />
        <button type="button" onClick={openPicker} aria-label="Abrir calendário"
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100">
          <Calendar aria-hidden="true" size={18} />
        </button>
        {/* Seletor nativo escondido: só abre o calendário do aparelho */}
        <input ref={picker} type="date" tabIndex={-1} aria-hidden="true" value={iso ?? ''}
          onChange={e => { setText(formatBrDate(e.target.value)); setTouched(true) }}
          className="absolute right-0 bottom-0 w-px h-px opacity-0 pointer-events-none" />
      </div>
      <input type="hidden" name={name} value={iso ?? ''} />
      {showError
        ? <p id={`${id}-err`} className="text-xs text-red-600 mt-1">Data inválida</p>
        : <p id={`${id}-hint`} className="text-xs text-slate-500 mt-1">dd/mm/aaaa</p>}
    </div>
  )
}
