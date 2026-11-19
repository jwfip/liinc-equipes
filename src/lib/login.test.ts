import { describe, it, expect } from 'vitest'
import { checkLogin, normalizeUsername, LOGIN_MESSAGES, loginMessage } from './login'

const now = new Date('2026-11-19T12:00:00Z')
const recent = Array.from({ length: 5 }, (_, i) => new Date(now.getTime() - (i + 1) * 60_000))
const verify = async (plain: string, hash: string) => hash === `hash:${plain}`
const user = { passwordHash: 'hash:certa-123' }

describe('checkLogin', () => {
  it('reports locked even with the right password', async () => {
    expect(await checkLogin({ user, password: 'certa-123', failures: recent, now, verify })).toEqual({ ok: false, reason: 'locked' })
  })
  it('reports invalid for an unknown user', async () => {
    expect(await checkLogin({ user: undefined, password: 'x', failures: [], now, verify })).toEqual({ ok: false, reason: 'invalid' })
  })
  it('reports no_password for a user without a hash', async () => {
    expect(await checkLogin({ user: { passwordHash: null }, password: 'x', failures: [], now, verify })).toEqual({ ok: false, reason: 'no_password' })
  })
  it('reports invalid for a wrong password', async () => {
    expect(await checkLogin({ user, password: 'errada', failures: [], now, verify })).toEqual({ ok: false, reason: 'invalid' })
  })
  it('accepts the right password', async () => {
    expect(await checkLogin({ user, password: 'certa-123', failures: [], now, verify })).toEqual({ ok: true })
  })
})

describe('normalizeUsername', () => {
  it('trims and lowercases', () => {
    expect(normalizeUsername('  Ana.Silva ')).toBe('ana.silva')
    expect(normalizeUsername(undefined)).toBe('')
  })
})

describe('LOGIN_MESSAGES', () => {
  it('has the exact user-facing messages', () => {
    expect(LOGIN_MESSAGES).toEqual({
      invalid: 'Usuário ou senha incorretos.',
      locked: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.',
      no_password: 'Sua senha ainda não foi definida. Fale com a organização.',
    })
  })
})

describe('checkLogin timing', () => {
  it('runs a password comparison even when the user does not exist', async () => {
    let calls = 0
    const counting = async (p: string, h: string) => { calls++; return verify(p, h) }
    await checkLogin({ user: undefined, password: 'x', failures: [], now, verify: counting })
    await checkLogin({ user: { passwordHash: null }, password: 'x', failures: [], now, verify: counting })
    expect(calls).toBe(2)
  })
})

describe('loginMessage', () => {
  it('falls back to the generic message for unknown or crafted codes', () => {
    expect(loginMessage('locked')).toBe(LOGIN_MESSAGES.locked)
    expect(loginMessage('__proto__')).toBe(LOGIN_MESSAGES.invalid)
    expect(loginMessage('constructor')).toBe(LOGIN_MESSAGES.invalid)
    expect(loginMessage(undefined)).toBe(LOGIN_MESSAGES.invalid)
  })
})
