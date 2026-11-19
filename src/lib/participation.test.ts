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

describe('registrationError by record kind', () => {
  it('rejects a specialist registering a mentoring', () => {
    expect(registrationError({ ...base, role: 'specialist' }, 'mentoring')).toBe('Especialistas registram atendimentos, não mentorias.')
  })
  it('rejects a mentor registering an atendimento', () => {
    expect(registrationError(base, 'specialist')).toBe('Mentores registram mentorias, não atendimentos.')
  })
  it('allows a specialist registering an atendimento', () => {
    expect(registrationError({ ...base, role: 'specialist' }, 'specialist')).toBeNull()
  })
  it('defaults to mentoring', () => {
    expect(registrationError({ ...base, role: 'specialist' })).toBe('Especialistas registram atendimentos, não mentorias.')
  })
})
