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

/** "Nome (Bloco)" de quem mentorou a equipe nos últimos `n` blocos, do mais novo ao mais antigo. */
export function recentMentors(
  records: { teamId: string; kind: string; blockId: number | null; mentor: { name: string } | null }[],
  blocks: { id: number; label: string }[],
  teamId: string,
  n = 3,
): string[] {
  const out: string[] = []
  for (const b of blocks.slice(-n).reverse()) {
    for (const r of records) {
      if (r.teamId !== teamId || r.kind !== 'mentoring' || r.blockId !== b.id || !r.mentor) continue
      const label = `${r.mentor.name} (${b.label})`
      if (!out.includes(label)) out.push(label)
    }
  }
  return out
}
