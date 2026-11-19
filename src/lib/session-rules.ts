type MaybeSession = { user?: { mustChangePassword?: boolean } | null } | null | undefined

/** Motivo para recusar uma operação de dados com esta sessão, ou null se pode seguir. */
export function sessionBlockReason(session: MaybeSession): string | null {
  if (!session?.user) return 'Não autenticado'
  if (session.user.mustChangePassword) return 'Defina sua senha antes de continuar.'
  return null
}
