import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { blocks } from '@/schema'
import PainelClient from '@/components/painel/PainelClient'
import type { RecordWithRelations } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const session = await auth()

  const records = await db.query.mentoringRecords.findMany({
    with: { team: true, mentor: true, block: true },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  })

  const teams = await db.query.teams.findMany({
    where: (t, { eq }) => eq(t.active, true),
    orderBy: (t, { asc }) => [asc(t.number)],
  })

  return (
    <PainelClient
      initialRecords={records as unknown as RecordWithRelations[]}
      teams={teams}
      activeBlock={activeBlock ? { label: activeBlock.label } : null}
    />
  )
}
