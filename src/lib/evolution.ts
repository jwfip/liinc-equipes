type Stamp = string | Date | null | undefined

export type EvolutionPoint = {
  at:         number
  stepIndex:  number
  stepLabel:  string
  status:     string | null
  source:     'mentoring' | 'organization'
  who:        string | null
  blockLabel: string | null
}

export const STATUS_LABEL: Record<string, string> = {
  ok: 'No caminho', attention: 'Atenção', emergency: 'Emergência', flying: 'Voando',
}

const ts = (d: Stamp) => (d ? new Date(d).getTime() : 0)

/** Série temporal da etapa da equipe: mentorias + ajustes da organização, em ordem cronológica. */
export function evolutionPoints(
  steps: { id: number; label: string }[],
  mentoring: { createdAt: Stamp; stepId: number | null; status: string | null; mentor?: { name: string } | null; block?: { label: string } | null }[],
  changes: { createdAt: Stamp; stepId: number }[],
): EvolutionPoint[] {
  const indexOf = new Map(steps.map((s, i) => [s.id, i]))
  const points: EvolutionPoint[] = []
  for (const r of mentoring) {
    const i = r.stepId == null ? undefined : indexOf.get(r.stepId)
    if (i === undefined) continue
    points.push({ at: ts(r.createdAt), stepIndex: i, stepLabel: steps[i].label, status: r.status, source: 'mentoring', who: r.mentor?.name ?? null, blockLabel: r.block?.label ?? null })
  }
  for (const c of changes) {
    const i = indexOf.get(c.stepId)
    if (i === undefined) continue
    points.push({ at: ts(c.createdAt), stepIndex: i, stepLabel: steps[i].label, status: null, source: 'organization', who: null, blockLabel: null })
  }
  return points.sort((a, b) => a.at - b.at)
}

export function describeEvolution(points: EvolutionPoint[]): string {
  if (points.length === 0) return 'Sem dados de evolução ainda'
  const first = points[0], last = points[points.length - 1]
  const lastStatus = [...points].reverse().find(p => p.status)?.status
  const n = points.length
  return `${n} registro${n > 1 ? 's' : ''}: de ${first.stepIndex + 1} — ${first.stepLabel} a ${last.stepIndex + 1} — ${last.stepLabel}` +
    (lastStatus ? `; status atual ${STATUS_LABEL[lastStatus] ?? lastStatus}` : '')
}
