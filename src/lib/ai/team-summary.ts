import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { waitUntil } from '@vercel/functions'
import { db } from '@/db'
import { mentoringRecords, teamSummaries, teams } from '@/schema'
import { getEventSteps } from '@/lib/event-data'
import { chat, groqConfigured, GroqError, SUMMARY_MODEL } from '@/lib/groq'
import { buildMentoringSummaryMessages, buildSpecialistSummaryMessages, cleanSummary } from './summary-prompt'
import { buildFinalSummaryMessages, cleanFinalSummary } from './final-summary'

export type SummaryKind = 'mentoring' | 'specialist'

/**
 * Gera (ou apaga, se não houver registros) o resumo atual da equipe. Sem checagem de acesso:
 * quem chama já autorizou. Devolve null em sucesso ou a mensagem de erro em português.
 */
export async function generateTeamSummary(teamId: string, kind: SummaryKind): Promise<string | null> {
  if (!groqConfigured()) return 'IA não configurada.'
  const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) })
  if (!team) return 'Equipe não encontrada.'

  const records = await db.query.mentoringRecords.findMany({
    where: and(eq(mentoringRecords.teamId, teamId), eq(mentoringRecords.eventId, team.eventId), eq(mentoringRecords.kind, kind)),
    columns: { audioTranscript: false },
    with: { block: true },
    orderBy: [desc(mentoringRecords.createdAt)],
  })
  const where = and(eq(teamSummaries.teamId, teamId), eq(teamSummaries.kind, kind))
  if (records.length === 0) {
    await db.delete(teamSummaries).where(where)
    return null
  }

  let content: string | null
  try {
    const messages = kind === 'mentoring'
      ? buildMentoringSummaryMessages(team.name, await getEventSteps(team.eventId), records)
      : buildSpecialistSummaryMessages(team.name, records)
    content = cleanSummary(await chat({ messages, maxTokens: 500 }))
  } catch (err) {
    return err instanceof GroqError ? err.message : 'A IA não respondeu agora. Tente de novo.'
  }
  if (!content) return 'A IA não devolveu um resumo. Tente de novo.'

  const values = { eventId: team.eventId, teamId, kind, content, basedOnRecordId: records[0].id, model: SUMMARY_MODEL(), createdAt: new Date() }
  await db.insert(teamSummaries).values(values)
    .onConflictDoUpdate({ target: [teamSummaries.teamId, teamSummaries.kind], set: { ...values, editedByAdmin: false } })
  return null
}

/**
 * Gera o resumo depois que a resposta já foi enviada (waitUntil mantém a função viva na Vercel),
 * então o mentor não espera pela IA e falhas não afetam o registro.
 */
export function generateTeamSummaryInBackground(teamId: string, kind: SummaryKind) {
  waitUntil(generateTeamSummary(teamId, kind).catch(() => null))
}

// ── Resumo final (relatório para a empresa) ──────────────────

/** Gera o resumo final da equipe (kind 'final'). Devolve null em sucesso ou a mensagem de erro. */
export async function generateFinalSummary(teamId: string, opts: { overwriteEdited: boolean } = { overwriteEdited: false }): Promise<string | null> {
  if (!groqConfigured()) return 'IA não configurada.'
  const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) })
  if (!team) return 'Equipe não encontrada.'

  const records = await db.query.mentoringRecords.findMany({
    where: and(eq(mentoringRecords.teamId, teamId), eq(mentoringRecords.eventId, team.eventId)),
    columns: { audioTranscript: false },
    with: { block: true },
    orderBy: [desc(mentoringRecords.createdAt)],
  })
  if (records.length === 0) return 'Sem registros suficientes para um resumo.'

  let content: string | null
  try {
    const messages = buildFinalSummaryMessages(
      team.name, await getEventSteps(team.eventId),
      records.filter(r => r.kind === 'mentoring'), records.filter(r => r.kind === 'specialist'),
    )
    content = cleanFinalSummary(await chat({ messages, maxTokens: 700 }))
  } catch (err) {
    return err instanceof GroqError ? err.message : 'A IA não respondeu agora. Tente de novo.'
  }
  if (!content) return 'A IA não devolveu um resumo. Tente de novo.'

  const values = { eventId: team.eventId, teamId, kind: 'final', content, basedOnRecordId: records[0].id, model: SUMMARY_MODEL(), editedByAdmin: false, createdAt: new Date() }
  // A checagem de "editado" é feita na própria gravação: se o admin editar enquanto a IA gera,
  // a edição vence (a menos que ele tenha pedido para substituir).
  const saved = await db.insert(teamSummaries).values(values)
    .onConflictDoUpdate({
      target: [teamSummaries.teamId, teamSummaries.kind], set: values,
      ...(opts.overwriteEdited ? {} : { setWhere: eq(teamSummaries.editedByAdmin, false) }),
    })
    .returning({ id: teamSummaries.id })
  return saved.length === 0 ? 'Texto editado preservado.' : null
}
