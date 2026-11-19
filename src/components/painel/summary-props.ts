import { isSummaryStale } from '@/lib/ai/summary-prompt'
import type { RecordWithRelations } from '@/lib/constants'
import type { TeamSummary } from './SummaryBox'

const time = (d: string | Date | null) => (d ? new Date(d).getTime() : 0)

/** Props do SummaryBox de uma equipe: resumo guardado + se está desatualizado em relação ao registro mais recente. */
export function summaryBoxProps(
  records: RecordWithRelations[], summaries: TeamSummary[], teamId: string, kind: 'mentoring' | 'specialist', onRefreshed: () => void,
) {
  const latest = records
    .filter(r => r.teamId === teamId && r.kind === kind)
    .reduce<RecordWithRelations | undefined>((a, r) => (!a || time(r.createdAt) > time(a.createdAt) ? r : a), undefined)
  const summary = summaries.find(x => x.teamId === teamId && x.kind === kind)
  return {
    summary, stale: isSummaryStale(summary, latest?.id ?? null), hasRecords: !!latest,
    latestAt: latest ? time(latest.createdAt) : undefined, teamId, kind, onRefreshed,
  }
}
