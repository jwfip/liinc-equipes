import { db } from '@/db'
import { createTeam, toggleTeam } from '@/actions/admin'

export const dynamic = 'force-dynamic'

export default async function EquipesPage() {
  const teams = await db.query.teams.findMany({
    orderBy: (t, { asc }) => [asc(t.number)],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl">Equipes</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie as equipes do evento.</p>
      </div>

      {/* Add form */}
      <div className="card mb-6">
        <h2 className="font-display font-semibold text-sm mb-4 text-slate-600">Adicionar equipe</h2>
        <form action={async (fd: FormData) => {
          'use server'
          await createTeam(parseInt(fd.get('number') as string, 10), fd.get('name') as string)
        }} className="flex flex-col sm:flex-row gap-3">
          <div className="w-24 shrink-0">
            <label className="label">Nº</label>
            <input name="number" type="number" required min="1" placeholder="01" className="input" />
          </div>
          <div className="flex-1">
            <label className="label">Nome</label>
            <input name="name" type="text" required placeholder="Ex: ALVORADA" className="input" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary h-[38px]">+ Adicionar</button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Nº</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhuma equipe cadastrada.</td></tr>
            )}
            {teams.map(t => (
              <tr key={t.id} className="border-b border-slate-200/50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold text-orange">{t.number}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">
                  {t.active
                    ? <span className="badge-ok">Ativo</span>
                    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700/50 text-slate-500 border border-slate-600/30">Inativo</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={async () => { 'use server'; await toggleTeam(t.id, !t.active) }}>
                    <button type="submit" className={t.active ? 'btn-danger' : 'btn-secondary text-xs py-1.5'}>
                      {t.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
