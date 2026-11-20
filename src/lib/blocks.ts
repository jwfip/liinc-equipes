/** Texto da confirmação antes de o facilitador mudar o bloco. `next = null` é encerrar o atual. */
export function blockSwitchMessage(current: string | null, next: string | null): string {
  if (next === null) return `Encerrar ${current}? Os mentores não poderão registrar mentorias até outro bloco ser ativado.`
  if (current === null) return `Ativar ${next}? As novas mentorias passam a ser registradas nele.`
  return `Ativar ${next}? O ${current} será encerrado e as novas mentorias passam a ser registradas no ${next}.`
}
