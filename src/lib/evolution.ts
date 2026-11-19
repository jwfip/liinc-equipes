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

// ── Layout do gráfico ────────────────────────────────────────

export const CHART_PAD = { l: 34, r: 18, t: 14, b: 34 }
export const CHART_ROW = 30          // altura por etapa
const COL = 56                       // distância entre pontos na tela
const MIN_COL = 8
const PRINT_MAX_W = 700              // largura útil de uma página A4
const MIN_W = 360
const INNER = 24                     // respiro horizontal dentro da área do gráfico
export const LABEL_MIN_GAP = 72      // distância mínima entre rótulos do eixo X

/**
 * Dimensões em pixels reais (o SVG é desenhado sem escala, então o texto mantém o tamanho).
 * Na tela, séries longas rolam; na impressão (`fit`), a distância entre pontos encolhe para caber na página.
 */
export function chartLayout(n: number, stepCount: number, fit: boolean) {
  const fixed = CHART_PAD.l + CHART_PAD.r + INNER
  let col = COL
  if (fit && n > 1) col = Math.min(COL, Math.max(MIN_COL, (PRINT_MAX_W - fixed) / (n - 1)))
  const W = Math.max(MIN_W, fixed + Math.max(0, n - 1) * col)
  const H = CHART_PAD.t + CHART_PAD.b + Math.max(0, stepCount - 1) * CHART_ROW + 8
  const spacing = n > 1 ? (W - fixed) / (n - 1) : 0

  let labeled: number[] = [0]
  if (n > 1) {
    const every = Math.max(1, Math.ceil(LABEL_MIN_GAP / spacing))
    labeled = []
    for (let i = 0; i < n; i += every) labeled.push(i)
    const last = n - 1
    if (labeled[labeled.length - 1] !== last) {
      if ((last - labeled[labeled.length - 1]) * spacing < LABEL_MIN_GAP && labeled.length > 1) labeled.pop()
      labeled.push(last)
    }
  }
  return { W, H, col: spacing, labeled }
}
