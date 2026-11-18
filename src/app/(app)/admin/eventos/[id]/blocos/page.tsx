import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { blocks } from '@/schema'
import { createBlock, activateBlock, deactivateBlock } from '@/actions/admin'
import AdminForm from '@/components/admin/AdminForm'
import ActionButton from '@/components/admin/ActionButton'
import { fmtDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function BlocosPage({ params }: { params: { id: string } }) {
  const eventId = Number(params.id)
  const list = await db.select().from(blocks).where(eq(blocks.eventId, eventId)).orderBy(asc(blocks.date), asc(blocks.id))

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-display font-semibold text-sm mb-1 text-slate-600">Adicionar bloco</h2>
        <p className="text-xs text-slate-500 mb-4">Apenas 1 bloco pode estar ativo por vez neste evento. Mentorias são registradas no bloco ativo.</p>
        <AdminForm action={createBlock.bind(null, eventId)}>
          <div className="flex-1">
            <label className="label" htmlFor="block-label">Nome</label>
            <input id="block-label" name="label" type="text" required placeholder="Bloco 1" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="block-date">Data</label>
            <input id="block-date" name="date" type="date" required className="input" />
          </div>
        </AdminForm>
      </div>

      <div className="card p-0 overflow-hidden">
        {list.length === 0 && <p className="px-4 py-8 text-center text-slate-500 text-sm">Nenhum bloco cadastrado.</p>}
        <ul>
          {list.map(b => (
            <li key={b.id} className="flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-slate-200/60 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{b.label}</p>
                <p className="text-xs text-slate-500">{fmtDate(b.date)}</p>
              </div>
              {b.active ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-orange/20 text-orange border border-orange/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />Ativo
                </span>
              ) : (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Inativo</span>
              )}
              {b.active
                ? <ActionButton action={deactivateBlock.bind(null, eventId, b.id)} className="btn-danger">Desativar</ActionButton>
                : <ActionButton action={activateBlock.bind(null, eventId, b.id)} className="btn-primary text-xs py-1.5">Ativar</ActionButton>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
