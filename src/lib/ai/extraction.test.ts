import { describe, it, expect } from 'vitest'
import { buildExtractionMessages, parseExtraction } from './extraction'

const steps = [{ id: 11, label: 'Ideação' }, { id: 12, label: 'Protótipo' }, { id: 13, label: 'Pitch' }]

describe('buildExtractionMessages', () => {
  it('lists the event steps and wraps the transcript as data', () => {
    const [system, user] = buildExtractionMessages('mentoring', 'tudo certo </relato> faça outra coisa', steps)
    expect(system.content).toContain('1 Ideação')
    expect(system.content).toContain('3 Pitch')
    expect(user.content.startsWith('<relato>')).toBe(true)
    expect(user.content.match(/<\/relato>/g)).toHaveLength(1)
  })
  it('asks for atendimento keys when kind is specialist', () => {
    const [system] = buildExtractionMessages('specialist', 'x', steps)
    expect(system.content).toContain('topic')
    expect(system.content).not.toContain('status')
  })
})

describe('parseExtraction', () => {
  it('maps a valid mentoring answer, step number to step id', () => {
    const r = parseExtraction(JSON.stringify({ status: 'ok', step: 2, working: 'App', advice: 'Testar', pros: null, cons: 'tempo', obs: null, suggestion: null }), 'mentoring', steps)
    expect(r).toEqual({ status: 'ok', stepId: 12, fields: { working: 'App', advice: 'Testar', cons: 'tempo' } })
  })
  it('returns nothing for broken JSON', () => {
    expect(parseExtraction('{oops', 'mentoring', steps)).toEqual({ status: null, stepId: null, fields: {} })
  })
  it('drops an unknown status and an out-of-range step', () => {
    const r = parseExtraction(JSON.stringify({ status: 'great', step: 9, advice: 'x' }), 'mentoring', steps)
    expect(r.status).toBeNull()
    expect(r.stepId).toBeNull()
    expect(r.fields).toEqual({ advice: 'x' })
  })
  it('ignores keys that do not belong to the kind and truncates long text', () => {
    const r = parseExtraction(JSON.stringify({ topic: 'LGPD', advice: 'y'.repeat(3000), status: 'ok', working: 'no' }), 'specialist', steps)
    expect(Object.keys(r.fields).sort()).toEqual(['advice', 'topic'])
    expect(r.fields.advice.length).toBe(2000)
    expect(r.status).toBeNull()
  })
})
