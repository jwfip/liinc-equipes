import { auth } from '@/auth'
import { sessionBlockReason } from './session-rules'

/** Sessão válida e com senha definida (bloqueia quem ainda está com senha temporária). */
export async function requireActiveSession() {
  const session = await auth()
  const reason = sessionBlockReason(session)
  if (reason) throw new Error(reason)
  return session!
}

export async function requireAdmin() {
  const session = await requireActiveSession()
  if (session.user.role !== 'admin') throw new Error('Acesso negado')
  return session
}
