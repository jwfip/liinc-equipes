import Link from 'next/link'
import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

const NAV = [
  { href: '/admin/equipes',  icon: '👥', label: 'Equipes'  },
  { href: '/admin/mentores', icon: '🎓', label: 'Mentores' },
  { href: '/admin/blocos',   icon: '🕐', label: 'Blocos'   },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/painel')

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-navy-light border-r border-navy-muted flex-col hidden md:flex">
        <div className="p-5 border-b border-navy-muted">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧭</span>
            <div>
              <p className="font-display font-bold text-sm leading-tight">Liinc Mentorias</p>
              <p className="text-xs text-orange">Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-navy hover:text-white transition-colors">
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
          <Link href="/painel"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-navy hover:text-white transition-colors mt-2">
            <span>📊</span><span>Ver painel</span>
          </Link>
        </nav>
        <div className="p-3 border-t border-navy-muted">
          <div className="px-3 py-1 text-xs text-slate-400 truncate mb-2">{session.user.email}</div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
            <button type="submit" className="btn-secondary w-full justify-center text-xs py-1.5">Sair</button>
          </form>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-navy-light border-b border-navy-muted px-4 py-3 flex items-center gap-3 overflow-x-auto">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-navy border border-navy-muted whitespace-nowrap">
              {item.icon} {item.label}
            </Link>
          ))}
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
