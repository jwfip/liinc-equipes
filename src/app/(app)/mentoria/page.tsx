import MentoriaForm from '@/components/mentoria/MentoriaForm'
import AtendimentoForm from '@/components/mentoria/AtendimentoForm'
import NoEventNotice from '@/components/layout/NoEventNotice'
import { getEventContext } from '@/lib/event-context'
import { getActiveBlock, getActiveTeams, getEventSteps } from '@/lib/event-data'
import { registrationError } from '@/lib/participation'

export const dynamic = 'force-dynamic'

export default async function MentoriaPage() {
  const ctx = await getEventContext()
  if (!ctx.event || (!ctx.role && !ctx.isAdmin)) return <NoEventNotice />

  if (!ctx.role) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <h2 className="font-display font-bold text-lg mb-1">Você não participa de {ctx.event.name}.</h2>
          <p className="text-slate-500 text-sm">Para registrar, adicione-se como participante em Eventos → Participantes.</p>
        </div>
      </div>
    )
  }

  const isSpecialist = ctx.role === 'specialist'
  const blocked = registrationError(ctx, isSpecialist ? 'specialist' : 'mentoring')
  if (blocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <h2 className="font-display font-bold text-lg mb-1">{blocked}</h2>
          <p className="text-slate-500 text-sm">Em caso de dúvida, fale com a organização.</p>
        </div>
      </div>
    )
  }

  const [activeBlock, activeTeams, steps] = await Promise.all([
    getActiveBlock(ctx.event.id), getActiveTeams(ctx.event.id), getEventSteps(ctx.event.id),
  ])

  const block = activeBlock ? { id: activeBlock.id, label: activeBlock.label, date: activeBlock.date } : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h2 className="font-display font-bold text-2xl">{isSpecialist ? 'Novo atendimento' : 'Nova mentoria'}</h2>
        <p className="text-slate-500 text-sm mt-1">
          {ctx.event.name} · {isSpecialist ? 'registre as dúvidas tiradas com a equipe.' : 'preencha após cada sessão com a equipe.'}
        </p>
      </div>
      {isSpecialist
        ? <AtendimentoForm teams={activeTeams} activeBlock={block} />
        : <MentoriaForm teams={activeTeams} steps={steps} activeBlock={block} />}
    </div>
  )
}
