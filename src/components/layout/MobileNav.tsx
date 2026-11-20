'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut } from 'lucide-react'
import { mainNav, ACCOUNT_NAV, ADMIN_NAV, isActive } from './nav-items'

interface Props {
  role:      string
  eventRole: string | null
  userLabel: string
  signOut:   () => Promise<void>
}

/** Barra inferior fixa no celular, com menu "Mais" para conta e administração. */
export default function MobileNav({ role, eventRole, userLabel, signOut }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const moreButton = useRef<HTMLButtonElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  useEffect(() => setOpen(false), [pathname])

  // Menu aberto: foco no primeiro item, Esc fecha, página atrás não rola; ao fechar, foco volta ao botão "Mais".
  useEffect(() => {
    if (!open) return
    sheet.current?.querySelector<HTMLElement>('a, button:not([aria-label="Fechar menu"])')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    const button = moreButton.current
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      button?.focus()
    }
  }, [open])

  const main = mainNav(eventRole, role === 'admin')
  const more = [...(role === 'admin' ? ADMIN_NAV : []), ACCOUNT_NAV]
  const moreActive = more.some(i => isActive(pathname, i.href))

  return (
    <>
      {open && (
        <div className="md:hidden fixed inset-0 z-[60] bg-navy/60" onClick={() => setOpen(false)}>
          <div ref={sheet} role="dialog" aria-modal="true" aria-label="Mais opções"
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{userLabel}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="p-2 -mr-2 text-slate-500"><X aria-hidden="true" size={20} /></button>
            </div>
            <ul className="flex flex-col">
              {more.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} aria-current={isActive(pathname, href) ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-3.5 rounded-xl font-display font-bold text-[15px] ${
                      isActive(pathname, href) ? 'bg-orange/10 text-orange-dark' : 'text-navy'}`}>
                    <Icon aria-hidden="true" size={20} /> {label}
                  </Link>
                </li>
              ))}
              <li>
                <form action={signOut}>
                  <button type="submit" className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl font-display font-bold text-[15px] text-red-600">
                    <LogOut aria-hidden="true" size={20} /> Sair
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      )}

      <nav aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-navy border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        {/* Uma coluna por item + "Mais": com 3 itens (admin) a grade fixa de 3 jogava o "Mais" para outra linha. */}
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${main.length + 1}, minmax(0, 1fr))` }}>
          {main.map(({ href, short, Icon }) => {
            const active = isActive(pathname, href)
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-display font-bold ${
                    active ? 'text-orange' : 'text-slate-300'}`}>
                  <Icon aria-hidden="true" size={22} /> {short}
                </Link>
              </li>
            )
          })}
          <li>
            <button ref={moreButton} type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="dialog"
              className={`w-full flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-display font-bold ${
                open || moreActive ? 'text-orange' : 'text-slate-300'}`}>
              <Menu aria-hidden="true" size={22} /> Mais
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
