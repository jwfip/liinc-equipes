'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { slug: '',              label: 'Dados' },
  { slug: 'etapas',        label: 'Etapas' },
  { slug: 'equipes',       label: 'Equipes' },
  { slug: 'blocos',        label: 'Blocos' },
  { slug: 'participantes', label: 'Participantes' },
  { slug: 'relatorio',     label: 'Relatório final' },
]

export default function EventTabs({ eventId }: { eventId: number }) {
  const pathname = usePathname()
  const base = `/admin/eventos/${eventId}`
  const activeRef = useRef<HTMLAnchorElement>(null)

  // No celular a faixa rola para o lado: a aba atual fica sempre visível.
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [pathname])

  return (
    <div className="relative -mx-4 mb-6 print:hidden">
      <nav aria-label="Seções do evento" className="px-4 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-1 min-w-max pr-8">
          {TABS.map(t => {
            const href = t.slug ? `${base}/${t.slug}` : base
            const active = pathname === href
            return (
              <Link key={t.slug} href={href} ref={active ? activeRef : undefined} aria-current={active ? 'page' : undefined}
                className={`min-h-[44px] inline-flex items-center px-4 text-sm font-display font-bold border-b-2 -mb-px transition-colors ${
                  active ? 'border-orange text-orange' : 'border-transparent text-slate-500 hover:text-navy'
                }`}>
                {t.label}
              </Link>
            )
          })}
        </div>
      </nav>
      {/* Degradê na borda: indica que há mais abas para o lado (só no celular) */}
      <div aria-hidden="true" className="md:hidden pointer-events-none absolute right-0 top-0 bottom-px w-10 bg-gradient-to-l from-slate-50 to-transparent" />
    </div>
  )
}
