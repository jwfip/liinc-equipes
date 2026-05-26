import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { blocks } from '@/schema'
import PainelClient from '@/components/painel/PainelClient'
import type { RecordWithRelations } from '@/lib/constants'
import { auth, signOut } from '@/auth'
import Link from 'next/link'

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

  const activeBlock = await db.query.blocks.findFirst({
    where: eq(blocks.active, true),
  })

  const headerActions = (
    <div className="flex items-center gap-3 ml-4">
      {session?.user?.role === 'admin' && (
        <Link href="/admin/equipes" className="text-xs text-orange font-semibold hover:underline hidden sm:block">Admin</Link>
      )}
      <Link href="/mentoria" className="btn-primary text-xs py-1.5 hidden sm:inline-flex">Nova Mentoria</Link>
      <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
        <button type="submit" className="btn-secondary text-xs py-1.5">Sair</button>
      </form>
    </div>
  )

  return (
    <PainelClient
      initialRecords={records as unknown as RecordWithRelations[]}
      teams={teams}
      activeBlock={activeBlock ? { label: activeBlock.label } : null}
      headerActions={headerActions}
    />
  )
}
