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

export type ProjectInfo = { description: string; since: string | null; author: string | null }

/** Projeto atual de cada equipe para os formulários: texto mais recente, datado e assinado por quem o registrou. */
export function projectInfoByTeam(rows: ProjectRow[]): Record<string, ProjectInfo> {
  const out: Record<string, ProjectInfo> = {}
  for (const teamId of Array.from(new Set(rows.map(r => r.teamId)))) {
    const cur = currentProject(rows, teamId)!
    const since = projectSince(rows, teamId) ?? cur
    out[teamId] = {
      description: cur.description,
      since: since.createdAt ? new Date(since.createdAt).toISOString() : null,
      author: since.author?.name ?? null,
    }
  }
  return out
}

export type ProjectContext = { current: string | null; pivots: { at: Stamp; description: string }[] }

/** Projeto atual e pivôs (do mais antigo ao mais novo), para os prompts da IA. */
export function projectContext(rows: ProjectRow[], teamId: string): ProjectContext {
  const team = ofTeam(rows, teamId)
  return {
    current: team[0]?.description ?? null,
    pivots: team.filter(r => r.kind === 'pivot').reverse().map(r => ({ at: r.createdAt, description: r.description })),
  }
}

/** Ids dos últimos `n` blocos que já começaram (data <= hoje). `blocks` em ordem cronológica. */
export function recentBlockIds(blocks: { id: number; date: string }[], today: string, n = 2): number[] {
  return blocks.filter(b => b.date <= today).slice(-n).map(b => b.id)
}
