'use server'

import { getEventContext } from '@/lib/event-context'
import { getEventPeople } from '@/lib/event-data'
import { requireActiveSession } from '@/lib/guards'
import { canSeePrivateNotes } from '@/lib/participation'
import type { EventPerson } from '@/lib/follow-up'

/**
 * Mentores e especialistas do evento com o perfil, para a tela Acompanhamento se atualizar.
 * Perfil é restrito: fora do polling comum (que também atende mentores); só facilitador e admin.
 */
export async function loadEventPeople(): Promise<EventPerson[] | null> {
  try {
    await requireActiveSession()
    const ctx = await getEventContext()
    if (!ctx.event || !canSeePrivateNotes(ctx)) return null
    return await getEventPeople(ctx.event.id)
  } catch {
    return null
  }
}
