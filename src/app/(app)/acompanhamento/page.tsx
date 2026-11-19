import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import NoEventNotice from '@/components/layout/NoEventNotice'
import AcompanhamentoClient from '@/components/acompanhamento/AcompanhamentoClient'
import { getEventContext } from '@/lib/event-context'
import { canCorrectProject, canSeePrivateNotes } from '@/lib/participation'
import {
  getActiveTeams, getEventBlocks, getEventProjects, getEventRecords, getEventStepChanges, getEventSteps, getEventSummaries,
} from '@/lib/event-data'
import type { RecordWithRelations } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function AcompanhamentoPage() {
  const [session, ctx] = await Promise.all([auth(), getEventContext()])
  if (!ctx.event) return <NoEventNotice />
  if (!canSeePrivateNotes(ctx)) redirect('/painel')
  const eventId = ctx.event.id

  // Leitor é facilitador ou admin: vê as observações de todos (sem redação).
  const [records, teams, steps, stepChanges, summaries, projects, blocks] = await Promise.all([
    getEventRecords(eventId), getActiveTeams(eventId), getEventSteps(eventId), getEventStepChanges(eventId),
    getEventSummaries(eventId), getEventProjects(eventId), getEventBlocks(eventId),
  ])

  return (
    <AcompanhamentoClient
      eventName={ctx.event.name}
      initialRecords={records as unknown as RecordWithRelations[]}
      initialStepChanges={stepChanges}
      initialSummaries={summaries}
      initialProjects={projects}
      teams={teams.map(t => ({ id: t.id, number: t.number, name: t.name }))}
      steps={steps}
      blocks={blocks}
      canCorrectProject={canCorrectProject(ctx)}
      currentUser={session?.user?.email || ''}
    />
  )
}
