import { describe, it, expect } from 'vitest'
import { eventAlerts, type AlertInput } from './alerts'
import type { ProjectRow } from './project'

const S = (n: number) => ({ id: 100 + n, position: n, label: `E${n}` })
const B = (id: number, date: string, active = false) => ({ id, label: `B${id}`, date, active })
let seq = 0
const rec = (teamId: string, blockId: number, status: string, step: number | null, at: string) =>
  ({ id: `r${++seq}`, teamId, kind: 'mentoring', blockId, status, createdAt: at, step: step === null ? null : S(step) })

const base = (over: Partial<AlertInput>): AlertInput => ({
  teams: [{ id: 't1' }], records: [], stepChanges: [], projects: [],
  blocks: [B(1, '2026-01-01'), B(2, '2026-01-02'), B(3, '2026-01-03', true)], today: '2026-01-03', ...over,
})
const texts = (input: AlertInput, team = 't1') => (eventAlerts(input)[team] ?? []).map(a => a.text)
const codes = (input: AlertInput, team = 't1') => (eventAlerts(input)[team] ?? []).map(a => a.code)

describe('status', () => {
  it('flags emergency and attention', () => {
    expect(texts(base({ records: [rec('t1', 2, 'emergency', 1, '2026-01-02T10:00')] }))).toContain('Emergência')
    expect(texts(base({ records: [rec('t1', 2, 'attention', 1, '2026-01-02T10:00')] }))).toContain('Atenção')
  })
})

describe('worse', () => {
  it('flags a worse status than the previous mentoria', () => {
    const records = [rec('t1', 1, 'ok', 1, '2026-01-01T10:00'), rec('t1', 2, 'attention', 2, '2026-01-02T10:00')]
    expect(texts(base({ records }))).toContain('Status piorou: No caminho → Atenção')
  })
  it('does not flag an improvement', () => {
    const records = [rec('t1', 1, 'attention', 1, '2026-01-01T10:00'), rec('t1', 2, 'ok', 2, '2026-01-02T10:00')]
    expect(codes(base({ records }))).not.toContain('worse')
  })
})

describe('stuck', () => {
  it('flags the same step in the last 2 blocks with mentoria', () => {
    const records = [rec('t1', 1, 'ok', 2, '2026-01-01T10:00'), rec('t1', 2, 'ok', 2, '2026-01-02T10:00')]
    expect(texts(base({ records }))).toContain('Parada na etapa 2 há 2 blocos')
  })
  it('counts 3 blocks', () => {
    const records = [rec('t1', 1, 'ok', 2, '2026-01-01T10:00'), rec('t1', 2, 'ok', 2, '2026-01-02T10:00'), rec('t1', 3, 'ok', 2, '2026-01-03T10:00')]
    expect(texts(base({ records }))).toContain('Parada na etapa 2 há 3 blocos')
  })
  it('is cleared by an organization adjustment to another step after the last mentoria', () => {
    const records = [rec('t1', 1, 'ok', 2, '2026-01-01T10:00'), rec('t1', 2, 'ok', 2, '2026-01-02T10:00')]
    const stepChanges = [{ id: 1, teamId: 't1', stepId: 103, createdAt: '2026-01-02T12:00', step: S(3) }]
    expect(codes(base({ records, stepChanges }))).not.toContain('stuck')
  })
})

describe('back', () => {
  it('flags a step going back', () => {
    const records = [rec('t1', 1, 'ok', 4, '2026-01-01T10:00'), rec('t1', 2, 'ok', 2, '2026-01-02T10:00')]
    expect(texts(base({ records }))).toContain('Etapa voltou: 4 → 2')
  })
  it('explains a step going back after a pivot', () => {
    const r1 = rec('t1', 1, 'ok', 4, '2026-01-01T10:00'), r2 = rec('t1', 2, 'ok', 2, '2026-01-02T10:00')
    const projects: ProjectRow[] = [{ id: 1, teamId: 't1', description: 'novo', kind: 'pivot', recordId: r2.id, createdAt: '2026-01-02T10:00', author: null }]
    const t = texts(base({ records: [r1, r2], projects }))
    expect(t).toContain('Pivotou e voltou para a etapa 2')
    expect(t).not.toContain('Etapa voltou: 4 → 2')
  })
})

describe('behind', () => {
  it('flags a team 2+ steps below the group median', () => {
    const teams = ['a', 'b', 'c', 'd'].map(id => ({ id }))
    const records = [
      rec('a', 3, 'ok', 5, '2026-01-03T10:00'), rec('b', 3, 'ok', 5, '2026-01-03T10:00'),
      rec('c', 3, 'ok', 5, '2026-01-03T10:00'), rec('d', 3, 'ok', 2, '2026-01-03T10:00'),
    ]
    const input = base({ teams, records })
    expect(texts(input, 'd')).toContain('3 etapas atrás do grupo')
    expect(codes(input, 'a')).not.toContain('behind')
  })
  it('leaves teams without step out of the median', () => {
    const teams = ['a', 'b', 'c'].map(id => ({ id }))
    const records = [rec('a', 3, 'ok', 3, '2026-01-03T10:00'), rec('b', 3, 'ok', 2, '2026-01-03T10:00')]
    expect(codes(base({ teams, records }), 'b')).not.toContain('behind')
  })
})

describe('absent', () => {
  it('flags a team without mentoria in the block before the active one', () => {
    const records = [rec('t1', 1, 'ok', 1, '2026-01-01T10:00'), rec('t1', 3, 'ok', 1, '2026-01-03T10:00')]
    expect(texts(base({ records }))).toContain('Sem mentoria no B2')
  })
  it('does not flag anything during the first block', () => {
    expect(codes(base({ blocks: [B(1, '2026-01-01', true)], today: '2026-01-01' }))).not.toContain('absent')
  })
  it('uses the last started block when none is active', () => {
    const input = base({ blocks: [B(1, '2026-01-01'), B(2, '2026-01-02')], today: '2026-01-05' })
    expect(texts(input)).toEqual(['Sem mentoria no B2'])
  })
  it('ignores a future block when none is active', () => {
    const input = base({ blocks: [B(1, '2026-01-01'), B(2, '2026-02-01')], today: '2026-01-05' })
    expect(texts(input)).toEqual(['Sem mentoria no B1'])
  })
})

describe('edge cases', () => {
  it('gives a team without any mentoria only the absent alert', () => {
    expect(codes(base({}))).toEqual(['absent'])
  })
  it('does not break nor fire step rules when the event has no steps', () => {
    const records = [rec('t1', 1, 'ok', null, '2026-01-01T10:00'), rec('t1', 2, 'ok', null, '2026-01-02T10:00')]
    expect(codes(base({ records }))).toEqual([])
  })
  it('only counts mentorias, not atendimentos', () => {
    const at = { ...rec('t1', 2, 'emergency', 1, '2026-01-02T10:00'), kind: 'specialist' }
    expect(codes(base({ records: [at] }))).toEqual(['absent'])
  })
})

describe('step numbers', () => {
  it('shows the step order, not the raw position, when steps are given', () => {
    const records = [rec('t1', 1, 'ok', 7, '2026-01-01T10:00'), rec('t1', 2, 'ok', 7, '2026-01-02T10:00')]
    const steps = [{ id: S(3).id }, { id: S(7).id }]
    expect(texts(base({ records, steps }))).toContain('Parada na etapa 2 há 2 blocos')
  })
})
