import { describe, it, expect } from 'vitest'
import { registrationError, canSeePrivateNotes, canCorrectProject, roleLabel } from './participation'

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

describe('facilitator role', () => {
  const msg = 'Facilitadores acompanham o evento e não registram mentorias nem atendimentos.'
  it('blocks a facilitator from registering mentorias', () => {
    expect(registrationError({ ...base, role: 'facilitator' }, 'mentoring')).toBe(msg)
  })
  it('blocks a facilitator from registering atendimentos', () => {
    expect(registrationError({ ...base, role: 'facilitator' }, 'specialist')).toBe(msg)
  })
})

describe('canSeePrivateNotes', () => {
  it('lets admin and facilitator see private notes', () => {
    expect(canSeePrivateNotes({ isAdmin: true, role: null })).toBe(true)
    expect(canSeePrivateNotes({ isAdmin: false, role: 'facilitator' })).toBe(true)
  })
  it('hides private notes from mentors, specialists and non-members', () => {
    expect(canSeePrivateNotes({ isAdmin: false, role: 'mentor' })).toBe(false)
    expect(canSeePrivateNotes({ isAdmin: false, role: 'specialist' })).toBe(false)
    expect(canSeePrivateNotes({ isAdmin: false, role: null })).toBe(false)
  })
})

describe('canCorrectProject', () => {
  const active = { id: 1, active: true }, closed = { id: 1, active: false }
  it('lets a facilitator correct only in an active event', () => {
    expect(canCorrectProject({ isAdmin: false, role: 'facilitator', event: active })).toBe(true)
    expect(canCorrectProject({ isAdmin: false, role: 'facilitator', event: closed })).toBe(false)
  })
  it('lets admin correct even in a closed event', () => {
    expect(canCorrectProject({ isAdmin: true, role: null, event: closed })).toBe(true)
  })
  it('refuses mentors and missing events', () => {
    expect(canCorrectProject({ isAdmin: false, role: 'mentor', event: active })).toBe(false)
    expect(canCorrectProject({ isAdmin: true, role: null, event: null })).toBe(false)
  })
})

describe('deactivated facilitator', () => {
  it('loses access to private notes and project correction', () => {
    expect(canSeePrivateNotes({ isAdmin: false, role: 'facilitator', mentorActive: false })).toBe(false)
    expect(canCorrectProject({ isAdmin: false, role: 'facilitator', mentorActive: false, event: { active: true } })).toBe(false)
  })
})

describe('roleLabel', () => {
  it('names every role', () => {
    expect(roleLabel('mentor')).toBe('Mentor')
    expect(roleLabel('specialist')).toBe('Especialista')
    expect(roleLabel('facilitator')).toBe('Facilitador')
    expect(roleLabel(null)).toBeNull()
  })
})
