import { isLockedOut } from './lockout'

export type LoginReason = 'invalid' | 'locked' | 'no_password'
export type LoginOutcome = { ok: true } | { ok: false; reason: LoginReason }

export const LOGIN_MESSAGES: Record<LoginReason, string> = {
  invalid:     'Usuário ou senha incorretos.',
  locked:      'Muitas tentativas. Aguarde 15 minutos e tente de novo.',
  no_password: 'Sua senha ainda não foi definida. Fale com a organização.',
}

export function normalizeUsername(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase()
}

export async function checkLogin(input: {
  user:     { passwordHash: string | null } | undefined
  password: string
  failures: Date[]
  now:      Date
  verify:   (plain: string, hash: string) => Promise<boolean>
}): Promise<LoginOutcome> {
  if (isLockedOut(input.failures, input.now)) return { ok: false, reason: 'locked' }
  if (!input.user) return { ok: false, reason: 'invalid' }
  if (!input.user.passwordHash) return { ok: false, reason: 'no_password' }
  if (!(await input.verify(input.password, input.user.passwordHash))) return { ok: false, reason: 'invalid' }
  return { ok: true }
}
