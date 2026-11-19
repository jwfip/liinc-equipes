/** Posição de cada bloco na lista (já em ordem cronológica): a ordem usada para "bloco mais recente". */
export function blockRankOf(blocks: { id: number }[]): Map<number, number> {
  return new Map(blocks.map((b, i) => [b.id, i]))
}

type LatestCandidate = { teamId: string; blockId: number | null; createdAt: string | Date | null; kind: string }

/**
 * Registro mais recente de cada equipe: bloco mais recente, depois maior createdAt. Só mentorias contam.
 * `blockRank` (id do bloco → posição na ordem por data) define o bloco mais recente; sem ele, vale o maior blockId.
 */
export function getLatestByTeam<R extends LatestCandidate>(records: R[], blockRank?: Map<number, number>): Record<string, R> {
  const rank = (b: number | null) => (b === null ? -1 : blockRank ? blockRank.get(b) ?? -1 : b)
  return records.reduce<Record<string, R>>((acc, r) => {
    if (r.kind !== 'mentoring') return acc
    const prev = acc[r.teamId]
    if (
      !prev ||
      rank(r.blockId) > rank(prev.blockId) ||
      (r.blockId === prev.blockId && new Date(r.createdAt ?? 0).getTime() > new Date(prev.createdAt ?? 0).getTime())
    ) {
      acc[r.teamId] = r
    }
    return acc
  }, {})
}

export function assertTeamInEvent(team: { eventId: number; active: boolean } | undefined, eventId: number): void {
  if (!team || team.eventId !== eventId || !team.active) throw new Error('Equipe inválida para este evento.')
}

export function assertSameKind(record: { kind: string }, kind: 'mentoring' | 'specialist'): void {
  if (record.kind !== kind) throw new Error('Registro não encontrado.')
}

export function splitByKind<R extends { kind: string }>(records: R[]): { mentoring: R[]; specialist: R[] } {
  return {
    mentoring:  records.filter(r => r.kind === 'mentoring'),
    specialist: records.filter(r => r.kind === 'specialist'),
  }
}

export function countByTeam(records: { teamId: string }[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of records) out[r.teamId] = (out[r.teamId] ?? 0) + 1
  return out
}

export function defaultHistoryTab(role: 'mentor' | 'specialist' | 'facilitator' | null): 'mentoring' | 'specialist' {
  return role === 'specialist' ? 'specialist' : 'mentoring'
}

export type TeamGroup = 'emergency' | 'attention' | 'ok' | 'flying' | 'none'
const GROUPS: TeamGroup[] = ['emergency', 'attention', 'ok', 'flying', 'none']

/** Agrupa equipes pelo status da mentoria mais recente; sem mentoria → 'none'. Ordem numérica em cada grupo. */
export function groupTeams<T extends { id: string; number: number }>(
  teams: T[],
  latestByTeam: Record<string, { status: string | null }>,
): Record<TeamGroup, T[]> {
  const out = Object.fromEntries(GROUPS.map(g => [g, [] as T[]])) as Record<TeamGroup, T[]>
  for (const t of [...teams].sort((a, b) => a.number - b.number)) {
    const st = latestByTeam[t.id]?.status as TeamGroup | undefined
    out[st && st !== 'none' && GROUPS.includes(st) ? st : 'none'].push(t)
  }
  return out
}

type StepRef = { id: number; position: number; label: string }

export type StepChange = { id: number; teamId: string; stepId: number; createdAt: string | Date | null; step: StepRef | null }
type Stamp = string | Date | null | undefined
const ts = (d: Stamp) => (d ? new Date(d).getTime() : 0)

/** Etapa atual: a mais recente entre a última mentoria e o último ajuste da organização. */
export function currentStepFor(
  latestMentoring: { step: StepRef | null; createdAt: Stamp } | undefined,
  changes: { createdAt: Stamp; step: StepRef | null }[],
): { step: StepRef | null; source: 'mentoring' | 'organization' | null } {
  const lastChange = changes.reduce<(typeof changes)[number] | undefined>(
    (acc, c) => (!acc || ts(c.createdAt) > ts(acc.createdAt) ? c : acc), undefined)
  if (lastChange && (!latestMentoring || ts(lastChange.createdAt) > ts(latestMentoring.createdAt))) {
    return { step: lastChange.step, source: 'organization' }
  }
  if (latestMentoring) return { step: latestMentoring.step, source: 'mentoring' }
  return { step: null, source: null }
}
