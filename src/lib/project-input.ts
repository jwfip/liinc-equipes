const MAX_PROJECT = 1000

/** Projeto a gravar junto com a mentoria: inicial (equipe sem projeto), pivô ou nada. Lança com mensagem legível. */
export function readProjectInput(
  input: { pivoted: boolean; description: string | null },
  hasProject: boolean,
): { kind: 'initial' | 'pivot'; description: string } | null {
  const description = (input.description ?? '').trim().slice(0, MAX_PROJECT)
  if (!hasProject) {
    if (!description) throw new Error('Descreva o projeto da equipe.')
    return { kind: 'initial', description }
  }
  if (!input.pivoted) return null
  if (!description) throw new Error('Descreva o novo projeto da equipe.')
  return { kind: 'pivot', description }
}
