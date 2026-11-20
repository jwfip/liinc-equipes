import type { EventRole } from './event-pick'

type Who = {
  event:        { id: number; active: boolean } | null
  role:         EventRole | null
  mentorId:     string | null
  mentorActive: boolean
}

/** Motivo pelo qual a pessoa não pode registrar no evento selecionado, ou null se pode. */
export type RecordKind = 'mentoring' | 'specialist'

export function registrationError(who: Who, kind: RecordKind = 'mentoring'): string | null {
  if (!who.event) return 'Nenhum evento selecionado.'
  if (!who.event.active) return 'Este evento está encerrado.'
  if (!who.mentorId || !who.role) return 'Você não participa deste evento.'
  if (!who.mentorActive) return 'Seu acesso de mentor está desativado.'
  if (who.role === 'facilitator') return 'Facilitadores acompanham o evento e não registram mentorias nem atendimentos.'
  if (kind === 'mentoring' && who.role === 'specialist') return 'Especialistas registram atendimentos, não mentorias.'
  if (kind === 'specialist' && who.role === 'mentor') return 'Mentores registram mentorias, não atendimentos.'
  return null
}

type Viewer = { isAdmin: boolean; role: EventRole | null; mentorActive?: boolean }

/** Observações para facilitadores: só facilitador do evento (com acesso ativo) e admin veem as de todos. */
export function canSeePrivateNotes(v: Viewer): boolean {
  return v.isAdmin || (v.role === 'facilitator' && v.mentorActive !== false)
}

const ROLE_LABEL: Record<EventRole, string> = { mentor: 'Mentor', specialist: 'Especialista', facilitator: 'Facilitador' }
export const roleLabel = (role: EventRole | null): string | null => (role ? ROLE_LABEL[role] ?? null : null)

/** Corrigir o texto do projeto atual: admin sempre; facilitador só com o evento ativo. */
export function canCorrectProject(v: Viewer & { event: { active: boolean } | null }): boolean {
  if (!v.event) return false
  if (v.isAdmin) return true
  return canSeePrivateNotes(v) && v.role === 'facilitator' && v.event.active
}

/** Ativar e encerrar blocos do evento: admin sempre; facilitador com acesso ativo e só em evento ativo. */
export function canManageBlocks(v: Viewer & { event: { active: boolean } | null }): boolean {
  if (!v.event) return false
  if (v.isAdmin) return true
  return canSeePrivateNotes(v) && v.role === 'facilitator' && v.event.active
}
