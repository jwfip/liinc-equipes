import { describe, it, expect } from 'vitest'
import { parseHidden, hiddenToQuery, teamsToGenerate, DEFAULT_HIDDEN } from './options'

describe('parseHidden', () => {
  it('uses the default when the parameter is absent', () => {
    expect(Array.from(parseHidden(undefined)).sort()).toEqual([...DEFAULT_HIDDEN].sort())
  })
  it('hides nothing when the parameter is empty', () => {
    expect(parseHidden('').size).toBe(0)
  })
  it('ignores unknown keys and keeps valid ones', () => {
    expect(Array.from(parseHidden('xyz,,cons'))).toEqual(['cons'])
    expect(Array.from(parseHidden(['cons', 'chart'])).sort()).toEqual(['chart', 'cons'])
  })
})

describe('hiddenToQuery', () => {
  it('round-trips through parseHidden', () => {
    const h = new Set(['cons', 'atendimentos'] as const)
    const param = (q: string) => new URLSearchParams(q).get('ocultar') ?? undefined
    expect(Array.from(parseHidden(param(hiddenToQuery(h)))).sort()).toEqual(['atendimentos', 'cons'])
    expect(parseHidden(param(hiddenToQuery(new Set()))).size).toBe(0)
  })
})

describe('teamsToGenerate', () => {
  const teams = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const finals = [{ teamId: 'a', editedByAdmin: true }, { teamId: 'b', editedByAdmin: false }]
  it('skips teams whose final summary was edited by the admin', () => {
    expect(teamsToGenerate(teams, finals, false)).toEqual(['b', 'c'])
  })
  it('includes edited ones only when asked to overwrite', () => {
    expect(teamsToGenerate(teams, finals, true)).toEqual(['a', 'b', 'c'])
  })
})
