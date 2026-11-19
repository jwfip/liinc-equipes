import { describe, it, expect } from 'vitest'
import { validatePassword, generateTempPassword, hashPassword, verifyPassword, TEMP_PASSWORD_ALPHABET } from './password'

describe('validatePassword', () => {
  it('requires at least 8 characters', () => {
    expect(validatePassword('1234567', 'ana')).toBe('A senha precisa ter pelo menos 8 caracteres.')
  })
  it('rejects the username as password, ignoring case', () => {
    expect(validatePassword('Ana.Silva', 'ana.silva')).toBe('A senha não pode ser igual ao usuário.')
  })
  it('accepts a valid password', () => {
    expect(validatePassword('boa-senha-1', 'ana')).toBeNull()
  })
})

describe('generateTempPassword', () => {
  it('has 10 characters from the unambiguous alphabet', () => {
    expect(TEMP_PASSWORD_ALPHABET).toBe('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789')
    const p = generateTempPassword()
    expect(p).toHaveLength(10)
    for (const ch of p) expect(TEMP_PASSWORD_ALPHABET).toContain(ch)
  })
  it('is random', () => {
    expect(new Set(Array.from({ length: 50 }, generateTempPassword)).size).toBe(50)
  })
})

describe('hashPassword / verifyPassword', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('x-senha-1', 4)
    expect(hash).not.toContain('x-senha-1')
    expect(await verifyPassword('x-senha-1', hash)).toBe(true)
    expect(await verifyPassword('outra', hash)).toBe(false)
  })
})
