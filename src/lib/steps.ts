export type StepPos = { id: number; position: number }

/** Troca a posição da etapa com a vizinha na direção indicada. Retorna só os itens alterados. */
export function swapPositions(steps: StepPos[], stepId: number, dir: 'up' | 'down'): StepPos[] {
  const sorted = [...steps].sort((a, b) => a.position - b.position)
  const i = sorted.findIndex(s => s.id === stepId)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= sorted.length) return []
  return [
    { id: sorted[i].id, position: sorted[j].position },
    { id: sorted[j].id, position: sorted[i].position },
  ]
}
