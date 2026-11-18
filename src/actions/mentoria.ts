'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { mentoringRecords, eventSteps, teams } from '@/schema'
import { getEventContext } from '@/lib/event-context'
import { getActiveBlock } from '@/lib/event-data'
import { assertTeamInEvent } from '@/lib/records'

const STATUSES = ['ok', 'attention', 'emergency', 'flying']
const opt = (fd: FormData, k: string) => (String(fd.get(k) ?? '').trim() || null)

async function requireParticipant() {
  const ctx = await getEventContext()
  if (!ctx.event) throw new Error('Nenhum evento selecionado.')
  if (!ctx.mentorId || !ctx.role) throw new Error('Você não participa deste evento.')
  return { eventId: ctx.event.id, mentorId: ctx.mentorId }
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

export async function submitMentoria(formData: FormData) {
  const { eventId, mentorId } = await requireParticipant()

  const block = await getActiveBlock(eventId)
  if (!block) throw new Error('Nenhum bloco ativo no momento.')

  const teamId = String(formData.get('teamId') ?? '')
  const team = teamId ? await db.query.teams.findFirst({ where: eq(teams.id, teamId) }) : undefined
  assertTeamInEvent(team, eventId)

  const fields = await readFields(formData, eventId)
  await db.insert(mentoringRecords).values({
    ...fields, eventId, teamId, mentorId, blockId: block.id, kind: 'mentoring',
  })

  revalidatePath('/painel')
}

export async function updateMentoria(recordId: string, formData: FormData) {
  const { mentorId } = await getEventContext()
  if (!mentorId) throw new Error('Não autenticado')

  const record = await db.query.mentoringRecords.findFirst({ where: eq(mentoringRecords.id, recordId) })
  if (!record) throw new Error('Registro não encontrado.')
  if (record.mentorId !== mentorId) throw new Error('Você não tem permissão para editar este registro.')

  // Edição vale no evento do próprio registro, mesmo que o usuário esteja vendo outro evento.
  const fields = await readFields(formData, record.eventId)
  await db.update(mentoringRecords).set(fields).where(eq(mentoringRecords.id, recordId))

  revalidatePath('/painel')
}
