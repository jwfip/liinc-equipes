import { describe, it, expect } from 'vitest'
import { registrationError } from './participation'

const base = { event: { id: 1, active: true }, role: 'mentor' as const, mentorId: 'm1', mentorActive: true }

describe('registrationError', () => {
  it('allows an active mentor in an active event', () => {
    expect(registrationError(base)).toBeNull()
  })
  it('rejects when no event is selected', () => {
    expect(registrationError({ ...base, event: null })).toBe('Nenhum evento selecionado.')
  })
  it('rejects a closed event', () => {
    expect(registrationError({ ...base, event: { id: 1, active: false } })).toBe('Este evento está encerrado.')
  })
  it('rejects a non-participant', () => {
    expect(registrationError({ ...base, role: null })).toBe('Você não participa deste evento.')
  })
  it('rejects a deactivated mentor', () => {
    expect(registrationError({ ...base, mentorActive: false })).toBe('Seu acesso de mentor está desativado.')
  })
})
