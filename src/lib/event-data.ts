import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { blocks, eventMembers, eventSteps, mentors, teamMatchings, teams, teamProjects, teamStepChanges, teamSummaries } from '@/schema'
import type { MatchingContent } from './ai/matching'
import type { EventPerson } from './follow-up'
import type { ProjectRow } from './project'

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
    // A transcrição do áudio não vai para o polling: pode ter falas sensíveis e pesa a cada 5 s.
    columns: { audioTranscript: false },
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

export async function getEventSummaries(eventId: number) {
  return db.select({
    id: teamSummaries.id, teamId: teamSummaries.teamId, kind: teamSummaries.kind, content: teamSummaries.content,
    basedOnRecordId: teamSummaries.basedOnRecordId, createdAt: teamSummaries.createdAt,
  }).from(teamSummaries).where(eq(teamSummaries.eventId, eventId))
}

/** Todas as versões de projeto das equipes do evento (o projeto atual é a mais recente de cada equipe). */
export async function getEventProjects(eventId: number): Promise<ProjectRow[]> {
  const rows = await db.query.teamProjects.findMany({
    where: eq(teamProjects.eventId, eventId),
    columns: { id: true, teamId: true, description: true, kind: true, recordId: true, createdAt: true },
    with: { author: { columns: { name: true } } },
    orderBy: (p, { asc }) => [asc(p.createdAt), asc(p.id)],
  })
  return rows.map(r => ({ ...r, kind: r.kind as ProjectRow['kind'], author: r.author ?? null }))
}

/** Blocos do evento em ordem cronológica. */
export async function getEventBlocks(eventId: number) {
  return db.select({ id: blocks.id, label: blocks.label, date: blocks.date, active: blocks.active })
    .from(blocks).where(eq(blocks.eventId, eventId)).orderBy(asc(blocks.date), asc(blocks.id))
}

/**
 * Mentores e especialistas do evento com o perfil (área, experiência). O perfil é restrito:
 * chamar só para facilitador do evento ou admin. Facilitadores ficam fora da lista.
 */
export async function getEventPeople(eventId: number): Promise<EventPerson[]> {
  const rows = await db.select({
    id: mentors.id, name: mentors.name, role: eventMembers.role, area: mentors.area, experience: mentors.experience, active: mentors.active,
  }).from(eventMembers).innerJoin(mentors, eq(mentors.id, eventMembers.mentorId))
    .where(eq(eventMembers.eventId, eventId)).orderBy(asc(mentors.name))
  return rows.filter((r): r is EventPerson => r.role === 'mentor' || r.role === 'specialist')
}

export type MatchingRow = { teamId: string; content: MatchingContent; createdAt: string | Date | null; requestedBy: string | null }

/** Últimas sugestões de mentores do evento. Restrito: chamar só para facilitador do evento ou admin. */
export async function getEventMatchings(eventId: number): Promise<MatchingRow[]> {
  const rows = await db.query.teamMatchings.findMany({
    where: eq(teamMatchings.eventId, eventId),
    columns: { teamId: true, content: true, createdAt: true },
    with: { requester: { columns: { name: true } } },
  })
  return rows.map(r => ({ teamId: r.teamId, content: r.content as MatchingContent, createdAt: r.createdAt, requestedBy: r.requester?.name ?? null }))
}
