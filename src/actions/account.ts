'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/schema'
import { hashPassword, validatePassword, verifyPassword } from '@/lib/password'
import { toActionError, type ActionResult } from '@/lib/action-result'

export async function changePassword(fd: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { ok: false, error: 'Sessão expirada. Entre de novo.' }

    const current = String(fd.get('current') ?? '')
    const next    = String(fd.get('next') ?? '')
    const confirm = String(fd.get('confirm') ?? '')

    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
    if (!user?.passwordHash || !(await verifyPassword(current, user.passwordHash))) {
      return { ok: false, error: 'Senha atual incorreta.' }
    }
    if (next !== confirm) return { ok: false, error: 'As senhas não conferem.' }
    const invalid = validatePassword(next, user.email)
    if (invalid) return { ok: false, error: invalid }
    if (next === current) return { ok: false, error: 'A nova senha precisa ser diferente da atual.' }

    await db.update(users)
      .set({ passwordHash: await hashPassword(next), mustChangePassword: false })
      .where(eq(users.id, user.id))
    revalidatePath('/', 'layout')
    return { ok: true, message: 'Senha alterada.' }
  } catch (err) {
    return toActionError(err)
  }
}
