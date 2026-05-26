export const STATUS_OPTIONS = [
  { value: 'ok',        label: '🛣️ No caminho',  color: 'green'  },
  { value: 'attention', label: '⚠️ Atenção',      color: 'yellow' },
  { value: 'emergency', label: '🚨 Emergência',   color: 'red'    },
  { value: 'flying',    label: '🚀 Voando',       color: 'blue'   },
] as const

export type StatusValue = 'ok' | 'attention' | 'emergency' | 'flying'

export const STATUS_META: Record<StatusValue, {
  label:       string
  badgeClass:  string
  borderClass: string
  bgClass:     string
}> = {
  ok:        { label: '🛣️ No caminho',  badgeClass: 'badge-ok',        borderClass: 'border-l-green-500',  bgClass: 'bg-green-600/10'  },
  attention: { label: '⚠️ Atenção',      badgeClass: 'badge-attention', borderClass: 'border-l-yellow-500', bgClass: 'bg-yellow-600/10' },
  emergency: { label: '🚨 Emergência',   badgeClass: 'badge-emergency', borderClass: 'border-l-red-500',    bgClass: 'bg-red-600/10'    },
  flying:    { label: '🚀 Voando',       badgeClass: 'badge-flying',    borderClass: 'border-l-blue-500',   bgClass: 'bg-blue-600/10'   },
}

export const STATUS_ORDER: StatusValue[] = ['emergency', 'attention', 'ok', 'flying']

export type RecordWithRelations = {
  id:        string
  teamId:    string
  mentorId:  string
  blockId:   number
  status:    string
  working:   string | null
  advice:    string | null
  pros:      string | null
  cons:      string | null
  obs:       string | null
  suggestion: string | null
  createdAt: string | null
  team:   { id: string; number: number; name: string; active: boolean } | null
  mentor: { id: string; name: string } | null
  block:  { id: number; label: string; date: string } | null
}

export function getLatestByTeam(records: RecordWithRelations[]) {
  return records.reduce<Record<string, RecordWithRelations>>((acc, r) => {
    const prev = acc[r.teamId]
    if (
      !prev ||
      r.blockId > prev.blockId ||
      (r.blockId === prev.blockId && (r.createdAt ?? '') > (prev.createdAt ?? ''))
    ) {
      acc[r.teamId] = r
    }
    return acc
  }, {})
}
