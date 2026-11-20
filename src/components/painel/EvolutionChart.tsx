import { describeEvolution, chartLayout, CHART_PAD as PAD, CHART_ROW as ROW, STATUS_LABEL, type EvolutionPoint, smoothPath } from '@/lib/evolution'

const STATUS_COLOR: Record<string, string> = {
  ok: '#16A34A', attention: '#CA8A04', emergency: '#DC2626', flying: '#2563EB',
}
const NAVY = '#000222'
const ORANGE = '#FF7F00'


function truncate(t: string, max: number) {
  return t.length > max ? t.slice(0, max - 1) + '…' : t
}
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
  const { W, H, col, labeled } = chartLayout(n, S, fit)
  const plotW = W - PAD.l - PAD.r
  const x = (i: number) => (n === 1 ? PAD.l + plotW / 2 : PAD.l + 12 + i * col)
  const showLabel = new Set(labeled)
  const r = col < 18 ? 4.5 : 7 // pontos menores quando estão muito próximos (impressão de séries longas)
  const y = (stepIndex: number) => PAD.t + 4 + (S - 1 - stepIndex) * ROW

  const d = smoothPath(points.map((p, i) => ({ x: x(i), y: y(p.stepIndex) })))

  const description = describeEvolution(points)

  return (
    <figure className="m-0">
      <div className="flex">
      {/* Eixo das etapas fica fixo à esquerda, fora da área rolável */}
      <svg width={PAD.l} height={H} viewBox={`0 0 ${PAD.l} ${H}`} aria-hidden="true" className="shrink-0 block">
        {steps.map((s, i) => (
          <text key={s.id} x={PAD.l - 10} y={y(i) + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#64748B">
            <title>{`${i + 1} — ${s.label}`}</title>{i + 1}
          </text>
        ))}
      </svg>
      {/* direction: rtl faz o quadro rolável abrir no fim (mentorias mais recentes) sem precisar de JS */}
      <div className={fit ? 'min-w-0' : 'overflow-x-auto min-w-0 pr-1'} style={fit ? undefined : { direction: 'rtl' }}>
        {/* Desenhado em pixels reais (sem escala) para o texto manter o tamanho */}
        <svg viewBox={`${PAD.l} 0 ${W - PAD.l} ${H}`} width={W - PAD.l} height={H}
          role="img" aria-label={`Evolução da equipe: ${description}`} className="block" style={{ direction: 'ltr', maxWidth: 'none' }}>
          {steps.map((s, i) => (
            <line key={s.id} x1={PAD.l} x2={W - PAD.r} y1={y(i)} y2={y(i)} stroke="#E2E8F0" strokeDasharray={i === 0 ? undefined : '3 4'} />
          ))}
          <path d={d} fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <g key={i}>
              {p.source === 'organization'
                ? <circle cx={x(i)} cy={y(p.stepIndex)} r={r - 1.5} fill="#fff" stroke={NAVY} strokeWidth="2.5" />
                : <circle cx={x(i)} cy={y(p.stepIndex)} r={r} fill={STATUS_COLOR[p.status ?? ''] ?? '#94A3B8'} stroke="#fff" strokeWidth="2.5" />}
              <title>{pointTitle(p)}</title>
              {showLabel.has(i) && (
                <text x={x(i)} y={H - 10} textAnchor={i === n - 1 && n > 1 ? 'end' : i === 0 && n > 1 ? 'start' : 'middle'} fontSize="11" fill="#64748B">
                  {truncate(p.blockLabel ?? fmtShort(p.at), 12)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
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
