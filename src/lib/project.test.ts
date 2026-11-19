import { describe, it, expect } from 'vitest'
import { currentProject, projectSince, recentPivot, type ProjectRow } from './project'

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
