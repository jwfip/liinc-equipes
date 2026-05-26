import { db } from '@/db'
import { blocks, teams, mentoringRecords } from '@/schema'
import { eq } from 'drizzle-orm'
import { auth, signOut } from '@/auth'
import MentoriaForm from '@/components/mentoria/MentoriaForm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditMentoriaPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const recordId = params.id

  const record = await db.query.mentoringRecords.findFirst({
    where: eq(mentoringRecords.id, recordId),
    with: { mentor: true, block: true }
  })

  if (!record) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <h2 className="font-display font-bold text-lg mb-1">Registro não encontrado</h2>
          <Link href="/painel" className="text-orange text-sm font-bold">Voltar ao painel</Link>
        </div>
      </div>
    )
  }

  if (record.mentor?.email !== session.user.email) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⛔</p>
          <h2 className="font-display font-bold text-lg mb-1">Acesso negado</h2>
          <p className="text-slate-500 text-sm mb-4">Você só pode editar os seus próprios registros de mentoria.</p>
          <Link href="/painel" className="btn-secondary">Voltar ao painel</Link>
        </div>
      </div>
    )
  }

  const activeTeams = await db.query.teams.findMany({
    where: eq(teams.active, true),
    orderBy: (t, { asc }) => [asc(t.number)],
  })

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-navy">Editar mentoria</h2>
          <p className="text-slate-500 text-sm mt-1">Atualize as informações do seu registro.</p>
        </div>
        <Link href="/painel" className="text-slate-400 hover:text-navy text-sm font-bold transition-colors">✕ Cancelar</Link>
      </div>
      <MentoriaForm
        teams={activeTeams}
        activeBlock={record.block ? { id: record.block.id, label: record.block.label, date: record.block.date } : null}
        recordToEdit={record}
      />
    </div>
  )
}
