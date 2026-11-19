import { describeEvolution, STATUS_LABEL, type EvolutionPoint } from '@/lib/evolution'

const STATUS_COLOR: Record<string, string> = {
  ok: '#16A34A', attention: '#CA8A04', emergency: '#DC2626', flying: '#2563EB',
}
const NAVY = '#000222'
const ORANGE = '#F47B20'

const PAD = { l: 34, r: 18, t: 14, b: 34 }
const ROW = 30       // altura por etapa
const COL = 56       // largura por ponto
const MAX_X_LABELS = 6

function fmtShort(at: number) {
  return new Date(at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function fmtFull(at: number) {
  return new Date(at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function pointTitle(p: EvolutionPoint) {
  const base = `${p.stepIndex + 1} — ${p.stepLabel} · ${fmtFull(p.at)}`
  return p.source === 'organization'
    ? `${base} · ajustada pela organização`
    : `${base} · ${STATUS_LABEL[p.status ?? ''] ?? ''}${p.who ? ` · ${p.who}` : ''}${p.blockLabel ? ` · ${p.blockLabel}` : ''}`
}

/** Gráfico de evolução da equipe: etapa ao longo do tempo (linha em degraus) e status de cada mentoria. */
/** `fit`: sem rolagem (gráfico encolhe para caber) — usado no relatório impresso. */
export default function EvolutionChart({ steps, points, fit = false }: { steps: { id: number; label: string }[]; points: EvolutionPoint[]; fit?: boolean }) {
  if (points.length === 0 || steps.length === 0) {
    return <p className="text-xs text-slate-400 italic">Sem dados de evolução ainda.</p>
  }

  const n = points.length
  const S = steps.length
  const W = Math.max(360, PAD.l + PAD.r + (n - 1) * COL + 24)
  const H = PAD.t + PAD.b + (S - 1) * ROW + 8
  const plotW = W - PAD.l - PAD.r
  const x = (i: number) => (n === 1 ? PAD.l + plotW / 2 : PAD.l + 12 + (i * (plotW - 24)) / (n - 1))
  const y = (stepIndex: number) => PAD.t + 4 + (S - 1 - stepIndex) * ROW

  let d = `M ${x(0)} ${y(points[0].stepIndex)}`
  points.slice(1).forEach((p, i) => { d += ` H ${x(i + 1)} V ${y(p.stepIndex)}` })

  const every = Math.max(1, Math.ceil(n / MAX_X_LABELS))
  const description = describeEvolution(points)

  return (
    <figure className="m-0">
      {/* direction: rtl faz o quadro rolável abrir no fim (mentorias mais recentes) sem precisar de JS */}
      <div className={fit ? '' : 'overflow-x-auto -mx-1 px-1'} style={fit ? undefined : { direction: 'rtl' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%"
          role="img" aria-label={`Evolução da equipe: ${description}`} className="block" style={fit ? undefined : { direction: 'ltr', minWidth: Math.min(W, 300 + n * 22) }}>
          {steps.map((s, i) => (
            <g key={s.id}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(i)} y2={y(i)} stroke="#E2E8F0" strokeDasharray={i === 0 ? undefined : '3 4'} />
              <text x={PAD.l - 10} y={y(i) + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#64748B">
                <title>{`${i + 1} — ${s.label}`}</title>{i + 1}
              </text>
            </g>
          ))}
          <path d={d} fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <g key={i}>
              {p.source === 'organization'
                ? <circle cx={x(i)} cy={y(p.stepIndex)} r="5.5" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
                : <circle cx={x(i)} cy={y(p.stepIndex)} r="7" fill={STATUS_COLOR[p.status ?? ''] ?? '#94A3B8'} stroke="#fff" strokeWidth="2.5" />}
              <title>{pointTitle(p)}</title>
              {(i % every === 0 || i === n - 1) && (
                <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#64748B">
                  {p.blockLabel ?? fmtShort(p.at)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
        {Object.entries(STATUS_COLOR).map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{STATUS_LABEL[k]}</span>
        ))}
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: NAVY }} />Ajuste da organização</span>
      </figcaption>
      <details className="mt-2 print:hidden">
        <summary className="text-[11px] font-bold text-slate-500 cursor-pointer">Ver dados</summary>
        <ol className="mt-1 text-[12px] text-slate-600 list-decimal pl-5 space-y-0.5">
          {points.map((p, i) => <li key={i}>{pointTitle(p)}</li>)}
        </ol>
      </details>
    </figure>
  )
}
