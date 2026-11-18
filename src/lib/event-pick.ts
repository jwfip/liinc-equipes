export const EVENT_COOKIE = 'liinc_event'

export type EventRole = 'mentor' | 'specialist'

export type EventOption = { id: number; name: string; active: boolean; role: EventRole | null }

/** Escolhe o evento corrente: o do cookie se ainda for válido e ativo; senão o ativo mais recente.
 *  Admin (allowInactive) pode manter selecionado um evento encerrado. */
export function pickEventId(
  options: EventOption[],
  cookieValue: string | undefined,
  opts: { allowInactive?: boolean } = {},
): number | null {
  const fromCookie = cookieValue && /^\d+$/.test(cookieValue) ? Number(cookieValue) : null
  const selectable = opts.allowInactive ? options : options.filter(o => o.active)
  if (fromCookie !== null && selectable.some(o => o.id === fromCookie)) return fromCookie
  const active = options.filter(o => o.active)
  if (active.length === 0) return null
  return Math.max(...active.map(o => o.id))
}
