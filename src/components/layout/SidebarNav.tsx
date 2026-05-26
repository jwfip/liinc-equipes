'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_PUBLIC = [
  { href: '/painel',   icon: '📊', label: 'Painel Geral' },
  { href: '/mentoria', icon: '📝', label: 'Nova Mentoria' },
]

const NAV_ADMIN = [
  { href: '/admin/equipes',  icon: '👥', label: 'Equipes' },
  { href: '/admin/mentores', icon: '🎓', label: 'Mentores' },
  { href: '/admin/blocos',   icon: '🕐', label: 'Blocos & Evento' },
]

export default function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname()

  const NavItem = ({ href, icon, label }: { href: string; icon: string; label: string }) => {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href} className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] transition-all duration-200 ${
        isActive 
          ? 'bg-orange text-white font-bold shadow-md shadow-orange/20' 
          : 'text-slate-400 font-medium hover:bg-white/5 hover:text-slate-200'
      }`}>
        <span className="text-lg opacity-90">{icon}</span>
        <span className="font-display tracking-wide">{label}</span>
      </Link>
    )
  }

  return (
    <nav className="px-4 flex md:flex-col gap-2 md:gap-0 md:space-y-8 w-full">
      <div className="flex md:flex-col gap-2 md:gap-0 md:space-y-1.5 items-center md:items-stretch w-max md:w-auto">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:block mb-3">Acesso Rápido</p>
        {NAV_PUBLIC.map(item => <NavItem key={item.href} {...item} />)}
      </div>

      {role === 'admin' && (
        <div className="flex md:flex-col gap-2 md:gap-0 md:space-y-1.5 items-center md:items-stretch w-max md:w-auto border-l border-white/10 pl-4 md:border-0 md:pl-0">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:block mb-3">Administração</p>
          {NAV_ADMIN.map(item => <NavItem key={item.href} {...item} />)}
        </div>
      )}
    </nav>
  )
}
