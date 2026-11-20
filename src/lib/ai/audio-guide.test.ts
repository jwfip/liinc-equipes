import { describe, it, expect } from 'vitest'
import { AUDIO_GUIDE } from './audio-guide'
import { buildExtractionMessages } from './extraction'

const steps = [{ id: 1, label: 'Ideação' }]

describe('AUDIO_GUIDE', () => {
  it('has 9 items for mentorias and 3 for atendimentos', () => {
    expect(AUDIO_GUIDE.mentoring).toHaveLength(9)
    expect(AUDIO_GUIDE.specialist).toHaveLength(3)
  })
  it.each(['mentoring', 'specialist'] as const)('asks only for fields the %s extraction knows', (kind) => {
    const system = buildExtractionMessages(kind, 'x', steps)[0].content
    for (const item of AUDIO_GUIDE[kind]) expect(system).toContain(`${item.key} (`)
  })
})
