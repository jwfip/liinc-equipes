import { describe, it, expect } from 'vitest'
import { todayISO } from './format'

describe('todayISO', () => {
  it('formats the local date as yyyy-mm-dd, like block dates', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})
