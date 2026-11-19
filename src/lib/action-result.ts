/** `secret`: valor sensível (ex.: senha temporária) exibido uma única vez; `subject` diz de quem é. */
export type ActionResult =
  | { ok: true; message?: string; secret?: string; subject?: string }
  | { ok: false; error: string }

function pgCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const e = err as { code?: unknown; cause?: unknown }
  if (typeof e.code === 'string') return e.code
  return pgCode(e.cause)
}

export function toActionError(err: unknown): { ok: false; error: string } {
  if (pgCode(err) === '23505') return { ok: false, error: 'Registro já existe.' }
  if (err instanceof Error && err.message) return { ok: false, error: err.message }
  return { ok: false, error: 'Erro inesperado. Tente novamente.' }
}
