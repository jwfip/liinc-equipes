import { auth } from '@/auth'
import PainelClient from '@/components/painel/PainelClient'
import NoEventNotice from '@/components/layout/NoEventNotice'
import { getEventContext } from '@/lib/event-context'
import { getActiveBlock, getActiveTeams, getEventRecords, getEventStepChanges, getEventSteps, getEventSummaries } from '@/lib/event-data'
import type { RecordWithRelations } from '@/lib/constants'
import { canSeePrivateNotes } from '@/lib/participation'
import { redactPrivateNotes } from '@/lib/privacy'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const [session, ctx] = await Promise.all([auth(), getEventContext()])
  if (!ctx.event) return <NoEventNotice />
  const eventId = ctx.event.id

  const [records, teams, steps, activeBlock, stepChanges, summaries] = await Promise.all([
    getEventRecords(eventId), getActiveTeams(eventId), getEventSteps(eventId), getActiveBlock(eventId), getEventStepChanges(eventId),
    getEventSummaries(eventId),
  ])

  return (
    <PainelClient
      initialRecords={redactPrivateNotes(records, { canSeeAll: canSeePrivateNotes(ctx), mentorId: ctx.mentorId }) as unknown as RecordWithRelations[]}
      initialStepChanges={stepChanges}
      initialSummaries={summaries}
      viewerRole={ctx.role}
      isAdmin={ctx.isAdmin}
      teams={teams}
      steps={steps}
      activeBlock={activeBlock ? { label: activeBlock.label } : null}
      currentUser={session?.user?.email || ''}
    />
  )
}
