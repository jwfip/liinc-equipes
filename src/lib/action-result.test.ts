import { describe, it, expect } from 'vitest'
import { toActionError } from './action-result'

describe('toActionError', () => {
  it('maps postgres unique violation to a readable message', () => {
    expect(toActionError({ code: '23505' })).toEqual({ ok: false, error: 'Registro já existe.' })
  })
  it('maps unique violation nested in cause', () => {
    expect(toActionError({ cause: { code: '23505' } })).toEqual({ ok: false, error: 'Registro já existe.' })
  })
  it('keeps Error messages', () => {
    expect(toActionError(new Error('Acesso negado'))).toEqual({ ok: false, error: 'Acesso negado' })
  })
  it('falls back to a generic message', () => {
    expect(toActionError(42)).toEqual({ ok: false, error: 'Erro inesperado. Tente novamente.' })
  })
  it('maps foreign key violations to a readable message', () => {
    expect(toActionError({ cause: { code: '23503' } })).toEqual({ ok: false, error: 'Não é possível concluir: há registros ligados a este item.' })
  })
})
