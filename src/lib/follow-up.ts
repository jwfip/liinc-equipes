import { STATUS_SEVERITY, type TeamAlert } from './alerts'

/** Ordem da tela Acompanhamento: mais alertas, depois status mais grave (sem mentoria por último), depois número. */
export function sortForFollowUp<T extends { id: string; number: number }>(
  teams: T[],
  alerts: Record<string, TeamAlert[]>,
  statusByTeam: Record<string, string | null | undefined>,
): { flagged: T[]; clear: T[] } {
  const sev = (id: string) => STATUS_SEVERITY[statusByTeam[id] ?? ''] ?? -1
  const n = (id: string) => alerts[id]?.length ?? 0
  const sorted = [...teams].sort((a, b) => n(b.id) - n(a.id) || sev(b.id) - sev(a.id) || a.number - b.number)
  return { flagged: sorted.filter(t => n(t.id) > 0), clear: sorted.filter(t => n(t.id) === 0) }
}

export type RecentMentor = { mentorId: string; name: string; block: string; blockId: number }

/** Quem mentorou a equipe nos últimos `n` blocos, do mais novo ao mais antigo; um item por pessoa e bloco. */
export function recentMentors(
  records: { teamId: string; kind: string; blockId: number | null; mentorId: string; mentor: { name: string } | null }[],
  blocks: { id: number; label: string }[],
  teamId: string,
  n = 3,
): RecentMentor[] {
  const out: RecentMentor[] = []
  for (const b of blocks.slice(-n).reverse()) {
    for (const r of records) {
      if (r.teamId !== teamId || r.kind !== 'mentoring' || r.blockId !== b.id || !r.mentor) continue
      if (!out.some(m => m.mentorId === r.mentorId && m.blockId === b.id)) out.push({ mentorId: r.mentorId, name: r.mentor.name, block: b.label, blockId: b.id })
    }
  }
  return out
}

export type EventPerson = { id: string; name: string; role: 'mentor' | 'specialist'; area: string | null; experience: string | null; active: boolean }

/** Participantes do evento por papel (Mentores, Especialistas), em ordem alfabética. */
export function groupPeople(people: EventPerson[]): { mentor: EventPerson[]; specialist: EventPerson[] } {
  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  return { mentor: sorted.filter(p => p.role === 'mentor'), specialist: sorted.filter(p => p.role === 'specialist') }
}

/** Blocos em que a pessoa atendeu a equipe (mentoria ou atendimento), sem repetir; sem bloco → "fora de bloco". */
export function servedBlocks(
  records: { teamId: string; mentorId: string; blockId: number | null; block?: { label: string } | null }[],
  teamId: string,
  mentorId: string,
): string[] {
  const out: string[] = []
  for (const r of records) {
    if (r.teamId !== teamId || r.mentorId !== mentorId) continue
    const label = r.blockId === null ? 'fora de bloco' : r.block?.label ?? 'fora de bloco'
    if (!out.includes(label)) out.push(label)
  }
  return out
}
