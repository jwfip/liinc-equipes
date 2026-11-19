type LatestCandidate = { teamId: string; blockId: number; createdAt: string | null; kind: string }

/** Registro mais recente de cada equipe (maior blockId, depois maior createdAt). Só mentorias contam. */
export function getLatestByTeam<R extends LatestCandidate>(records: R[]): Record<string, R> {
  return records.reduce<Record<string, R>>((acc, r) => {
    if (r.kind !== 'mentoring') return acc
    const prev = acc[r.teamId]
    if (
      !prev ||
      r.blockId > prev.blockId ||
      (r.blockId === prev.blockId && (r.createdAt ?? '') > (prev.createdAt ?? ''))
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
