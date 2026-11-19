'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { teamProjects, teams } from '@/schema'
import { getEventContext } from '@/lib/event-context'
import { requireActiveSession } from '@/lib/guards'
import { canCorrectProject } from '@/lib/participation'
import { assertTeamInEvent } from '@/lib/records'
import { toActionError, type ActionResult } from '@/lib/action-result'

const MAX_PROJECT = 1000

/** Corrige a redação do projeto atual (não é pivô). Facilitador do evento (ativo) ou admin. */
export async function correctProject(teamId: string, description: string): Promise<ActionResult> {
  try {
    await requireActiveSession()
    const ctx = await getEventContext()
    if (!canCorrectProject(ctx)) throw new Error('Sem permissão para corrigir o projeto.')

    const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) })
    assertTeamInEvent(team, ctx.event!.id)

    const text = description.trim().slice(0, MAX_PROJECT)
    if (!text) throw new Error('Descreva o projeto da equipe.')
    const existing = await db.query.teamProjects.findFirst({ where: eq(teamProjects.teamId, teamId), columns: { id: true } })
    if (!existing) throw new Error('A equipe ainda não tem projeto.')

    await db.insert(teamProjects).values({
      eventId: ctx.event!.id, teamId, description: text, kind: 'correction', recordId: null, createdBy: ctx.mentorId,
    })
    revalidatePath('/painel')
    revalidatePath('/acompanhamento')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}
