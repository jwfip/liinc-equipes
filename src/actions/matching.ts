'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { mentors, teamMatchings, teams } from '@/schema'
import { toActionError } from '@/lib/action-result'
import { getEventContext } from '@/lib/event-context'
import { requireActiveSession } from '@/lib/guards'
import { canSeePrivateNotes } from '@/lib/participation'
import { assertTeamInEvent, blockRankOf, currentStepFor, getLatestByTeam } from '@/lib/records'
import {
  getActiveTeams, getEventBlocks, getEventPeople, getEventProjects, getEventRecords, getEventStepChanges, getEventSteps,
  type MatchingRow,
} from '@/lib/event-data'
import { eventAlerts } from '@/lib/alerts'
import { projectContext } from '@/lib/project'
import { todayISO } from '@/lib/format'
import { buildMatchingMessages, parseMatching } from '@/lib/ai/matching'
import { chat, groqConfigured, SUMMARY_MODEL } from '@/lib/groq'

type Result = { ok: true; matching: MatchingRow } | { ok: false; error: string }

/** Sugestão de mentores e especialistas para uma equipe (IA, sob demanda). Facilitador do evento ou admin. */
export async function suggestMatching(teamId: string): Promise<Result> {
  try {
    await requireActiveSession()
    const ctx = await getEventContext()
    if (!ctx.event || !canSeePrivateNotes(ctx)) return { ok: false, error: 'Sem permissão.' }
    const eventId = ctx.event.id

    const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) })
    assertTeamInEvent(team, eventId)
    if (!groqConfigured()) return { ok: false, error: 'IA não configurada.' }

    const [people, records, projects, eventTeams, steps, stepChanges, blocks] = await Promise.all([
      getEventPeople(eventId), getEventRecords(eventId), getEventProjects(eventId), getActiveTeams(eventId),
      getEventSteps(eventId), getEventStepChanges(eventId), getEventBlocks(eventId),
    ])
    const active = people.filter(p => p.active)
    if (active.length === 0) return { ok: false, error: 'Nenhum mentor ou especialista escalado no evento.' }

    const mine = records.filter(r => r.teamId === teamId)
    const project = projectContext(projects, teamId)
    if (mine.length === 0 && !project.current) return { ok: false, error: 'Ainda não há informações da equipe para sugerir.' }

    const latest = getLatestByTeam(records.filter(r => r.kind === 'mentoring'), blockRankOf(blocks))[teamId]
    const step = currentStepFor(latest, stepChanges.filter(c => c.teamId === teamId)).step
    const stepIdx = step ? steps.findIndex(s => s.id === step.id) : -1
    const alerts = eventAlerts({ teams: eventTeams, records, stepChanges, projects, blocks, today: todayISO(), steps })[teamId] ?? []

    const { messages, aliases } = buildMatchingMessages({
      name: team!.name, project, status: latest?.status ?? null,
      step: stepIdx >= 0 ? `Etapa ${stepIdx + 1} — ${steps[stepIdx].label}` : null,
      alerts: alerts.map(a => a.text),
      mentoring: mine.filter(r => r.kind === 'mentoring').map(r => ({
        createdAt: r.createdAt, block: r.block?.label ?? null, status: r.status,
        working: r.working, advice: r.advice, cons: r.cons, obs: r.obs, suggestion: r.suggestion,
      })),
      specialist: mine.filter(r => r.kind === 'specialist').map(r => ({
        createdAt: r.createdAt, block: r.block?.label ?? null, topic: r.topic, advice: r.advice, obs: r.obs,
      })),
    }, active)

    let raw: string
    try {
      // O modelo raciocina antes de responder e isso conta no limite: folga para o JSON não sair cortado.
      raw = await chat({ messages, json: true, maxTokens: 2000 })
    } catch {
      return { ok: false, error: 'A IA não respondeu agora. Tente de novo.' }
    }
    const content = parseMatching(raw, aliases)
    if (!content) return { ok: false, error: 'A IA não devolveu sugestões. Tente de novo.' }

    const values = { eventId, teamId, content, requestedBy: ctx.mentorId, model: SUMMARY_MODEL(), createdAt: new Date() }
    await db.insert(teamMatchings).values(values).onConflictDoUpdate({ target: teamMatchings.teamId, set: values })

    // Quem pediu costuma ser o facilitador, que não está na lista de pessoas sugeríveis.
    const requester = ctx.mentorId
      ? (await db.query.mentors.findFirst({ where: eq(mentors.id, ctx.mentorId), columns: { name: true } }))?.name ?? null
      : null
    return { ok: true, matching: { teamId, content, createdAt: values.createdAt, requestedBy: requester } }
  } catch (err) {
    return toActionError(err)
  }
}
