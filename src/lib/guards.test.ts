import { describe, it, expect } from 'vitest'
import { sessionBlockReason } from './session-rules'

describe('sessionBlockReason', () => {
  it('blocks when there is no session', () => {
    expect(sessionBlockReason(null)).toBe('Não autenticado')
  })
  it('blocks sessions that still must change the password', () => {
    expect(sessionBlockReason({ user: { mustChangePassword: true } })).toBe('Defina sua senha antes de continuar.')
  })
  it('allows a normal session', () => {
    expect(sessionBlockReason({ user: { mustChangePassword: false } })).toBeNull()
  })
})
