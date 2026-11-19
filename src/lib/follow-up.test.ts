import { describe, it, expect } from 'vitest'
import { sortForFollowUp, recentMentors } from './follow-up'

describe('sortForFollowUp', () => {
  const teams = [{ id: 'a', number: 1 }, { id: 'b', number: 2 }, { id: 'c', number: 3 }, { id: 'd', number: 4 }]
  const alerts = {
    a: [{ code: 'absent' as const, text: 'x' }],
    b: [{ code: 'status' as const, text: 'x' }, { code: 'stuck' as const, text: 'y' }],
    c: [{ code: 'status' as const, text: 'x' }],
    d: [],
  }
  const status = { a: undefined, b: 'attention', c: 'emergency', d: 'ok' }
  it('puts more alerts first, then worse status, then team number; teams without alerts apart', () => {
    const { flagged, clear } = sortForFollowUp(teams, alerts, status)
    expect(flagged.map(t => t.id)).toEqual(['b', 'c', 'a'])
    expect(clear.map(t => t.id)).toEqual(['d'])
  })
})

describe('recentMentors', () => {
  const blocks = [{ id: 1, label: 'B1' }, { id: 2, label: 'B2' }, { id: 3, label: 'B3' }, { id: 4, label: 'B4' }]
  const r = (mentor: string, blockId: number) => ({ teamId: 't', kind: 'mentoring', blockId, mentor: { name: mentor } })
  it('lists who mentored the team in the last 3 blocks, newest first, without repeats', () => {
    const records = [r('Ana', 1), r('Bia', 2), r('Caio', 4), r('Caio', 4), r('Ana', 3)]
    expect(recentMentors(records, blocks, 't')).toEqual(['Caio (B4)', 'Ana (B3)', 'Bia (B2)'])
  })
  it('ignores atendimentos', () => {
    expect(recentMentors([{ ...r('Esp', 4), kind: 'specialist' }], blocks, 't')).toEqual([])
  })
})
