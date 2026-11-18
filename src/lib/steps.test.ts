import { describe, it, expect } from 'vitest'
import { swapPositions } from './steps'

const s = (id: number, position: number) => ({ id, position })

describe('swapPositions', () => {
  it('moves an item up by swapping with its predecessor', () => {
    expect(swapPositions([s(10, 1), s(20, 2), s(30, 3)], 20, 'up'))
      .toEqual([{ id: 20, position: 1 }, { id: 10, position: 2 }])
  })
  it('returns [] when moving the first item up', () => {
    expect(swapPositions([s(10, 1), s(20, 2)], 10, 'up')).toEqual([])
  })
  it('returns [] when moving the last item down', () => {
    expect(swapPositions([s(10, 1), s(20, 2)], 20, 'down')).toEqual([])
  })
  it('swaps non-contiguous positions', () => {
    expect(swapPositions([s(10, 1), s(20, 4), s(30, 7)], 10, 'down'))
      .toEqual([{ id: 10, position: 4 }, { id: 20, position: 1 }])
  })
  it('works with unsorted input', () => {
    expect(swapPositions([s(30, 3), s(10, 1), s(20, 2)], 30, 'up'))
      .toEqual([{ id: 30, position: 2 }, { id: 20, position: 3 }])
  })
})
