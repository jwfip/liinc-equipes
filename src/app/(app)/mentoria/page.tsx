import { db } from '@/db'
import { blocks, teams } from '@/schema'
import { eq } from 'drizzle-orm'
import { auth, signOut } from '@/auth'
import MentoriaForm from '@/components/mentoria/MentoriaForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MentoriaPage() {
  const session = await auth()

  const activeBlock = await db.query.blocks.findFirst({
    where: eq(blocks.active, true),
  })

  const activeTeams = await db.query.teams.findMany({
    where: eq(teams.active, true),
    orderBy: (t, { asc }) => [asc(t.number)],
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="font-display font-bold text-2xl">Nova mentoria</h2>
        <p className="text-slate-400 text-sm mt-1">Preencha após cada sessão com a equipe.</p>
      </div>
      <MentoriaForm
        teams={activeTeams}
        activeBlock={activeBlock ? { id: activeBlock.id, label: activeBlock.label, date: activeBlock.date } : null}
      />
    </div>
  )
}
