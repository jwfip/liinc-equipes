import { describe, it, expect } from 'vitest'
import { readProjectInput } from './project-input'

describe('readProjectInput — team without project', () => {
  it('requires the project description', () => {
    expect(() => readProjectInput({ pivoted: false, description: '  ' }, false)).toThrow('Descreva o projeto da equipe.')
  })
  it('creates the initial project, trimmed and capped at 1000 chars', () => {
    expect(readProjectInput({ pivoted: false, description: '  App X ' }, false)).toEqual({ kind: 'initial', description: 'App X' })
    expect(readProjectInput({ pivoted: false, description: 'a'.repeat(1200) }, false)!.description).toHaveLength(1000)
  })
})

describe('readProjectInput — team with project', () => {
  it('keeps the current project when the team did not pivot', () => {
    expect(readProjectInput({ pivoted: false, description: 'ignorado' }, true)).toBeNull()
  })
  it('requires the new project on a pivot', () => {
    expect(() => readProjectInput({ pivoted: true, description: null }, true)).toThrow('Descreva o novo projeto da equipe.')
  })
  it('records a pivot', () => {
    expect(readProjectInput({ pivoted: true, description: 'App Y' }, true)).toEqual({ kind: 'pivot', description: 'App Y' })
  })
})
