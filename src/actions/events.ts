'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getEventContext } from '@/lib/event-context'
import { EVENT_COOKIE } from '@/lib/event-pick'
import { and, eq, max, sql, count } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventSteps, eventMembers, mentoringRecords, teamStepChanges } from '@/schema'
import { requireAdmin, requireActiveSession } from '@/lib/guards'
import { toActionError, type ActionResult } from '@/lib/action-result'
import { swapPositions } from '@/lib/steps'
import type { EventRole } from '@/lib/event-pick'

export async function setCurrentEvent(eventId: number): Promise<void> {
  await requireActiveSession()
  const ctx = await getEventContext()
  if (!ctx.options.some(o => o.id === eventId)) throw new Error('Evento indisponível.')
  cookies().set(EVENT_COOKIE, String(eventId), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 90,
  })
  revalidatePath('/', 'layout')
}

// ── Admin: eventos, etapas e participantes ───────────────────

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const ROLES: EventRole[] = ['mentor', 'specialist', 'facilitator']

function revalidateEvents() {
  revalidatePath('/admin/eventos', 'layout')
  revalidatePath('/', 'layout')
}

async function guarded(fn: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    await requireAdmin()
    const r = await fn()
    revalidateEvents()
    return r ?? { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

export async function createEvent(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, 'name')
    const startDate = str(fd, 'startDate')
    if (!name || !startDate) return { ok: false, error: 'Preencha nome e data de início.' }
    const [ev] = await db.insert(events).values({
      name, startDate, company: str(fd, 'company') || null, endDate: str(fd, 'endDate') || null,
    }).returning({ id: events.id })
    const copyFrom = Number(str(fd, 'copySteps'))
    if (copyFrom) {
      await db.execute(sql`
        INSERT INTO event_steps (event_id, position, label)
        SELECT ${ev.id}, position, label FROM event_steps WHERE event_id = ${copyFrom}`)
    }
    return { ok: true, message: `Evento "${name}" criado.` }
  })
}

export async function updateEvent(id: number, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, 'name')
    const startDate = str(fd, 'startDate')
    if (!name || !startDate) return { ok: false, error: 'Preencha nome e data de início.' }
    await db.update(events).set({
      name, startDate, company: str(fd, 'company') || null, endDate: str(fd, 'endDate') || null,
    }).where(eq(events.id, id))
    return { ok: true, message: 'Evento atualizado.' }
  })
}

export async function setEventActive(id: number, active: boolean): Promise<ActionResult> {
  return guarded(async () => { await db.update(events).set({ active }).where(eq(events.id, id)) })
}

export async function addStep(eventId: number, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const label = str(fd, 'label')
    if (!label) return { ok: false, error: 'Informe o nome da etapa.' }
    const [{ last }] = await db.select({ last: max(eventSteps.position) })
      .from(eventSteps).where(eq(eventSteps.eventId, eventId))
    await db.insert(eventSteps).values({ eventId, label, position: (last ?? 0) + 1 })
    return { ok: true, message: 'Etapa adicionada.' }
  })
}

export async function renameStep(stepId: number, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const label = str(fd, 'label')
    if (!label) return { ok: false, error: 'Informe o nome da etapa.' }
    await db.update(eventSteps).set({ label }).where(eq(eventSteps.id, stepId))
    return { ok: true, message: 'Etapa renomeada.' }
  })
}

export async function moveStep(eventId: number, stepId: number, dir: 'up' | 'down'): Promise<ActionResult> {
  return guarded(async () => {
    const steps = await db.select({ id: eventSteps.id, position: eventSteps.position })
      .from(eventSteps).where(eq(eventSteps.eventId, eventId))
    const changes = swapPositions(steps, stepId, dir)
    if (changes.length === 0) return
    const values = sql.join(changes.map(c => sql`(${c.id}::int, ${c.position}::int)`), sql`, `)
    await db.execute(sql`
      UPDATE event_steps SET position = v.pos
      FROM (VALUES ${values}) AS v(id, pos)
      WHERE event_steps.id = v.id`)
  })
}

export async function deleteStep(stepId: number): Promise<ActionResult> {
  return guarded(async () => {
    const [[{ n: recs }], [{ n: adj }]] = await Promise.all([
      db.select({ n: count() }).from(mentoringRecords).where(eq(mentoringRecords.stepId, stepId)),
      db.select({ n: count() }).from(teamStepChanges).where(eq(teamStepChanges.stepId, stepId)),
    ])
    if (recs > 0) return { ok: false, error: `Etapa em uso por ${recs} registro${recs > 1 ? 's' : ''}.` }
    if (adj > 0) return { ok: false, error: `Etapa em uso por ${adj} ajuste${adj > 1 ? 's' : ''} de etapa da organização.` }
    await db.delete(eventSteps).where(eq(eventSteps.id, stepId))
  })
}

export async function addMember(eventId: number, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const mentorId = str(fd, 'mentorId')
    const role = str(fd, 'role') as EventRole
    if (!mentorId) return { ok: false, error: 'Selecione um mentor.' }
    if (!ROLES.includes(role)) return { ok: false, error: 'Papel inválido.' }
    const inserted = await db.insert(eventMembers).values({ eventId, mentorId, role })
      .onConflictDoNothing().returning({ id: eventMembers.mentorId })
    if (inserted.length === 0) return { ok: false, error: 'Essa pessoa já participa do evento.' }
    return { ok: true, message: 'Participante adicionado.' }
  })
}

export async function setMemberRole(eventId: number, mentorId: string, role: EventRole): Promise<ActionResult> {
  return guarded(async () => {
    if (!ROLES.includes(role)) return { ok: false, error: 'Papel inválido.' }
    await db.update(eventMembers).set({ role })
      .where(and(eq(eventMembers.eventId, eventId), eq(eventMembers.mentorId, mentorId)))
  })
}

export async function removeMember(eventId: number, mentorId: string): Promise<ActionResult> {
  return guarded(async () => {
    await db.delete(eventMembers)
      .where(and(eq(eventMembers.eventId, eventId), eq(eventMembers.mentorId, mentorId)))
  })
}

export async function copyMembers(targetEventId: number, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const source = Number(str(fd, 'sourceEventId'))
    if (!source) return { ok: false, error: 'Selecione o evento de origem.' }
    await db.execute(sql`
      INSERT INTO event_members (event_id, mentor_id, role)
      SELECT ${targetEventId}, m.mentor_id, m.role FROM event_members m
      JOIN mentors ON mentors.id = m.mentor_id AND mentors.active
      WHERE m.event_id = ${source}
      ON CONFLICT DO NOTHING`)
    return { ok: true, message: 'Participantes copiados.' }
  })
}
