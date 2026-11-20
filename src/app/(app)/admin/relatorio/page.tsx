import { redirect } from 'next/navigation'
import { getEventContext } from '@/lib/event-context'

export const dynamic = 'force-dynamic'

/** Rota antiga: leva ao relatório final do evento selecionado. */
export default async function RelatorioRedirect() {
  const ctx = await getEventContext()
  if (!ctx.isAdmin) redirect('/painel')
  redirect(ctx.event ? `/admin/eventos/${ctx.event.id}/relatorio` : '/admin/eventos')
}
