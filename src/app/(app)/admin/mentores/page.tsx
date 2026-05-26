import { db } from '@/db'
import { createMentor, toggleMentor } from '@/actions/admin'

export const dynamic = 'force-dynamic'

export default async function MentoresPage() {
  const mentors = await db.query.mentors.findMany({
    orderBy: (m, { asc }) => [asc(m.name)],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl">Mentores</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie os mentores do evento.</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-display font-semibold text-sm mb-4 text-slate-600">Adicionar mentor</h2>
        <form action={async (fd: FormData) => {
          'use server'
          await createMentor(fd.get('name') as string, (fd.get('username') as string).toLowerCase().trim())
        }} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label">Nome</label>
            <input name="name" type="text" required placeholder="Nome completo" className="input" />
          </div>
          <div className="flex-1">
            <label className="label">Usuário</label>
            <input name="username" type="text" required placeholder="Ex: joao.silva" className="input" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary h-[38px]">+ Adicionar</button>
          </div>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          Após cadastrar, o mentor poderá fazer login informando seu usuário e a senha do evento (<strong>{process.env.EVENT_ACCESS_CODE || 'liinc2026'}</strong>).
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody>
            {mentors.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhum mentor cadastrado.</td></tr>
            )}
            {mentors.map(m => (
              <tr key={m.id} className="border-b border-slate-200/50 hover:bg-navy/50 transition-colors">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-slate-500">{m.email}</td>
                <td className="px-4 py-3">
                  {m.active
                    ? <span className="badge-ok">Ativo</span>
                    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700/50 text-slate-500 border border-slate-600/30">Inativo</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={async () => { 'use server'; await toggleMentor(m.id, !m.active) }}>
                    <button type="submit" className={m.active ? 'btn-danger' : 'btn-secondary text-xs py-1.5'}>
                      {m.active ? 'Desativar' : 'Ativar'}
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
