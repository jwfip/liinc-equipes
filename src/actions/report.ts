'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { teams, teamSummaries } from '@/schema'
import { requireAdmin } from '@/lib/guards'
import { generateFinalSummary } from '@/lib/ai/team-summary'
import { toActionError, type ActionResult } from '@/lib/action-result'

const MAX_EDIT = 2000
const finalOf = (teamId: string) => and(eq(teamSummaries.teamId, teamId), eq(teamSummaries.kind, 'final'))

/** Gera o resumo final de uma equipe. Recusa substituir texto editado sem `overwriteEdited`. */
export async function generateFinal(teamId: string, opts: { overwriteEdited: boolean }): Promise<ActionResult> {
  try {
    await requireAdmin()
    const current = await db.query.teamSummaries.findFirst({ where: finalOf(teamId) })
    if (current?.editedByAdmin && !opts.overwriteEdited) return { ok: false, error: 'Texto editado preservado.' }
    const error = await generateFinalSummary(teamId, opts)
    if (error) return { ok: false, error }
    revalidatePath('/admin/eventos', 'layout')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

/** Salva o texto do resumo final escrito/ajustado pelo admin. */
export async function saveFinalSummary(teamId: string, content: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const text = content.replace(/\r\n/g, '\n').trim().slice(0, MAX_EDIT)
    if (!text) return { ok: false, error: 'O resumo não pode ficar vazio.' }
    const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) })
    if (!team) return { ok: false, error: 'Equipe não encontrada.' }
    const values = { eventId: team.eventId, teamId, kind: 'final', content: text, editedByAdmin: true, createdAt: new Date() }
    await db.insert(teamSummaries).values(values)
      .onConflictDoUpdate({ target: [teamSummaries.teamId, teamSummaries.kind], set: values })
    revalidatePath('/admin/eventos', 'layout')
    return { ok: true, message: 'Resumo salvo.' }
  } catch (err) {
    return toActionError(err)
  }
}
