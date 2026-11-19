import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { blocks, eventSteps, teams, teamStepChanges } from '@/schema'

export async function getEventSteps(eventId: number) {
  return db.select({ id: eventSteps.id, position: eventSteps.position, label: eventSteps.label })
    .from(eventSteps).where(eq(eventSteps.eventId, eventId)).orderBy(asc(eventSteps.position))
}

export async function getActiveTeams(eventId: number) {
  return db.query.teams.findMany({
    where: and(eq(teams.eventId, eventId), eq(teams.active, true)),
    orderBy: (t, { asc }) => [asc(t.number)],
  })
}

export async function getActiveBlock(eventId: number) {
  return db.query.blocks.findFirst({ where: and(eq(blocks.eventId, eventId), eq(blocks.active, true)) })
}

export async function getEventRecords(eventId: number) {
  return db.query.mentoringRecords.findMany({
    where: (r, { eq }) => eq(r.eventId, eventId),
    with: { team: true, mentor: { columns: { id: true, name: true, email: true } }, block: true, step: true },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  })
}

export async function getEventStepChanges(eventId: number) {
  return db.query.teamStepChanges.findMany({
    where: eq(teamStepChanges.eventId, eventId),
    columns: { id: true, teamId: true, stepId: true, createdAt: true },
    with: { step: true },
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  })
}
