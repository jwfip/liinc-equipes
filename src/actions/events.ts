'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getEventContext } from '@/lib/event-context'
import { EVENT_COOKIE } from '@/lib/event-pick'

export async function setCurrentEvent(eventId: number): Promise<void> {
  const ctx = await getEventContext()
  if (!ctx.options.some(o => o.id === eventId)) throw new Error('Evento indisponível.')
  cookies().set(EVENT_COOKIE, String(eventId), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 90,
  })
  revalidatePath('/', 'layout')
}
