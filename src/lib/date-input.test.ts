import { describe, it, expect } from 'vitest'
import { maskDate, parseBrDate, formatBrDate } from './date-input'

describe('maskDate', () => {
  it('adds the slashes while typing', () => {
    expect(maskDate('21112026')).toBe('21/11/2026')
    expect(maskDate('2111')).toBe('21/11')
    expect(maskDate('211')).toBe('21/1')
  })
  it('keeps only digits, up to 8', () => {
    expect(maskDate('2a1')).toBe('21')
    expect(maskDate('21/11/20269')).toBe('21/11/2026')
  })
})

describe('parseBrDate', () => {
  it('turns dd/mm/aaaa into aaaa-mm-dd', () => {
    expect(parseBrDate('21/11/2026')).toBe('2026-11-21')
    expect(parseBrDate('29/02/2028')).toBe('2028-02-29')
  })
  it('rejects impossible or incomplete dates', () => {
    expect(parseBrDate('31/02/2026')).toBeNull()
    expect(parseBrDate('29/02/2026')).toBeNull()
    expect(parseBrDate('1/1/26')).toBeNull()
    expect(parseBrDate('')).toBeNull()
    expect(parseBrDate('00/01/2026')).toBeNull()
  })
})

describe('formatBrDate', () => {
  it('shows a stored date as dd/mm/aaaa and round-trips', () => {
    expect(formatBrDate('2026-11-21')).toBe('21/11/2026')
    expect(parseBrDate(formatBrDate('2026-01-05'))).toBe('2026-01-05')
    expect(formatBrDate(null)).toBe('')
  })
})

describe('maskDate — typed slashes', () => {
  it('pads day and month when the person types the slashes', () => {
    expect(maskDate('1/1/2026')).toBe('01/01/2026')
    expect(maskDate('21/3/2026')).toBe('21/03/2026')
    expect(maskDate('5/')).toBe('05')
  })
})
