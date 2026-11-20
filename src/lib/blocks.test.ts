import { describe, it, expect } from 'vitest'
import { blockSwitchMessage } from './blocks'

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
