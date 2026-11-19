import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/schema'
import EventTabs from '@/components/admin/EventTabs'

export const dynamic = 'force-dynamic'

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const id = Number(params.id)
  const ev = Number.isInteger(id) ? await db.query.events.findFirst({ where: eq(events.id, id) }) : undefined
  if (!ev) notFound()

  return (
    <div>
      <Link href="/admin/eventos" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-navy"><ChevronLeft aria-hidden="true" size={14} />Eventos</Link>
      <div className="flex flex-wrap items-center gap-3 mt-2 mb-4">
        <h1 className="font-display font-bold text-2xl">{ev.name}</h1>
        {!ev.active && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Encerrado</span>}
      </div>
      <EventTabs eventId={ev.id} />
      {children}
    </div>
  )
}
