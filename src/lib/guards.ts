import { auth } from '@/auth'

export async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Acesso negado')
  return session
}
