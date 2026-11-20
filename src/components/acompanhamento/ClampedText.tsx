'use client'

import { useLayoutEffect, useRef, useState } from 'react'

/** Texto cortado em 3 linhas; "ver mais" só aparece quando de fato há texto escondido. */
export default function ClampedText({ text, onMore }: { text: string; onMore: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [cut, setCut] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (el) setCut(el.scrollHeight > el.clientHeight + 1)
  }, [text])
  return (
    <>
      <p ref={ref} className="text-[12px] text-slate-600 mt-1 line-clamp-3 whitespace-pre-line">{text}</p>
      {cut && <button type="button" onClick={onMore} className="text-xs font-bold text-orange hover:text-orange-dark mt-1 min-h-[36px]">ver mais</button>}
    </>
  )
}
