import { db } from '@/db'
import { createBlock, activateBlock, deactivateBlock } from '@/actions/admin'

export const dynamic = 'force-dynamic'

export default async function BlocosPage() {
  const blocks = await db.query.blocks.findMany({
    orderBy: (b, { asc }) => [asc(b.id)],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl">Blocos</h1>
        <p className="text-slate-400 text-sm mt-1">Apenas 1 bloco pode estar ativo por vez.</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-display font-semibold text-sm mb-4 text-slate-300">Adicionar bloco</h2>
        <form action={async (fd: FormData) => {
          'use server'
          await createBlock(fd.get('label') as string, fd.get('date') as string)
        }} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label">Label</label>
            <input name="label" type="text" required placeholder="Bloco 1" className="input" />
          </div>
          <div>
            <label className="label">Data</label>
            <input name="date" type="date" required className="input" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary h-[38px]">+ Adicionar</button>
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-muted">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bloco</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 w-32" />
            </tr>
          </thead>
          <tbody>
            {blocks.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nenhum bloco cadastrado.</td></tr>
            )}
            {blocks.map(b => (
              <tr key={b.id} className="border-b border-navy-muted/50 hover:bg-navy/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <span className="text-orange font-bold mr-2">#{b.id}</span>{b.label}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(b.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  {b.active ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-orange/20 text-orange border border-orange/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />Ativo
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700/50 text-slate-400 border border-slate-600/30">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {b.active ? (
                    <form action={async () => { 'use server'; await deactivateBlock(b.id) }}>
                      <button type="submit" className="btn-danger">Desativar</button>
                    </form>
                  ) : (
                    <form action={async () => { 'use server'; await activateBlock(b.id) }}>
                      <button type="submit" className="btn-primary text-xs py-1.5">Ativar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
