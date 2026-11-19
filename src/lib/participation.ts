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
  if (kind === 'mentoring' && who.role === 'specialist') return 'Especialistas registram atendimentos, não mentorias.'
  if (kind === 'specialist' && who.role === 'mentor') return 'Mentores registram mentorias, não atendimentos.'
  return null
}
