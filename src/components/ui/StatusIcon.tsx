import { Route, TriangleAlert, Siren, Rocket, type LucideProps } from 'lucide-react'

const ICONS = { ok: Route, attention: TriangleAlert, emergency: Siren, flying: Rocket } as const
const LABELS: Record<string, string> = { ok: 'No caminho', attention: 'Atenção', emergency: 'Emergência', flying: 'Voando' }

/** Ícone do status (decorativo: o texto do status sempre acompanha). */
export function StatusIcon({ status, ...props }: { status: string | null | undefined } & LucideProps) {
  const Icon = ICONS[status as keyof typeof ICONS]
  return Icon ? <Icon aria-hidden="true" size={14} strokeWidth={2.25} {...props} /> : null
}

/** Ícone + nome do status. */
export function StatusLabel({ status, size = 14 }: { status: string | null | undefined; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusIcon status={status} size={size} />
      {LABELS[status ?? ''] ?? status}
    </span>
  )
}
