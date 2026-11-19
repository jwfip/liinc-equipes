import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { eventSteps } from '@/schema'
import { addStep, renameStep, moveStep, deleteStep } from '@/actions/events'
import AdminForm from '@/components/admin/AdminForm'
import ActionButton from '@/components/admin/ActionButton'

export const dynamic = 'force-dynamic'

export default async function EtapasPage({ params }: { params: { id: string } }) {
  const eventId = Number(params.id)
  const steps = await db.select().from(eventSteps)
    .where(eq(eventSteps.eventId, eventId)).orderBy(asc(eventSteps.position))

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-display font-semibold text-sm mb-1 text-slate-600">Nova etapa</h2>
        <p className="text-xs text-slate-500 mb-4">As etapas valem para todas as equipes deste evento, na ordem abaixo.</p>
        <AdminForm action={addStep.bind(null, eventId)}>
          <div className="flex-1">
            <label className="label" htmlFor="step-label">Nome da etapa</label>
            <input id="step-label" name="label" required placeholder="Ex: Protótipo" className="input" />
          </div>
        </AdminForm>
      </div>

      <div className="card p-0 overflow-hidden">
        {steps.length === 0 && <p className="px-4 py-8 text-center text-slate-500 text-sm">Nenhuma etapa cadastrada.</p>}
        <ol>
          {steps.map((s, i) => (
            <li key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-slate-200/60 last:border-0">
              <span className="w-7 h-7 rounded-full bg-navy text-white font-display font-bold text-xs flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <AdminForm action={renameStep.bind(null, s.id)} submitLabel="Renomear" resetOnSuccess={false} successMessage="Renomeada.">
                  <div className="flex-1">
                    <label className="sr-only" htmlFor={`step-${s.id}`}>Nome da etapa {i + 1}</label>
                    <input id={`step-${s.id}`} name="label" required defaultValue={s.label} className="input" />
                  </div>
                </AdminForm>
              </div>
              <div className="flex items-start gap-2 self-end sm:self-center">
                <ActionButton action={moveStep.bind(null, eventId, s.id, 'up')} title="Mover para cima">↑</ActionButton>
                <ActionButton action={moveStep.bind(null, eventId, s.id, 'down')} title="Mover para baixo">↓</ActionButton>
                <ActionButton action={deleteStep.bind(null, s.id)} className="btn-danger" confirm={`Remover a etapa "${s.label}"?`}>Remover</ActionButton>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
