import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/layout/SidebarNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-navy flex flex-col md:flex-row">
      {/* Mobile Header (Top) */}
      <header className="md:hidden bg-navy-light border-b border-navy-muted flex items-center justify-between p-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧭</span>
          <span className="font-display font-bold text-sm">Liinc Mentorias</span>
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
          <button type="submit" className="text-xs font-semibold text-slate-400">Sair</button>
        </form>
      </header>

      {/* Mobile Nav (Bottom/Horizontal) - optionally scrollable or just a menu */}
      <div className="md:hidden bg-navy border-b border-navy-muted overflow-x-auto">
        <div className="flex p-2 gap-2 min-w-max">
          <SidebarNav role={session.user.role as string} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 shrink-0 bg-navy-light border-r border-navy-muted flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-5 border-b border-navy-muted">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <p className="font-display font-bold text-base leading-tight">Liinc Mentorias</p>
              <p className="text-xs text-orange">{session.user.role === 'admin' ? 'Administrador' : 'Mentor'}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav role={session.user.role as string} />
        </div>
        <div className="p-4 border-t border-navy-muted">
          <div className="px-2 text-xs text-slate-400 truncate mb-3">{session.user.email}</div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
            <button type="submit" className="btn-secondary w-full justify-center text-sm py-2">Sair</button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-[calc(100vh-130px)] md:h-screen">
        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>
      </main>
    </div>
  )
}
