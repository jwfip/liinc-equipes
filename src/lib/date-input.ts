/** Campo de data no formato brasileiro (dd/mm/aaaa); o formulário envia aaaa-mm-dd. */

/** Barras automáticas enquanto a pessoa digita: só dígitos, até 8. */
export function maskDate(raw: string): string {
  // Quem digita as barras ("1/1/2026") completa dia e mês com zero; senão "1/1/2026" viraria "11/20/26".
  const parts = raw.replace(/[^\d/]/g, '').split('/')
  const d = parts.map((p, i) => (i < 2 && i < parts.length - 1 && p.length === 1 ? `0${p}` : p)).join('').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** dd/mm/aaaa válido (anos 2000–2100) → aaaa-mm-dd; incompleta, impossível (31/02) ou fora do intervalo → null. */
export function parseBrDate(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim())
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const day = Number(dd), month = Number(mm), year = Number(yyyy)
  if (year < 2000 || year > 2100) return null // erro de digitação (2206, 0201)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${yyyy}-${mm}-${dd}`
}

/** aaaa-mm-dd (como vem do banco) → dd/mm/aaaa. */
export function formatBrDate(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}
