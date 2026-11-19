import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/layout/SidebarNav'
import MobileNav from '@/components/layout/MobileNav'
import EventSwitcher from '@/components/layout/EventSwitcher'
import { getEventContext } from '@/lib/event-context'
import { roleLabel as labelForRole } from '@/lib/participation'

async function doSignOut() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  const ctx = await getEventContext()
  const roleLabel = ctx.isAdmin ? 'Administrador' : (labelForRole(ctx.role) ?? 'Sem evento')
  const switcher = <EventSwitcher options={ctx.options} current={ctx.event} isAdmin={ctx.isAdmin} />

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-navy font-sans">
      {/* Celular: cabeçalho com logo e evento; navegação na barra inferior */}
      <header className="md:hidden bg-navy text-white sticky top-0 z-40 shadow-md px-4 pt-3 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/liinc-logo-dark-bg.svg" alt="Liinc" width={72} height={17} className="h-[17px] w-auto" />
          <div className="w-px h-5 bg-white/20 mx-1" />
          <span className="font-display font-semibold text-sm">Mentorias</span>
          <span className="ml-auto text-[10px] text-orange/80 uppercase tracking-widest font-bold">{roleLabel}</span>
        </div>
        {switcher}
      </header>
      <MobileNav role={session.user.role as string} eventRole={ctx.role} userLabel={session.user.email ?? ''} signOut={doSignOut} />

      {/* Desktop Sidebar */}
      <aside className="w-[260px] shrink-0 bg-navy text-white flex-col hidden md:flex h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,2,34,0.12)] z-10">
        <div className="p-7 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/liinc-logo-dark-bg.svg" alt="Liinc" width={100} height={23} className="h-[23px] w-auto" />
            <div className="w-px h-8 bg-white/15" />
            <div>
              <p className="font-display font-semibold text-[15px] leading-tight text-white/90 tracking-wide">Mentorias</p>
              <p className="text-[10px] text-orange/80 uppercase tracking-widest font-bold mt-1">{roleLabel}</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Evento</p>
            {switcher}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <SidebarNav role={session.user.role as string} eventRole={ctx.role} />
        </div>
        <div className="p-5 border-t border-white/10 bg-white/[0.02]">
          <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {session.user.email}
          </div>
          <form action={doSignOut}>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-display font-bold text-xs transition-colors">
              Sair da Plataforma
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col md:h-screen overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+64px)] md:pb-0">
        <div className="flex-1 md:overflow-y-auto relative">
          {children}
        </div>
      </main>
    </div>
  )
}
