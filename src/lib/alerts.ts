import { currentStepFor, getLatestByTeam, type StepChange } from './records'
import type { ProjectRow } from './project'

type Stamp = string | Date | null | undefined
type StepRef = { id: number; position: number; label: string }
const ts = (d: Stamp) => (d ? new Date(d).getTime() : 0)

export const STUCK_BLOCKS = 2
export const BEHIND_STEPS = 2
export const STATUS_SEVERITY: Record<string, number> = { flying: 0, ok: 1, attention: 2, emergency: 3 }
const STATUS_PT: Record<string, string> = { ok: 'No caminho', attention: 'Atenção', emergency: 'Emergência', flying: 'Voando' }

export type AlertCode = 'status' | 'worse' | 'stuck' | 'back' | 'behind' | 'absent'
export type TeamAlert = { code: AlertCode; text: string }

export type AlertRecord = {
  id: string; teamId: string; kind: string; blockId: number | null; status: string | null; createdAt: string | Date | null; step: StepRef | null
}
export type AlertInput = {
  teams:       { id: string }[]
  records:     AlertRecord[]
  stepChanges: StepChange[]
  projects:    ProjectRow[]
  /** Blocos do evento em ordem cronológica. */
  blocks:      { id: number; label: string; date: string; active: boolean }[]
  /** yyyy-mm-dd */
  today:       string
  /** Etapas do evento em ordem; quando vem, o número exibido é a ordem (1, 2, 3…) e não a `position` crua. */
  steps?:      { id: number }[]
}

/**
 * Bloco em que se espera que toda equipe já tenha tido mentoria: o anterior ao ativo; sem bloco ativo,
 * o último que de fato aconteceu (teve alguma mentoria) — blocos do mesmo dia ainda não realizados não contam.
 */
function checkpointBlock(blocks: AlertInput['blocks'], today: string, heldBlockIds: Set<number>) {
  const activeIdx = blocks.findIndex(b => b.active)
  if (activeIdx >= 0) return activeIdx > 0 ? blocks[activeIdx - 1] : null
  const held = blocks.filter(b => b.date <= today && heldBlockIds.has(b.id))
  return held[held.length - 1] ?? null
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Alertas por equipe para o facilitador: sinais de que a equipe pode estar ficando para trás.
 * Só mentorias contam. Cada alerta traz o motivo em texto, conferível no histórico.
 */
export function eventAlerts(input: AlertInput): Record<string, TeamAlert[]> {
  const { teams, stepChanges, projects, blocks, today, steps } = input
  const records = input.records.filter(r => r.kind === 'mentoring')
  const blockOrder = new Map(blocks.map((b, i) => [b.id, i]))
  const num = (s: StepRef) => {
    const i = steps ? steps.findIndex(x => x.id === s.id) : -1
    return i >= 0 ? i + 1 : s.position
  }
  const latestByTeam = getLatestByTeam(records, blockOrder)
  const current = new Map(teams.map(t => [t.id, currentStepFor(latestByTeam[t.id], stepChanges.filter(c => c.teamId === t.id)).step]))
  const groupMedian = median(teams.map(t => current.get(t.id)).filter((s): s is StepRef => !!s).map(num))
  const checkpoint = checkpointBlock(blocks, today, new Set(records.map(r => r.blockId).filter((id): id is number => id !== null)))

  const out: Record<string, TeamAlert[]> = {}
  for (const t of teams) {
    const alerts: TeamAlert[] = []
    const mine = records.filter(r => r.teamId === t.id)

    // Mentoria mais recente de cada bloco, na ordem dos blocos.
    const perBlock = Array.from(mine
      .filter(r => r.blockId !== null && blockOrder.has(r.blockId))
      .reduce((m, r) => {
        const prev = m.get(r.blockId!)
        if (!prev || ts(r.createdAt) > ts(prev.createdAt)) m.set(r.blockId!, r)
        return m
      }, new Map<number, AlertRecord>()).values())
      .sort((a, b) => blockOrder.get(a.blockId!)! - blockOrder.get(b.blockId!)!)
    const last = perBlock[perBlock.length - 1]
    const prev = perBlock[perBlock.length - 2]
    const latest = latestByTeam[t.id]
    const step = current.get(t.id) ?? null

    if (latest?.status === 'emergency' || latest?.status === 'attention') alerts.push({ code: 'status', text: STATUS_PT[latest.status] })

    if (prev?.status && last?.status && (STATUS_SEVERITY[last.status] ?? 0) > (STATUS_SEVERITY[prev.status] ?? 0)) {
      alerts.push({ code: 'worse', text: `Status piorou: ${STATUS_PT[prev.status]} → ${STATUS_PT[last.status]}` })
    }

    if (last?.step && step?.id === last.step.id) {
      let run = 0
      for (let i = perBlock.length - 1; i >= 0 && perBlock[i].step?.id === last.step.id; i--) run++
      if (run >= STUCK_BLOCKS) alerts.push({ code: 'stuck', text: `Parada na etapa ${num(last.step)} há ${run} blocos` })
    }

    if (latest?.step && step && step.id !== latest.step.id && num(step) < num(latest.step)) {
      // Ajuste da organização para uma etapa anterior à da última mentoria.
      alerts.push({ code: 'back', text: `Etapa ajustada para trás pela organização: ${num(latest.step)} → ${num(step)}` })
    } else if (prev?.step && last?.step && step?.id === last.step.id && num(last.step) < num(prev.step)) {
      const pivoted = projects.some(p => p.teamId === t.id && p.kind === 'pivot' &&
        (p.recordId === last.id || (ts(p.createdAt) > ts(prev.createdAt) && ts(p.createdAt) <= ts(last.createdAt))))
      alerts.push(pivoted
        ? { code: 'back', text: `Pivotou e voltou para a etapa ${num(last.step)}` }
        : { code: 'back', text: `Etapa voltou: ${num(prev.step)} → ${num(last.step)}` })
    }

    if (step && groupMedian !== null) {
      const gap = Math.floor(groupMedian - num(step))
      if (gap >= BEHIND_STEPS) alerts.push({ code: 'behind', text: `${gap} etapas atrás do grupo` })
    }

    if (checkpoint && !mine.some(r => r.blockId === checkpoint.id)) {
      alerts.push({ code: 'absent', text: `Sem mentoria no ${checkpoint.label}` })
    }

    out[t.id] = alerts
  }
  return out
}
