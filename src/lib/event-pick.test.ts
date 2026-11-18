import { describe, it, expect } from 'vitest'
import { pickEventId, type EventOption } from './event-pick'

const ev = (id: number, active = true): EventOption => ({ id, name: `E${id}`, active, role: 'mentor' })

describe('pickEventId', () => {
  it('uses the cookie when it points to an active option', () => {
    expect(pickEventId([ev(1), ev(3)], '3')).toBe(3)
    expect(pickEventId([ev(1), ev(3)], '1')).toBe(1)
  })
  it('falls back to the newest active event when cookie is unknown', () => {
    expect(pickEventId([ev(1), ev(3)], '9')).toBe(3)
  })
  it('ignores a cookie pointing to an inactive event', () => {
    expect(pickEventId([ev(1), ev(2, false), ev(3)], '2')).toBe(3)
  })
  it('ignores a non-numeric cookie', () => {
    expect(pickEventId([ev(1), ev(3)], 'abc')).toBe(3)
  })
  it('returns null when there is no active event', () => {
    expect(pickEventId([ev(1, false)], undefined)).toBeNull()
    expect(pickEventId([], '1')).toBeNull()
  })
  it('lets admins keep an inactive event selected via cookie', () => {
    expect(pickEventId([ev(1, false), ev(3)], '1', { allowInactive: true })).toBe(1)
    expect(pickEventId([ev(1, false)], undefined, { allowInactive: true })).toBeNull()
  })
})
