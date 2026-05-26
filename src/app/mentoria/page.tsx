import { db } from '@/db'
import { blocks, teams } from '@/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { signOut } from '@/auth'
import MentoriaForm from '@/components/mentoria/MentoriaForm'

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
    <div className="min-h-screen bg-navy">
      <header className="bg-navy-light border-b border-navy-muted sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧭</span>
            <h1 className="font-display font-bold text-base">Registrar Mentoria</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">{session?.user?.email}</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
              <button type="submit" className="btn-secondary text-xs py-1.5">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl">Nova mentoria</h2>
          <p className="text-slate-400 text-sm mt-1">Preencha após cada sessão com a equipe.</p>
        </div>
        <MentoriaForm
          teams={activeTeams}
          activeBlock={activeBlock ? { id: activeBlock.id, label: activeBlock.label, date: activeBlock.date } : null}
        />
      </main>
    </div>
  )
}
