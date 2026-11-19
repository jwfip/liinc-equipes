type Stamp = string | Date | null | undefined
const ts = (d: Stamp) => (d ? new Date(d).getTime() : 0)

export type ProjectKind = 'initial' | 'pivot' | 'correction'

export type ProjectRow = {
  id: number; teamId: string; description: string; kind: ProjectKind
  recordId: string | null; createdAt: Stamp; author: { name: string } | null
}

const newestFirst = (a: ProjectRow, b: ProjectRow) => ts(b.createdAt) - ts(a.createdAt) || b.id - a.id
const ofTeam = (rows: ProjectRow[], teamId: string) => rows.filter(r => r.teamId === teamId).sort(newestFirst)

/** Projeto atual: a versão mais recente (correções incluídas). */
export function currentProject(rows: ProjectRow[], teamId: string): ProjectRow | null {
  return ofTeam(rows, teamId)[0] ?? null
}

/** Versão que deu início ao projeto atual (inicial ou pivô); correções não mudam a data. */
export function projectSince(rows: ProjectRow[], teamId: string): ProjectRow | null {
  return ofTeam(rows, teamId).find(r => r.kind !== 'correction') ?? null
}

/** Último pivô registrado numa mentoria de um dos blocos informados. */
export function recentPivot(rows: ProjectRow[], teamId: string, recordBlock: Map<string, number>, recentBlockIds: number[]): ProjectRow | null {
  return ofTeam(rows, teamId).find(r =>
    r.kind === 'pivot' && r.recordId !== null && recentBlockIds.includes(recordBlock.get(r.recordId) ?? -1)) ?? null
}
