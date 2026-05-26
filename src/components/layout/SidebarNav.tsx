'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_PUBLIC = [
  { href: '/painel',   icon: '📊', label: 'Painel' },
  { href: '/mentoria', icon: '📝', label: 'Nova Mentoria' },
]

const NAV_ADMIN = [
  { href: '/admin/equipes',  icon: '👥', label: 'Equipes' },
  { href: '/admin/mentores', icon: '🎓', label: 'Mentores' },
  { href: '/admin/blocos',   icon: '🕐', label: 'Blocos' },
]

export default function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname()

  const NavItem = ({ href, icon, label }: { href: string; icon: string; label: string }) => {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-orange/10 text-orange font-bold' : 'text-slate-300 hover:bg-navy hover:text-white'
      }`}>
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <nav className="p-2 md:p-4 flex md:flex-col gap-4 md:gap-0 md:space-y-8 w-full">
      <div className="flex md:flex-col gap-2 md:gap-0 md:space-y-1 items-center md:items-stretch w-max md:w-auto">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:block mb-2">Plataforma</p>
        {NAV_PUBLIC.map(item => <NavItem key={item.href} {...item} />)}
      </div>

      {role === 'admin' && (
        <div className="flex md:flex-col gap-2 md:gap-0 md:space-y-1 items-center md:items-stretch w-max md:w-auto border-l border-navy-muted pl-4 md:border-0 md:pl-0">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:block mb-2">Administração</p>
          {NAV_ADMIN.map(item => <NavItem key={item.href} {...item} />)}
        </div>
      )}
    </nav>
  )
}
