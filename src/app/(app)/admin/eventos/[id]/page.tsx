import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/schema'
import { updateEvent, setEventActive } from '@/actions/events'
import AdminForm from '@/components/admin/AdminForm'
import ActionButton from '@/components/admin/ActionButton'

export const dynamic = 'force-dynamic'

export default async function EventDadosPage({ params }: { params: { id: string } }) {
  const ev = (await db.query.events.findFirst({ where: eq(events.id, Number(params.id)) }))!

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-display font-semibold text-sm mb-4 text-slate-600">Dados do evento</h2>
        <AdminForm action={updateEvent.bind(null, ev.id)} submitLabel="Salvar" resetOnSuccess={false}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="label" htmlFor="name">Nome</label>
            <input id="name" name="name" required defaultValue={ev.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="company">Empresa</label>
            <input id="company" name="company" defaultValue={ev.company ?? ''} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="startDate">Início</label>
            <input id="startDate" name="startDate" type="date" required defaultValue={ev.startDate} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endDate">Fim</label>
            <input id="endDate" name="endDate" type="date" defaultValue={ev.endDate ?? ''} className="input" />
          </div>
        </AdminForm>
      </div>

      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-sm text-slate-600">{ev.active ? 'Evento ativo' : 'Evento encerrado'}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {ev.active
              ? 'Participantes veem o evento e podem registrar mentorias.'
              : 'O evento fica visível só para administradores, em modo de consulta.'}
          </p>
        </div>
        <ActionButton
          action={setEventActive.bind(null, ev.id, !ev.active)}
          className={ev.active ? 'btn-danger' : 'btn-primary text-xs py-1.5'}
          confirm={ev.active ? 'Encerrar este evento? Os participantes deixarão de vê-lo.' : undefined}>
          {ev.active ? 'Encerrar evento' : 'Reativar evento'}
        </ActionButton>
      </div>
    </div>
  )
}
