/** Texto da confirmação antes de o facilitador mudar o bloco. `next = null` é encerrar o atual. */
export function blockSwitchMessage(current: string | null, next: string | null): string {
  if (next === null) return `Encerrar ${current}? Os mentores não poderão registrar mentorias até outro bloco ser ativado.`
  if (current === null) return `Ativar ${next}? As novas mentorias passam a ser registradas nele.`
  return `Ativar ${next}? O ${current} será encerrado e as novas mentorias passam a ser registradas no ${next}.`
}

/**
 * Encerrar só o bloco que a tela mostra: ele precisa ser do evento selecionado e estar ativo.
 * Evita fechar o bloco de outro evento quando outra aba trocou o evento selecionado.
 */
export function closeBlockError(block: { eventId: number; active: boolean } | undefined, eventId: number): string | null {
  if (!block || block.eventId !== eventId) return 'Bloco inválido para este evento.'
  if (!block.active) return 'Este bloco já foi encerrado.'
  return null
}

/** O bloco precisa ser do evento (ativar pelo admin com id de outro evento encerrava o atual e não ativava nada). */
export function blockInEventError(block: { eventId: number } | undefined, eventId: number): string | null {
  return !block || block.eventId !== eventId ? 'Bloco inválido para este evento.' : null
}
