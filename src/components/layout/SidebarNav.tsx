'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { mainNav, ACCOUNT_NAV, ADMIN_NAV, isActive, type NavItem } from './nav-items'

export default function SidebarNav({ role, eventRole = null }: { role: string; eventRole?: string | null }) {
  const pathname = usePathname()

  const Item = ({ href, label, Icon }: NavItem) => {
    const active = isActive(pathname, href)
    return (
      <Link href={href} aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] transition-all duration-200 ${
          active ? 'bg-orange text-white font-bold shadow-md shadow-orange/20' : 'text-slate-400 font-medium hover:bg-white/5 hover:text-slate-200'
        }`}>
        <Icon aria-hidden="true" size={18} strokeWidth={2} />
        <span className="font-display tracking-wide">{label}</span>
      </Link>
    )
  }

  return (
    <nav aria-label="Navegação principal" className="px-4 flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-1.5">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Acesso rápido</p>
        {[...mainNav(eventRole), ACCOUNT_NAV].map(item => <Item key={item.href} {...item} />)}
      </div>
      {role === 'admin' && (
        <div className="flex flex-col gap-1.5">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Administração</p>
          {ADMIN_NAV.map(item => <Item key={item.href} {...item} />)}
        </div>
      )}
    </nav>
  )
}
