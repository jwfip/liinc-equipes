import { describe, it, expect } from 'vitest'
import { sortForFollowUp, recentMentors, groupPeople, servedBlocks } from './follow-up'

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
  const r = (mentor: string, blockId: number) => ({ teamId: 't', kind: 'mentoring', blockId, mentorId: mentor.toLowerCase(), mentor: { name: mentor } })
  it('lists who mentored the team in the last 3 blocks, newest first, without repeats', () => {
    const records = [r('Ana', 1), r('Bia', 2), r('Caio', 4), r('Caio', 4), r('Ana', 3)]
    expect(recentMentors(records, blocks, 't')).toEqual([
      { mentorId: 'caio', name: 'Caio', block: 'B4', blockId: 4 },
      { mentorId: 'ana', name: 'Ana', block: 'B3', blockId: 3 },
      { mentorId: 'bia', name: 'Bia', block: 'B2', blockId: 2 },
    ])
  })
  it('keeps one item per person and block', () => {
    const out = recentMentors([r('Ana', 4), r('Ana', 3)], blocks, 't')
    expect(out.map(m => `${m.name} (${m.block})`)).toEqual(['Ana (B4)', 'Ana (B3)'])
    expect(new Set(out.map(m => m.mentorId)).size).toBe(1)
  })
  it('ignores atendimentos', () => {
    expect(recentMentors([{ ...r('Esp', 4), kind: 'specialist' }], blocks, 't')).toEqual([])
  })
})

describe('groupPeople', () => {
  const p = (name: string, role: 'mentor' | 'specialist') => ({ id: name, name, role, area: null, experience: null, active: true })
  it('splits mentors and specialists, sorted by name', () => {
    const g = groupPeople([p('Érica', 'mentor'), p('Bruno', 'specialist'), p('Ana', 'mentor')])
    expect(g.mentor.map(x => x.name)).toEqual(['Ana', 'Érica'])
    expect(g.specialist.map(x => x.name)).toEqual(['Bruno'])
  })
})

describe('servedBlocks', () => {
  const r = (mentorId: string, teamId: string, blockId: number | null, label?: string) =>
    ({ mentorId, teamId, blockId, block: label ? { label } : null })
  it('lists the blocks where the person served the team, without repeats', () => {
    const recs = [r('ana', 't', 2, 'B2'), r('ana', 't', 2, 'B2'), r('ana', 't', null), r('bia', 't', 3, 'B3'), r('ana', 'u', 4, 'B4')]
    expect(servedBlocks(recs, 't', 'ana')).toEqual(['B2', 'fora de bloco'])
  })
})

describe('recentMentors — blocks with the same name', () => {
  it('keeps one item per person and block id, even if two blocks share a label', () => {
    const blocks = [{ id: 1, label: 'Bloco' }, { id: 2, label: 'Bloco' }]
    const r = (blockId: number) => ({ teamId: 't', kind: 'mentoring', blockId, mentorId: 'ana', mentor: { name: 'Ana' } })
    const out = recentMentors([r(1), r(2)], blocks, 't')
    expect(out).toHaveLength(2)
    expect(new Set(out.map(m => m.blockId)).size).toBe(2)
  })
})
