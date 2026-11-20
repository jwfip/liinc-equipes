import { describe, it, expect } from 'vitest'
import { readMentorProfile } from './mentor-profile'

const fd = (v: Record<string, string>) => { const f = new FormData(); for (const [k, x] of Object.entries(v)) f.set(k, x); return f }

describe('readMentorProfile', () => {
  it('trims name, area and experience', () => {
    expect(readMentorProfile(fd({ name: ' Ana ', area: ' Vendas B2B ', experience: ' 10 anos ' })))
      .toEqual({ name: 'Ana', area: 'Vendas B2B', experience: '10 anos' })
  })
  it('stores empty fields as null', () => {
    expect(readMentorProfile(fd({ name: 'Ana', area: '  ', experience: '' }))).toEqual({ name: 'Ana', area: null, experience: null })
  })
  it('requires the name', () => {
    expect(() => readMentorProfile(fd({ name: '   ' }))).toThrow('Informe o nome.')
  })
  it('caps area at 120 and experience at 2000 characters', () => {
    const r = readMentorProfile(fd({ name: 'Ana', area: 'a'.repeat(200), experience: 'e'.repeat(2500) }))
    expect(r.area).toHaveLength(120)
    expect(r.experience).toHaveLength(2000)
  })
})

describe('readMentorProfile — line breaks', () => {
  it('counts a browser line break (\\r\\n) as one character, like the textarea limit', () => {
    const text = ('a'.repeat(99) + '\r\n').repeat(20) // 2000 caracteres no navegador, 2020 no envio
    const r = readMentorProfile(fd({ name: 'Ana', experience: text }))
    expect(r.experience).toBe(('a'.repeat(99) + '\n').repeat(20).trim())
  })
})
