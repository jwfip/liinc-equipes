import { LayoutDashboard, NotebookPen, MessagesSquare, KeyRound, CalendarDays, Users, FileText, type LucideIcon } from 'lucide-react'

export type NavItem = { href: string; label: string; short: string; Icon: LucideIcon }

export function mainNav(eventRole: string | null): NavItem[] {
  return [
    { href: '/painel', label: 'Painel Geral', short: 'Painel', Icon: LayoutDashboard },
    eventRole === 'specialist'
      ? { href: '/mentoria', label: 'Novo Atendimento', short: 'Atendimento', Icon: MessagesSquare }
      : { href: '/mentoria', label: 'Nova Mentoria', short: 'Mentoria', Icon: NotebookPen },
  ]
}

export const ACCOUNT_NAV: NavItem = { href: '/conta/senha', label: 'Alterar senha', short: 'Senha', Icon: KeyRound }

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/eventos',   label: 'Eventos',         short: 'Eventos',   Icon: CalendarDays },
  { href: '/admin/mentores',  label: 'Mentores',        short: 'Mentores',  Icon: Users },
  { href: '/admin/relatorio', label: 'Relatório final', short: 'Relatório', Icon: FileText },
]

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/')
