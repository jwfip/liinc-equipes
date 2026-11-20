import { Ban, X } from 'lucide-react'
import { db } from '@/db'
import { mentoringRecords } from '@/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { getActiveTeams, getEventSteps, getEventProjects } from '@/lib/event-data'
import { projectInfoByTeam } from '@/lib/project'
import MentoriaForm from '@/components/mentoria/MentoriaForm'
import AtendimentoForm from '@/components/mentoria/AtendimentoForm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditMentoriaPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const recordId = params.id

  const record = await db.query.mentoringRecords.findFirst({
    where: eq(mentoringRecords.id, recordId),
    // Só o necessário do mentor: o registro vai para o formulário no navegador e o perfil é restrito.
    with: { mentor: { columns: { id: true, name: true, email: true } }, block: true }
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
          <Ban aria-hidden="true" size={40} className="mx-auto mb-3 text-red-500" />
          <h2 className="font-display font-bold text-lg mb-1">Acesso negado</h2>
          <p className="text-slate-500 text-sm mb-4">Você só pode editar os seus próprios registros de mentoria.</p>
          <Link href="/painel" className="btn-secondary">Voltar ao painel</Link>
        </div>
      </div>
    )
  }

  const isAtendimento = record.kind === 'specialist'
  const block = record.block ? { id: record.block.id, label: record.block.label, date: record.block.date } : null
  const [activeTeams, steps, projectRows] = await Promise.all([getActiveTeams(record.eventId), getEventSteps(record.eventId), getEventProjects(record.eventId)])
  const projects = projectInfoByTeam(projectRows)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-navy">{isAtendimento ? 'Editar atendimento' : 'Editar mentoria'}</h2>
          <p className="text-slate-500 text-sm mt-1">Atualize as informações do seu registro.</p>
        </div>
        <Link href="/painel" className="inline-flex items-center gap-1 text-slate-400 hover:text-navy text-sm font-bold transition-colors"><X aria-hidden="true" size={16} />Cancelar</Link>
      </div>
      {isAtendimento
        ? <AtendimentoForm teams={activeTeams} activeBlock={block} projects={projects} recordToEdit={record} />
        : <MentoriaForm teams={activeTeams} steps={steps} activeBlock={block} projects={projects} recordToEdit={record} />}
    </div>
  )
}
