'use client'

import { useEffect, useRef } from 'react'
import { X, UserRound } from 'lucide-react'
import type { EventPerson } from '@/lib/follow-up'

const ROLE: Record<EventPerson['role'], string> = { mentor: 'Mentor', specialist: 'Especialista' }

/** Perfil de um mentor ou especialista (área e experiência), visível só para facilitador e admin. */
export default function PersonProfile({ person, onClose }: { person: EventPerson; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  // onClose muda a cada render do pai (polling de 5 s): guardado em ref para o foco não pular.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    // Ao fechar, o foco volta ao nome que abriu o perfil.
    const trigger = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); trigger?.focus?.() }
  }, [])

  const empty = !person.area && !person.experience
  return (
    <div className="fixed inset-0 z-[600] flex items-end md:items-center justify-center bg-navy/70 p-0 md:p-5"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="person-name"
        className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start gap-3 p-5 border-b border-slate-200">
          <UserRound aria-hidden="true" size={22} className="text-orange shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 id="person-name" className="font-display font-bold text-lg text-navy leading-tight">{person.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{ROLE[person.role]}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          {empty ? (
            <p className="text-sm text-slate-400 italic">Perfil não preenchido. A organização preenche em Mentores.</p>
          ) : (
            <>
              {person.area && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Área de atuação</h3>
                  <p className="text-sm text-navy font-semibold mt-0.5">{person.area}</p>
                </section>
              )}
              {person.experience && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experiência</h3>
                  <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line leading-relaxed">{person.experience}</p>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
