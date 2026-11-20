import { describe, it, expect } from 'vitest'
import { evolutionPoints, describeEvolution } from './evolution'

const steps = [{ id: 1, label: 'Ideação' }, { id: 2, label: 'Protótipo' }, { id: 3, label: 'Pitch' }]
const m = (createdAt: string, stepId: number | null, status: string | null = 'ok') =>
  ({ createdAt, stepId, status, mentor: { name: 'Ana' }, block: { label: 'Bloco 1' } })

describe('evolutionPoints', () => {
  it('returns no points without data', () => {
    expect(evolutionPoints(steps, [], [])).toEqual([])
  })
  it('returns one point for a single mentoring', () => {
    const p = evolutionPoints(steps, [m('2026-01-01T10:00', 1)], [])
    expect(p).toHaveLength(1)
    expect(p[0]).toMatchObject({ stepIndex: 0, stepLabel: 'Ideação', status: 'ok', source: 'mentoring', who: 'Ana', blockLabel: 'Bloco 1' })
  })
  it('interleaves mentorings and adjustments by time', () => {
    const p = evolutionPoints(steps, [m('2026-01-01T10:00', 1), m('2026-01-01T12:00', 3, 'flying')], [{ createdAt: '2026-01-01T11:00', stepId: 2 }])
    expect(p.map(x => x.stepIndex)).toEqual([0, 1, 2])
    expect(p[1]).toMatchObject({ source: 'organization', status: null })
  })
  it('ignores steps that are no longer in the event', () => {
    expect(evolutionPoints(steps, [m('2026-01-01T10:00', 99)], [])).toEqual([])
  })
})

describe('describeEvolution', () => {
  it('describes an empty series', () => {
    expect(describeEvolution([])).toBe('Sem dados de evolução ainda')
  })
  it('summarizes start, end and latest status', () => {
    const p = evolutionPoints(steps, [m('2026-01-01T10:00', 1), m('2026-01-01T12:00', 2, 'attention')], [])
    expect(describeEvolution(p)).toBe('2 registros: de 1 — Ideação a 2 — Protótipo; status atual Atenção')
  })
})

import { chartLayout, LABEL_MIN_GAP } from './evolution'

describe('chartLayout', () => {
  it('uses native size on screen (no scaling): W grows with points', () => {
    expect(chartLayout(3, 3, false).W).toBe(360)
    expect(chartLayout(37, 3, false).col).toBe(56)
  })
  it('fits the printed page width, shrinking the gap between points', () => {
    const l = chartLayout(37, 3, true)
    expect(l.W).toBeLessThanOrEqual(700)
    expect(l.col).toBeGreaterThanOrEqual(8)
  })
  it('does not stretch short series in print', () => {
    expect(chartLayout(2, 6, true).W).toBe(360)
  })
  it('keeps x labels at least LABEL_MIN_GAP apart and always labels the last point', () => {
    for (const [n, fit] of [[20, false], [37, true], [8, true], [5, false]] as const) {
      const l = chartLayout(n, 3, fit)
      const xs = l.labeled.map(i => i * l.col)
      for (let k = 1; k < xs.length; k++) expect(xs[k] - xs[k - 1]).toBeGreaterThanOrEqual(LABEL_MIN_GAP)
      expect(l.labeled[l.labeled.length - 1]).toBe(n - 1)
    }
  })
})

import { smoothPath } from './evolution'

/** Números de um caminho SVG "M x y C c1x c1y c2x c2y x y …" agrupados por segmento. */
const segments = (d: string) => {
  const [, ...cs] = d.split('C')
  return cs.map(c => c.trim().split(/[\s,]+/).map(Number))
}

describe('smoothPath', () => {
  it('draws only the start point for a single point', () => {
    expect(smoothPath([{ x: 10, y: 20 }])).toBe('M 10 20')
  })
  it('starts at the first point and ends at the last', () => {
    const d = smoothPath([{ x: 0, y: 100 }, { x: 50, y: 40 }])
    expect(d.startsWith('M 0 100')).toBe(true)
    const last = segments(d).at(-1)!
    expect(last.slice(4)).toEqual([50, 40])
  })
  it('stays flat between points on the same step', () => {
    const s = segments(smoothPath([{ x: 0, y: 60 }, { x: 40, y: 60 }, { x: 80, y: 30 }]))[0]
    expect([s[1], s[3], s[5]]).toEqual([60, 60, 60])
  })
  it('never overshoots a step between two mentorias (monotone)', () => {
    const pts = [{ x: 0, y: 150 }, { x: 40, y: 120 }, { x: 80, y: 30 }, { x: 120, y: 30 }, { x: 160, y: 90 }]
    segments(smoothPath(pts)).forEach((s, i) => {
      const lo = Math.min(pts[i].y, pts[i + 1].y), hi = Math.max(pts[i].y, pts[i + 1].y)
      for (const y of [s[1], s[3]]) { expect(y).toBeGreaterThanOrEqual(lo - 1e-9); expect(y).toBeLessThanOrEqual(hi + 1e-9) }
    })
  })
})
