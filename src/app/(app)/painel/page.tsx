import { auth } from '@/auth'
import PainelClient from '@/components/painel/PainelClient'
import NoEventNotice from '@/components/layout/NoEventNotice'
import { getEventContext } from '@/lib/event-context'
import { getActiveBlock, getActiveTeams, getEventRecords, getEventSteps } from '@/lib/event-data'
import type { RecordWithRelations } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const [session, ctx] = await Promise.all([auth(), getEventContext()])
  if (!ctx.event) return <NoEventNotice />
  const eventId = ctx.event.id

  const [records, teams, steps, activeBlock] = await Promise.all([
    getEventRecords(eventId), getActiveTeams(eventId), getEventSteps(eventId), getActiveBlock(eventId),
  ])

  return (
    <PainelClient
      initialRecords={records as unknown as RecordWithRelations[]}
      teams={teams}
      steps={steps}
      activeBlock={activeBlock ? { label: activeBlock.label } : null}
      currentUser={session?.user?.email || ''}
    />
  )
}
