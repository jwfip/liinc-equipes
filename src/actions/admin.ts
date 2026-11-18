'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { teams, mentors, blocks, users } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { toActionError, type ActionResult } from '@/lib/action-result'

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Acesso negado')
}

// ── Teams ────────────────────────────────────────────────────

export async function createTeam(number: number, name: string) {
  await requireAdmin()
  await db.insert(teams).values({ number, name })
  revalidatePath('/admin/equipes')
}

export async function toggleTeam(id: string, active: boolean) {
  await requireAdmin()
  await db.update(teams).set({ active }).where(eq(teams.id, id))
  revalidatePath('/admin/equipes')
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

export async function createBlock(label: string, date: string) {
  await requireAdmin()
  await db.insert(blocks).values({ label, date, active: false })
  revalidatePath('/admin/blocos')
}

export async function activateBlock(id: number) {
  await requireAdmin()
  await db.update(blocks).set({ active: false })
  await db.update(blocks).set({ active: true }).where(eq(blocks.id, id))
  revalidatePath('/admin/blocos')
  revalidatePath('/mentoria')
}

export async function deactivateBlock(id: number) {
  await requireAdmin()
  await db.update(blocks).set({ active: false }).where(eq(blocks.id, id))
  revalidatePath('/admin/blocos')
}
