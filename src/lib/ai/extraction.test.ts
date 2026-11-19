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
    expect(r).toEqual({ status: 'ok', stepId: 12, fields: { working: 'App', advice: 'Testar', cons: 'tempo' }, project: null, pivot: false })
  })
  it('returns nothing for broken JSON', () => {
    expect(parseExtraction('{oops', 'mentoring', steps)).toEqual({ status: null, stepId: null, fields: {}, project: null, pivot: false })
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

import { isUnclearTranscript, isEmptyExtraction } from './extraction'

describe('isUnclearTranscript', () => {
  it('flags too-short text and known Whisper hallucinations on silence', () => {
    expect(isUnclearTranscript(' E aí')).toBe(true)
    expect(isUnclearTranscript('Legendas pela comunidade Amara.org')).toBe(true)
    expect(isUnclearTranscript('Obrigado por assistir.')).toBe(true)
    expect(isUnclearTranscript('Inscreva-se no canal!')).toBe(true)
  })
  it('accepts a real report', () => {
    expect(isUnclearTranscript('A equipe está no protótipo e orientei a testar com usuários.')).toBe(false)
  })
})

describe('isEmptyExtraction', () => {
  it('is empty when nothing usable came back', () => {
    expect(isEmptyExtraction({ status: null, stepId: null, fields: {} })).toBe(true)
    expect(isEmptyExtraction({ status: 'ok', stepId: null, fields: {} })).toBe(false)
    expect(isEmptyExtraction({ status: null, stepId: null, fields: { advice: 'x' } })).toBe(false)
    expect(isEmptyExtraction({ status: null, stepId: null, fields: {}, project: 'App X' })).toBe(false)
  })
})

describe('parseExtraction — project and pivot', () => {
  const st = [{ id: 1 }, { id: 2 }]
  it('reads the project and the pivot flag for mentorias', () => {
    const r = parseExtraction('{"project":"App X","pivot":true}', 'mentoring', st)
    expect(r.project).toBe('App X')
    expect(r.pivot).toBe(true)
  })
  it('treats a non-boolean pivot as false', () => {
    expect(parseExtraction('{"pivot":"sim"}', 'mentoring', st).pivot).toBe(false)
  })
  it('has no project for atendimentos', () => {
    const r = parseExtraction('{"project":"App X","pivot":true}', 'specialist', st)
    expect(r.project).toBeNull()
    expect(r.pivot).toBe(false)
  })
})
