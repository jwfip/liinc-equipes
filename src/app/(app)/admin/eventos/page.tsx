import Link from 'next/link'
import { desc, sql } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/schema'
import { createEvent } from '@/actions/events'
import AdminForm from '@/components/admin/AdminForm'
import { fmtDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function EventosPage() {
  const list = await db.select({
    id: events.id, name: events.name, company: events.company,
    startDate: events.startDate, endDate: events.endDate, active: events.active,
    teams: sql<number>`(select count(*)::int from teams t where t.event_id = events.id)`,
    members: sql<number>`(select count(*)::int from event_members m where m.event_id = events.id)`,
  }).from(events).orderBy(desc(events.active), desc(events.startDate), desc(events.id))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl">Eventos</h1>
        <p className="text-slate-500 text-sm mt-1">Cada evento tem suas próprias etapas, equipes, blocos e participantes.</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-display font-semibold text-sm mb-4 text-slate-600">Novo evento</h2>
        <AdminForm action={createEvent} submitLabel="+ Criar evento" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="label" htmlFor="ev-name">Nome</label>
            <input id="ev-name" name="name" required placeholder="Ex: Maratona de Inovação 2027" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="ev-company">Empresa</label>
            <input id="ev-company" name="company" placeholder="Opcional" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="ev-start">Início</label>
            <input id="ev-start" name="startDate" type="date" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="ev-end">Fim</label>
            <input id="ev-end" name="endDate" type="date" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="ev-copy">Copiar etapas de</label>
            <select id="ev-copy" name="copySteps" className="input" defaultValue="">
              <option value="">Não copiar</option>
              {list.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </AdminForm>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.length === 0 && <p className="text-slate-500 text-sm">Nenhum evento cadastrado.</p>}
        {list.map(e => (
          <Link key={e.id} href={`/admin/eventos/${e.id}`} className="card hover:border-orange/40 hover:shadow-md transition-all block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg truncate">{e.name}</h3>
                {e.company && <p className="text-sm text-slate-500 truncate">{e.company}</p>}
              </div>
              {e.active
                ? <span className="badge-ok shrink-0">Ativo</span>
                : <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Encerrado</span>}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {fmtDate(e.startDate)}{e.endDate ? ` – ${fmtDate(e.endDate)}` : ''} · {e.teams} equipe{e.teams === 1 ? '' : 's'} · {e.members} participante{e.members === 1 ? '' : 's'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
