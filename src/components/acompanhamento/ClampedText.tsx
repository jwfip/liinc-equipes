'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Texto cortado em 3 linhas; "ver mais" só aparece quando de fato há texto escondido.
 * Mede de novo quando o tamanho muda: dentro de um <details> fechado o texto tem altura 0,
 * e só ao abrir dá para saber se ele foi cortado.
 */
export default function ClampedText({ text, onMore }: { text: string; onMore: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [cut, setCut] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setCut(el.scrollHeight > el.clientHeight + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])
  return (
    <>
      <p ref={ref} className="text-[12px] text-slate-600 mt-1 line-clamp-3 whitespace-pre-line">{text}</p>
      {cut && <button type="button" onClick={onMore} className="text-xs font-bold text-orange hover:text-orange-dark mt-1 min-h-[36px]">ver mais</button>}
    </>
  )
}
