import { describe, it, expect } from 'vitest'
import { redactPrivateNotes } from './privacy'

const recs = [
  { id: 'a', mentorId: 'm1', obs: 'nota de m1' },
  { id: 'b', mentorId: 'm2', obs: 'nota de m2' },
  { id: 'c', mentorId: 'm2', obs: null },
]

describe('redactPrivateNotes', () => {
  it('keeps every note for facilitator and admin', () => {
    expect(redactPrivateNotes(recs, { canSeeAll: true, mentorId: null })).toEqual(recs)
  })
  it('keeps only the reader own notes for a mentor', () => {
    const out = redactPrivateNotes(recs, { canSeeAll: false, mentorId: 'm1' })
    expect(out.map(r => r.obs)).toEqual(['nota de m1', null, null])
  })
  it('hides every note from a reader without mentor record', () => {
    const out = redactPrivateNotes(recs, { canSeeAll: false, mentorId: null })
    expect(out.every(r => r.obs === null)).toBe(true)
  })
  it('does not mutate the input', () => {
    redactPrivateNotes(recs, { canSeeAll: false, mentorId: null })
    expect(recs[1].obs).toBe('nota de m2')
  })
})
