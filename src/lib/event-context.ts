import { cookies } from 'next/headers'
import { desc, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { events, eventMembers, mentors } from '@/schema'
import { EVENT_COOKIE, pickEventId, type EventOption, type EventRole } from './event-pick'

export type EventContext = {
  event:    { id: number; name: string; active: boolean } | null
  role:     EventRole | null
  options:  EventOption[]
  isAdmin:  boolean
  mentorId: string | null
  mentorActive: boolean
}

const EMPTY: EventContext = { event: null, role: null, options: [], isAdmin: false, mentorId: null, mentorActive: false }

export async function getEventContext(): Promise<EventContext> {
  const session = await auth()
  if (!session?.user) return EMPTY
  const isAdmin = session.user.role === 'admin'

  const mentor = session.user.email
    ? await db.query.mentors.findFirst({ where: eq(mentors.email, session.user.email) })
    : undefined

  const memberships = mentor
    ? await db.select({ eventId: eventMembers.eventId, role: eventMembers.role })
        .from(eventMembers).where(eq(eventMembers.mentorId, mentor.id))
    : []
  const roleByEvent = new Map(memberships.map(m => [m.eventId, m.role as EventRole]))

  const allEvents = await db.select({ id: events.id, name: events.name, active: events.active })
    .from(events).orderBy(desc(events.id))

  const options: EventOption[] = allEvents
    .filter(e => isAdmin || roleByEvent.has(e.id))
    .map(e => ({ ...e, role: roleByEvent.get(e.id) ?? null }))

  const id = pickEventId(options, cookies().get(EVENT_COOKIE)?.value, { allowInactive: isAdmin })
  const current = options.find(o => o.id === id) ?? null

  return {
    event:    current ? { id: current.id, name: current.name, active: current.active } : null,
    role:     current?.role ?? null,
    options,
    isAdmin,
    mentorId: mentor?.id ?? null,
    mentorActive: mentor?.active ?? false,
  }
}
