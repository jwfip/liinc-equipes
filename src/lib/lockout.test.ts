import { describe, it, expect } from 'vitest'
import { isLockedOut } from './lockout'

const now = new Date('2026-11-19T12:00:00Z')
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000)

describe('isLockedOut', () => {
  it('allows 4 recent failures', () => {
    expect(isLockedOut([1, 2, 3, 4].map(minsAgo), now)).toBe(false)
  })
  it('locks after 5 recent failures', () => {
    expect(isLockedOut([1, 2, 3, 4, 5].map(minsAgo), now)).toBe(true)
  })
  it('ignores failures older than 15 minutes', () => {
    expect(isLockedOut([1, 2, 3, 4, 16].map(minsAgo), now)).toBe(false)
  })
})
