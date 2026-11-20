import { describe, it, expect } from 'vitest'
import { blockSwitchMessage, closeBlockError } from './blocks'

describe('blockSwitchMessage', () => {
  it('asks to switch from the active block', () => {
    expect(blockSwitchMessage('Bloco 2', 'Bloco 3'))
      .toBe('Ativar Bloco 3? O Bloco 2 será encerrado e as novas mentorias passam a ser registradas no Bloco 3.')
  })
  it('asks to activate when none is active', () => {
    expect(blockSwitchMessage(null, 'Bloco 3')).toBe('Ativar Bloco 3? As novas mentorias passam a ser registradas nele.')
  })
  it('asks to close the active block', () => {
    expect(blockSwitchMessage('Bloco 2', null)).toBe('Encerrar Bloco 2? Os mentores não poderão registrar mentorias até outro bloco ser ativado.')
  })
})

describe('closeBlockError', () => {
  it('accepts the active block of the selected event', () => {
    expect(closeBlockError({ eventId: 1, active: true }, 1)).toBeNull()
  })
  it('refuses a block from another event (another tab switched the selected event)', () => {
    expect(closeBlockError({ eventId: 2, active: true }, 1)).toBe('Bloco inválido para este evento.')
    expect(closeBlockError(undefined, 1)).toBe('Bloco inválido para este evento.')
  })
  it('refuses a block that is no longer active', () => {
    expect(closeBlockError({ eventId: 1, active: false }, 1)).toBe('Este bloco já foi encerrado.')
  })
})
