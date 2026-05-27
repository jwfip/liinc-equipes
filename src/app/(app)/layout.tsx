import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/layout/SidebarNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-navy font-sans">
      {/* Mobile Header (Top) */}
      <header className="md:hidden bg-navy text-white flex items-center justify-between p-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-xl text-orange tracking-tighter">Liinc</span>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <span className="font-display font-semibold text-sm">Mentorias</span>
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
          <button type="submit" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">Sair</button>
        </form>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden bg-navy border-t border-white/10 overflow-x-auto">
        <div className="flex p-2 gap-2 min-w-max">
          <SidebarNav role={session.user.role as string} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-[260px] shrink-0 bg-navy text-white flex-col hidden md:flex h-screen sticky top-0 shadow-[4px_0_24px_rgba(26,39,68,0.12)] z-10">
        <div className="p-7 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-3xl text-orange tracking-tighter">Liinc</span>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <p className="font-display font-semibold text-[15px] leading-tight text-white/90 tracking-wide">Mentorias</p>
              <p className="text-[10px] text-orange/80 uppercase tracking-widest font-bold mt-1">{session.user.role === 'admin' ? 'Administrador' : 'Mentor'}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <SidebarNav role={session.user.role as string} />
        </div>
        <div className="p-5 border-t border-white/10 bg-white/[0.02]">
          <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {session.user.email}
          </div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-display font-bold text-xs transition-colors">
              Sair da Plataforma
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col md:h-screen overflow-x-hidden">
        <div className="flex-1 md:overflow-y-auto relative">
          {children}
        </div>
      </main>
    </div>
  )
}
