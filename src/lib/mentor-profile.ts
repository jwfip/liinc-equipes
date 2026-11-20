export const MAX_AREA = 120
export const MAX_EXPERIENCE = 2000

// O navegador envia quebras como \r\n mas conta 1 caractere no maxLength: normaliza antes de cortar.
const field = (fd: FormData, k: string, max: number) =>
  String(fd.get(k) ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max).trim() || null

/** Nome e perfil (área de atuação, experiência) de uma pessoa, editados pelo admin. Vazio vira null. */
export function readMentorProfile(fd: FormData): { name: string; area: string | null; experience: string | null } {
  const name = String(fd.get('name') ?? '').trim()
  if (!name) throw new Error('Informe o nome.')
  return { name, area: field(fd, 'area', MAX_AREA), experience: field(fd, 'experience', MAX_EXPERIENCE) }
}
