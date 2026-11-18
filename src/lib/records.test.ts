import { describe, it, expect } from 'vitest'
import { getLatestByTeam, assertTeamInEvent } from './records'

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
