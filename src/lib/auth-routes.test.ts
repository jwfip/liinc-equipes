import { describe, it, expect } from 'vitest'
import { needsPasswordChange } from './auth-routes'

describe('needsPasswordChange', () => {
  it('sends users who must change their password to /conta/senha', () => {
    expect(needsPasswordChange('/painel', true)).toBe(true)
    expect(needsPasswordChange('/admin/eventos', true)).toBe(true)
  })
  it('does not loop on the password page, auth routes or login', () => {
    expect(needsPasswordChange('/conta/senha', true)).toBe(false)
    expect(needsPasswordChange('/api/auth/signout', true)).toBe(false)
    expect(needsPasswordChange('/login', true)).toBe(false)
  })
  it('leaves everyone else alone', () => {
    expect(needsPasswordChange('/painel', false)).toBe(false)
  })
})
