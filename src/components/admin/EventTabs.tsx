'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { slug: '',              label: 'Dados' },
  { slug: 'etapas',        label: 'Etapas' },
  { slug: 'equipes',       label: 'Equipes' },
  { slug: 'blocos',        label: 'Blocos' },
  { slug: 'participantes', label: 'Participantes' },
]

export default function EventTabs({ eventId }: { eventId: number }) {
  const pathname = usePathname()
  const base = `/admin/eventos/${eventId}`
  return (
    <nav className="-mx-4 px-4 overflow-x-auto mb-6 border-b border-slate-200">
      <div className="flex gap-1 min-w-max">
        {TABS.map(t => {
          const href = t.slug ? `${base}/${t.slug}` : base
          const active = pathname === href
          return (
            <Link key={t.slug} href={href}
              className={`px-4 py-2.5 text-sm font-display font-bold border-b-2 -mb-px transition-colors ${
                active ? 'border-orange text-orange' : 'border-transparent text-slate-500 hover:text-navy'
              }`}>
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
