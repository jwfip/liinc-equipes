'use server'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { mentoringRecords, teamSummaries, teams } from '@/schema'
import { requireActiveSession } from '@/lib/guards'
import { getEventContext } from '@/lib/event-context'
import { getEventSteps } from '@/lib/event-data'
import { chat, groqConfigured, SUMMARY_MODEL } from '@/lib/groq'
import { buildMentoringSummaryMessages, buildSpecialistSummaryMessages, cleanSummary } from '@/lib/ai/summary-prompt'
import { toActionError, type ActionResult } from '@/lib/action-result'

type Kind = 'mentoring' | 'specialist'

/** Gera (ou apaga, se não houver registros) o resumo da equipe. Falhas não afetam os registros. */
export async function refreshTeamSummary(teamId: string, kind: Kind): Promise<ActionResult> {
  try {
    if (kind !== 'mentoring' && kind !== 'specialist') return { ok: false, error: 'Tipo inválido.' }
    await requireActiveSession()
    const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) })
    if (!team) return { ok: false, error: 'Equipe não encontrada.' }
    const ctx = await getEventContext()
    if (!ctx.isAdmin && !ctx.options.some(o => o.id === team.eventId)) return { ok: false, error: 'Acesso negado' }
    if (!groqConfigured()) return { ok: false, error: 'IA não configurada.' }

    const records = await db.query.mentoringRecords.findMany({
      where: and(eq(mentoringRecords.teamId, teamId), eq(mentoringRecords.eventId, team.eventId), eq(mentoringRecords.kind, kind)),
      with: { block: true },
      orderBy: [desc(mentoringRecords.createdAt)],
    })
    const where = and(eq(teamSummaries.teamId, teamId), eq(teamSummaries.kind, kind))
    if (records.length === 0) {
      await db.delete(teamSummaries).where(where)
      return { ok: true }
    }

    const messages = kind === 'mentoring'
      ? buildMentoringSummaryMessages(team.name, await getEventSteps(team.eventId), records)
      : buildSpecialistSummaryMessages(team.name, records)
    const content = cleanSummary(await chat({ messages, maxTokens: 500 }))
    if (!content) return { ok: false, error: 'A IA não devolveu um resumo. Tente de novo.' }

    const values = { eventId: team.eventId, teamId, kind, content, basedOnRecordId: records[0].id, model: SUMMARY_MODEL(), createdAt: new Date() }
    await db.insert(teamSummaries).values(values)
      .onConflictDoUpdate({ target: [teamSummaries.teamId, teamSummaries.kind], set: { ...values, editedByAdmin: false } })
    revalidatePath('/painel')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}
