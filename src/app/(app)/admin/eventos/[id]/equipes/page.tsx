import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { teams } from '@/schema'
import { createTeam, toggleTeam } from '@/actions/admin'
import AdminForm from '@/components/admin/AdminForm'
import ActionButton from '@/components/admin/ActionButton'

export const dynamic = 'force-dynamic'

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="badge-ok">Ativa</span>
    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Inativa</span>
}

export default async function EquipesPage({ params }: { params: { id: string } }) {
  const eventId = Number(params.id)
  const list = await db.select().from(teams).where(eq(teams.eventId, eventId)).orderBy(asc(teams.number))

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-display font-semibold text-sm mb-4 text-slate-600">Adicionar equipe</h2>
        <AdminForm action={createTeam.bind(null, eventId)}>
          <div className="sm:w-24 shrink-0">
            <label className="label" htmlFor="team-number">Nº</label>
            <input id="team-number" name="number" type="number" required min="1" placeholder="01" className="input" />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="team-name">Nome</label>
            <input id="team-name" name="name" type="text" required placeholder="Ex: ALVORADA" className="input" />
          </div>
        </AdminForm>
      </div>

      <div className="card p-0 overflow-hidden">
        {list.length === 0 && <p className="px-4 py-8 text-center text-slate-500 text-sm">Nenhuma equipe cadastrada.</p>}
        <ul>
          {list.map(t => (
            <li key={t.id} className="flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-slate-200/60 last:border-0">
              <span className="font-display font-bold text-orange w-8 shrink-0">{t.number}</span>
              <span className="flex-1 min-w-0 font-medium truncate">{t.name}</span>
              <StatusBadge active={t.active} />
              <ActionButton action={toggleTeam.bind(null, t.id, !t.active)}
                className={t.active ? 'btn-danger' : 'btn-secondary text-xs py-1.5'}>
                {t.active ? 'Desativar' : 'Ativar'}
              </ActionButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
