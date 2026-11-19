import { describe, it, expect } from 'vitest'
import { getLatestByTeam, assertTeamInEvent, assertSameKind, splitByKind, countByTeam, defaultHistoryTab, groupTeams, currentStepFor } from './records'

const rec = (id: string, teamId: string, blockId: number, createdAt: string, kind = 'mentoring') =>
  ({ id, teamId, blockId, createdAt, kind }) as any

describe('getLatestByTeam', () => {
  it('picks the record with the highest blockId', () => {
    const r = getLatestByTeam([rec('a', 't1', 2, '2026-01-01'), rec('b', 't1', 1, '2026-02-01')])
    expect(r.t1.id).toBe('a')
  })
  it('breaks blockId ties by most recent createdAt', () => {
    const r = getLatestByTeam([rec('a', 't1', 1, '2026-01-01T10:00'), rec('b', 't1', 1, '2026-01-01T11:00')])
    expect(r.t1.id).toBe('b')
  })
  it('ignores specialist records', () => {
    const r = getLatestByTeam([rec('a', 't1', 1, '2026-01-01'), rec('b', 't1', 2, '2026-01-02', 'specialist')])
    expect(r.t1.id).toBe('a')
  })
})

describe('assertTeamInEvent', () => {
  it('rejects a missing team', () => {
    expect(() => assertTeamInEvent(undefined, 1)).toThrow('Equipe inválida para este evento.')
  })
  it('rejects a team from another event', () => {
    expect(() => assertTeamInEvent({ eventId: 2, active: true }, 1)).toThrow('Equipe inválida para este evento.')
  })
  it('rejects an inactive team', () => {
    expect(() => assertTeamInEvent({ eventId: 1, active: false }, 1)).toThrow('Equipe inválida para este evento.')
  })
  it('accepts an active team of the event', () => {
    expect(() => assertTeamInEvent({ eventId: 1, active: true }, 1)).not.toThrow()
  })
})

describe('assertSameKind', () => {
  it('rejects a record of another kind as not found', () => {
    expect(() => assertSameKind({ kind: 'specialist' }, 'mentoring')).toThrow('Registro não encontrado.')
  })
  it('accepts the same kind', () => {
    expect(() => assertSameKind({ kind: 'mentoring' }, 'mentoring')).not.toThrow()
  })
})

describe('splitByKind / countByTeam', () => {
  const rs = [{ kind: 'mentoring', teamId: 'a' }, { kind: 'specialist', teamId: 'a' }, { kind: 'specialist', teamId: 'b' }]
  it('splits records by kind', () => {
    const { mentoring, specialist } = splitByKind(rs)
    expect(mentoring).toHaveLength(1)
    expect(specialist).toHaveLength(2)
  })
  it('counts records per team', () => {
    expect(countByTeam(rs)).toEqual({ a: 2, b: 1 })
  })
})

describe('defaultHistoryTab', () => {
  it('opens atendimentos for specialists and mentorias otherwise', () => {
    expect(defaultHistoryTab('specialist')).toBe('specialist')
    expect(defaultHistoryTab('mentor')).toBe('mentoring')
    expect(defaultHistoryTab(null)).toBe('mentoring')
    expect(defaultHistoryTab('facilitator')).toBe('mentoring')
  })
})

describe('groupTeams', () => {
  const t = (id: string, number: number) => ({ id, number })
  it('puts teams without mentoring in none, sorted by number', () => {
    const g = groupTeams([t('c', 3), t('a', 1), t('b', 2)], { b: { status: 'ok' } })
    expect(g.none.map(x => x.id)).toEqual(['a', 'c'])
    expect(g.ok.map(x => x.id)).toEqual(['b'])
    expect(g.emergency).toEqual([])
  })
})

describe('currentStepFor', () => {
  const s1 = { id: 1, position: 1, label: 'Ideação' }
  const s2 = { id: 2, position: 2, label: 'Protótipo' }
  const change = (createdAt: string, step = s2) => ({ id: 9, teamId: 'a', stepId: step.id, createdAt, step })
  it('uses the mentoring step when there is no adjustment', () => {
    expect(currentStepFor({ step: s1, createdAt: '2026-01-01T10:00' }, [])).toEqual({ step: s1, source: 'mentoring' })
  })
  it('uses the adjustment when there is no mentoring', () => {
    expect(currentStepFor(undefined, [change('2026-01-01T10:00')])).toEqual({ step: s2, source: 'organization' })
  })
  it('a newer adjustment wins over an older mentoring', () => {
    expect(currentStepFor({ step: s1, createdAt: '2026-01-01T10:00' }, [change('2026-01-01T11:00')]).source).toBe('organization')
  })
  it('a newer mentoring wins over an older adjustment', () => {
    expect(currentStepFor({ step: s1, createdAt: '2026-01-01T12:00' }, [change('2026-01-01T11:00')]).source).toBe('mentoring')
  })
  it('picks the latest of several adjustments', () => {
    expect(currentStepFor(undefined, [change('2026-01-01T10:00', s1), change('2026-01-01T11:00', s2)]).step).toEqual(s2)
  })
  it('returns nothing when there is neither', () => {
    expect(currentStepFor(undefined, [])).toEqual({ step: null, source: null })
  })
})
