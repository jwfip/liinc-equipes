'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { mentoringRecords, eventSteps, teams } from '@/schema'
import { getEventContext } from '@/lib/event-context'
import { getActiveBlock } from '@/lib/event-data'
import { assertTeamInEvent, assertSameKind } from '@/lib/records'
import { registrationError, type RecordKind } from '@/lib/participation'
import { requireActiveSession } from '@/lib/guards'
import { toActionError, type ActionResult } from '@/lib/action-result'

const STATUSES = ['ok', 'attention', 'emergency', 'flying']
const opt = (fd: FormData, k: string) => (String(fd.get(k) ?? '').trim() || null)

async function requireParticipant(kind: RecordKind) {
  await requireActiveSession()
  const ctx = await getEventContext()
  const error = registrationError(ctx, kind)
  if (error) throw new Error(error)
  return { eventId: ctx.event!.id, mentorId: ctx.mentorId! }
}

async function readTeam(fd: FormData, eventId: number): Promise<string> {
  const teamId = String(fd.get('teamId') ?? '')
  const team = teamId ? await db.query.teams.findFirst({ where: eq(teams.id, teamId) }) : undefined
  assertTeamInEvent(team, eventId)
  return teamId
}

/** Autor do registro, com sessão ativa e mentor ativo; garante que o tipo bate. */
async function requireAuthorOf(recordId: string, kind: RecordKind) {
  await requireActiveSession()
  const { mentorId, mentorActive } = await getEventContext()
  if (!mentorId) throw new Error('Não autenticado')
  if (!mentorActive) throw new Error('Seu acesso de mentor está desativado.')
  const record = await db.query.mentoringRecords.findFirst({ where: eq(mentoringRecords.id, recordId) })
  if (!record) throw new Error('Registro não encontrado.')
  assertSameKind(record, kind)
  if (record.mentorId !== mentorId) throw new Error('Você não tem permissão para editar este registro.')
  return record
}

function readAtendimento(fd: FormData) {
  const topic  = opt(fd, 'topic')
  const advice = opt(fd, 'advice')
  if (!topic || !advice) throw new Error('Campos obrigatórios não preenchidos.')
  return { topic, advice, obs: opt(fd, 'obs') }
}

async function readFields(fd: FormData, eventId: number) {
  const status  = String(fd.get('status') ?? '')
  const working = opt(fd, 'working')
  const advice  = opt(fd, 'advice')
  const stepId  = Number(fd.get('stepId'))
  if (!STATUSES.includes(status) || !working || !advice) throw new Error('Campos obrigatórios não preenchidos.')

  const step = Number.isInteger(stepId) && stepId > 0
    ? await db.query.eventSteps.findFirst({ where: and(eq(eventSteps.id, stepId), eq(eventSteps.eventId, eventId)) })
    : undefined
  if (!step) throw new Error('Selecione a etapa da equipe.')

  return {
    status, working, advice, stepId: step.id,
    pros: opt(fd, 'pros'), cons: opt(fd, 'cons'), obs: opt(fd, 'obs'), suggestion: opt(fd, 'suggestion'),
  }
}

// As actions retornam ActionResult: em produção o Next.js troca mensagens de erro lançadas
// por uma genérica, então o motivo da recusa precisa voltar como valor.

export async function submitMentoria(formData: FormData): Promise<ActionResult> {
  try {
    const { eventId, mentorId } = await requireParticipant('mentoring')

    const block = await getActiveBlock(eventId)
    if (!block) throw new Error('Nenhum bloco ativo no momento.')

    const teamId = await readTeam(formData, eventId)

    const fields = await readFields(formData, eventId)
    await db.insert(mentoringRecords).values({
      ...fields, eventId, teamId, mentorId, blockId: block.id, kind: 'mentoring',
    })

    revalidatePath('/painel')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

export async function updateMentoria(recordId: string, formData: FormData): Promise<ActionResult> {
  try {
    const record = await requireAuthorOf(recordId, 'mentoring')

    // Edição vale no evento do próprio registro, mesmo que o usuário esteja vendo outro evento.
    const fields = await readFields(formData, record.eventId)
    await db.update(mentoringRecords).set(fields).where(eq(mentoringRecords.id, recordId))

    revalidatePath('/painel')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

// ── Atendimentos de especialistas ────────────────────────────

export async function submitAtendimento(formData: FormData): Promise<ActionResult> {
  try {
    const { eventId, mentorId } = await requireParticipant('specialist')
    const teamId = await readTeam(formData, eventId)
    const fields = readAtendimento(formData)
    const block = await getActiveBlock(eventId) // opcional: atendimento pode ser fora de bloco
    await db.insert(mentoringRecords).values({
      ...fields, eventId, teamId, mentorId, blockId: block?.id ?? null,
      kind: 'specialist', status: null, stepId: null,
    })
    revalidatePath('/painel')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

export async function updateAtendimento(recordId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAuthorOf(recordId, 'specialist')
    await db.update(mentoringRecords).set(readAtendimento(formData)).where(eq(mentoringRecords.id, recordId))
    revalidatePath('/painel')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}
