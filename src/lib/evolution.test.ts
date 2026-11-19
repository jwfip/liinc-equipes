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
