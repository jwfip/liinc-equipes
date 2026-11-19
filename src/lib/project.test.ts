import { describe, it, expect } from 'vitest'
import { currentProject, projectSince, recentPivot, projectInfoByTeam, projectContext, recentBlockIds, type ProjectRow } from './project'

const row = (id: number, kind: ProjectRow['kind'], at: string, extra: Partial<ProjectRow> = {}): ProjectRow => ({
  id, teamId: 't1', description: `p${id}`, kind, recordId: null, createdAt: at, author: null, ...extra,
})

describe('currentProject', () => {
  it('returns null for a team without project', () => {
    expect(currentProject([row(1, 'initial', '2026-01-01')], 't2')).toBeNull()
  })
  it('returns the latest row, a correction included', () => {
    const rows = [row(1, 'initial', '2026-01-01'), row(2, 'pivot', '2026-01-02'), row(3, 'correction', '2026-01-03')]
    expect(currentProject(rows, 't1')?.description).toBe('p3')
  })
  it('breaks timestamp ties by id', () => {
    const rows = [row(2, 'initial', '2026-01-01'), row(1, 'initial', '2026-01-01')]
    expect(currentProject(rows, 't1')?.id).toBe(2)
  })
})

describe('projectSince', () => {
  it('ignores corrections when dating the current project', () => {
    const rows = [row(1, 'initial', '2026-01-01'), row(2, 'pivot', '2026-01-02'), row(3, 'correction', '2026-01-03')]
    expect(projectSince(rows, 't1')?.id).toBe(2)
  })
})

describe('recentPivot', () => {
  const rows = [row(1, 'initial', '2026-01-01', { recordId: 'r1' }), row(2, 'pivot', '2026-01-02', { recordId: 'r2' })]
  const recordBlock = new Map([['r1', 1], ['r2', 2]])
  it('finds a pivot made in a recent block', () => {
    expect(recentPivot(rows, 't1', recordBlock, [2, 3])?.id).toBe(2)
  })
  it('ignores a pivot outside the window', () => {
    expect(recentPivot(rows, 't1', recordBlock, [3, 4])).toBeNull()
  })
})

describe('projectInfoByTeam', () => {
  it('gives each team its current text dated by the latest initial or pivot', () => {
    const rows = [
      row(1, 'initial', '2026-01-01T12:00:00Z', { author: { name: 'Ana' } }),
      row(2, 'correction', '2026-01-03T12:00:00Z', { author: { name: 'Fac' } }),
      row(3, 'initial', '2026-01-02T12:00:00Z', { teamId: 't2' }),
    ]
    const info = projectInfoByTeam(rows)
    expect(info.t1).toEqual({ description: 'p2', since: '2026-01-01T12:00:00.000Z', author: 'Ana' })
    expect(info.t2).toEqual({ description: 'p3', since: '2026-01-02T12:00:00.000Z', author: null })
  })
})

describe('projectContext', () => {
  it('gives the current text and the pivots in order, for the AI prompts', () => {
    const rows = [row(1, 'initial', '2026-01-01'), row(2, 'pivot', '2026-01-02'), row(3, 'correction', '2026-01-03')]
    expect(projectContext(rows, 't1')).toEqual({ current: 'p3', pivots: [{ at: '2026-01-02', description: 'p2' }] })
  })
  it('is empty for a team without project', () => {
    expect(projectContext([], 't1')).toEqual({ current: null, pivots: [] })
  })
})

describe('recentBlockIds', () => {
  const blocks = [{ id: 1, date: '2026-01-01' }, { id: 2, date: '2026-01-02' }, { id: 3, date: '2026-01-03' }, { id: 4, date: '2026-02-01' }]
  it('takes the last two blocks that already started', () => {
    expect(recentBlockIds(blocks, '2026-01-03')).toEqual([2, 3])
  })
  it('ignores future blocks and works with fewer blocks', () => {
    expect(recentBlockIds(blocks, '2026-01-01')).toEqual([1])
  })
})
