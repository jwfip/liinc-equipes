export function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

/** Hoje no horário de Brasília, yyyy-mm-dd (mesmo formato das datas de bloco). Fuso fixo para servidor (UTC) e navegador concordarem. */
export function todayISO(now = new Date()) {
  return now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}
