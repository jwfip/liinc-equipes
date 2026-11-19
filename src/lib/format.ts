export function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

/** Data local de hoje no formato yyyy-mm-dd (mesmo formato das datas de bloco). */
export function todayISO(now = new Date()) {
  return now.toLocaleDateString('sv-SE')
}
