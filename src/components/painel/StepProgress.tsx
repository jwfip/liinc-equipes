import type { Step } from '@/lib/constants'

interface Props {
  steps:    Step[]
  current:  Step | null
  size?:    'sm' | 'md'
}

/** Barra de progresso pelas etapas do evento. */
export default function StepProgress({ steps, current, size = 'md' }: Props) {
  const idx = current ? steps.findIndex(s => s.id === current.id) : -1
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0">Etapa do processo</span>
        <span className="text-[11px] font-bold text-orange text-right truncate">
          {idx >= 0 ? `${idx + 1} — ${steps[idx].label}` : current ? current.label : 'Não informada'}
        </span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {steps.map((s, i) => (
          <div key={s.id} title={s.label}
            className={`flex-1 rounded-full ${size === 'sm' ? 'h-1' : 'h-1.5'} ${
              i < idx ? 'bg-green-500' : i === idx ? 'bg-orange' : 'bg-slate-200'}`} />
        ))}
      </div>
    </div>
  )
}
