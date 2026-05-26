'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { teams, mentors, blocks, users } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

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

export async function createMentor(name: string, username: string) {
  await requireAdmin()
  await db.insert(mentors).values({ name, email: username })
  // Cria usuário para login via NextAuth
  try {
    await db.insert(users).values({ id: crypto.randomUUID(), name, email: username, role: 'mentor' })
  } catch {
    // Ignora se o usuário já existe
  }
  revalidatePath('/admin/mentores')
}

export async function toggleMentor(id: string, active: boolean) {
  await requireAdmin()
  await db.update(mentors).set({ active }).where(eq(mentors.id, id))
  revalidatePath('/admin/mentores')
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
