export const REPORT_SECTIONS = ['cons', 'obs', 'suggestion', 'atendimentos', 'timeline', 'chart'] as const
export type ReportSection = (typeof REPORT_SECTIONS)[number]

/** Notas internas da organização ficam fora do relatório da empresa por padrão. */
export const DEFAULT_HIDDEN: ReportSection[] = ['obs', 'suggestion']

export const SECTION_LABEL: Record<ReportSection, string> = {
  cons: 'A melhorar', obs: 'Observações para facilitadores', suggestion: 'Sugestão ao próximo mentor',
  atendimentos: 'Atendimentos de especialistas', timeline: 'Linha do tempo das mentorias', chart: 'Gráfico de evolução',
}

/** `?ocultar=` da URL → seções ocultas. Sem parâmetro = padrão; vazio = nenhuma; desconhecidas ignoradas. */
export function parseHidden(param: string | string[] | undefined): Set<ReportSection> {
  if (param === undefined) return new Set(DEFAULT_HIDDEN)
  const raw = (Array.isArray(param) ? param.join(',') : param).split(',').map(s => s.trim())
  return new Set(raw.filter((s): s is ReportSection => (REPORT_SECTIONS as readonly string[]).includes(s)))
}

export function hiddenToQuery(hidden: Set<ReportSection>): string {
  return `ocultar=${REPORT_SECTIONS.filter(s => hidden.has(s)).join(',')}`
}

/** Equipes a gerar em lote: pula resumos editados pelo admin, a menos que peça para substituir. */
export function teamsToGenerate(teams: { id: string }[], finals: { teamId: string; editedByAdmin: boolean }[], overwriteEdited: boolean): string[] {
  const edited = new Set(finals.filter(f => f.editedByAdmin).map(f => f.teamId))
  return teams.map(t => t.id).filter(id => overwriteEdited || !edited.has(id))
}
