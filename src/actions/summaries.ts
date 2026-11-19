'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { teams } from '@/schema'
import { requireActiveSession } from '@/lib/guards'
import { getEventContext } from '@/lib/event-context'
import { generateTeamSummary, type SummaryKind } from '@/lib/ai/team-summary'
import { toActionError, type ActionResult } from '@/lib/action-result'

/** Botão "Gerar/Atualizar resumo": participante do evento da equipe (ou admin). */
export async function refreshTeamSummary(teamId: string, kind: SummaryKind): Promise<ActionResult> {
  try {
    if (kind !== 'mentoring' && kind !== 'specialist') return { ok: false, error: 'Tipo inválido.' }
    await requireActiveSession()
    const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) })
    if (!team) return { ok: false, error: 'Equipe não encontrada.' }
    const ctx = await getEventContext()
    if (!ctx.isAdmin && !ctx.options.some(o => o.id === team.eventId)) return { ok: false, error: 'Acesso negado' }

    const error = await generateTeamSummary(teamId, kind)
    if (error) return { ok: false, error }
    revalidatePath('/painel')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}
