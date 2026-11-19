import { describe, it, expect } from 'vitest'
import { todayISO } from './format'

describe('todayISO', () => {
  it('formats the local date as yyyy-mm-dd, like block dates', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('todayISO in Brazil time', () => {
  it('uses the São Paulo date even when the server clock is UTC', () => {
    expect(todayISO(new Date('2026-01-06T01:30:00Z'))).toBe('2026-01-05')
  })
})
