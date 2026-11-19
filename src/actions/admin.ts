'use server'

import { db } from '@/db'
import { teams, mentors, blocks, users } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/guards'
import { revalidatePath } from 'next/cache'
import { toActionError, type ActionResult } from '@/lib/action-result'

// ── Teams ────────────────────────────────────────────────────

function revalidateEventPages(eventId: number) {
  revalidatePath(`/admin/eventos/${eventId}`, 'layout')
  revalidatePath('/painel')
  revalidatePath('/mentoria')
}

export async function createTeam(eventId: number, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const number = parseInt(String(fd.get('number') ?? ''), 10)
    const name   = String(fd.get('name') ?? '').trim()
    if (!Number.isInteger(number) || number < 1 || !name) return { ok: false, error: 'Informe número e nome da equipe.' }
    const dup = await db.query.teams.findFirst({ where: and(eq(teams.eventId, eventId), eq(teams.number, number)) })
    if (dup) return { ok: false, error: `Já existe a equipe nº ${number} neste evento.` }
    await db.insert(teams).values({ eventId, number, name })
    revalidateEventPages(eventId)
    return { ok: true, message: `Equipe ${number} — ${name} cadastrada.` }
  } catch (err) {
    return toActionError(err)
  }
}

export async function toggleTeam(id: string, active: boolean): Promise<ActionResult> {
  try {
    await requireAdmin()
    const [t] = await db.update(teams).set({ active }).where(eq(teams.id, id)).returning({ eventId: teams.eventId })
    if (t) revalidateEventPages(t.eventId)
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

// ── Mentors ──────────────────────────────────────────────────

export async function createMentor(fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const name     = String(fd.get('name') ?? '').trim()
    const username = String(fd.get('username') ?? '').toLowerCase().trim()
    if (!name || !username) return { ok: false, error: 'Preencha nome e usuário.' }

    const existing = await db.query.mentors.findFirst({ where: eq(mentors.email, username) })
    if (existing) return { ok: false, error: 'Já existe um mentor com esse usuário.' }

    await db.insert(mentors).values({ name, email: username })
    // Cria usuário para login via NextAuth (pode já existir, ex.: admin)
    await db.insert(users)
      .values({ id: crypto.randomUUID(), name, email: username, role: 'mentor' })
      .onConflictDoNothing({ target: users.email })
    revalidatePath('/admin/mentores')
    return { ok: true, message: `Mentor ${name} cadastrado.` }
  } catch (err) {
    return toActionError(err)
  }
}

export async function toggleMentor(id: string, active: boolean): Promise<ActionResult> {
  try {
    await requireAdmin()
    await db.update(mentors).set({ active }).where(eq(mentors.id, id))
    revalidatePath('/admin/mentores')
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

// ── Blocks ───────────────────────────────────────────────────

export async function createBlock(eventId: number, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const label = String(fd.get('label') ?? '').trim()
    const date  = String(fd.get('date') ?? '').trim()
    if (!label || !date) return { ok: false, error: 'Informe nome e data do bloco.' }
    await db.insert(blocks).values({ eventId, label, date, active: false })
    revalidateEventPages(eventId)
    return { ok: true, message: `${label} criado.` }
  } catch (err) {
    return toActionError(err)
  }
}

/**
 * Ativa um bloco e desativa os demais do mesmo evento. Usa db.batch (transação não interativa
 * no neon-http): o índice único parcial é checado linha a linha, então desativar e ativar
 * num único UPDATE falharia.
 */
export async function activateBlock(eventId: number, id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
    await db.batch([
      db.update(blocks).set({ active: false }).where(and(eq(blocks.eventId, eventId), eq(blocks.active, true))),
      db.update(blocks).set({ active: true }).where(and(eq(blocks.id, id), eq(blocks.eventId, eventId))),
    ])
    revalidateEventPages(eventId)
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}

export async function deactivateBlock(eventId: number, id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
    await db.update(blocks).set({ active: false }).where(and(eq(blocks.id, id), eq(blocks.eventId, eventId)))
    revalidateEventPages(eventId)
    return { ok: true }
  } catch (err) {
    return toActionError(err)
  }
}
