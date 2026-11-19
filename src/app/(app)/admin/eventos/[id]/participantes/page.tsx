import { asc, eq, ne } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventMembers, mentors } from '@/schema'
import { addMember, setMemberRole, removeMember, copyMembers } from '@/actions/events'
import AdminForm from '@/components/admin/AdminForm'
import ActionButton from '@/components/admin/ActionButton'

export const dynamic = 'force-dynamic'

const ROLE_LABEL = { mentor: 'Mentor', specialist: 'Especialista' } as const

export default async function ParticipantesPage({ params }: { params: { id: string } }) {
  const eventId = Number(params.id)
  const [members, allMentors, otherEvents] = await Promise.all([
    db.select({ mentorId: eventMembers.mentorId, role: eventMembers.role, name: mentors.name, username: mentors.email, active: mentors.active })
      .from(eventMembers).innerJoin(mentors, eq(mentors.id, eventMembers.mentorId))
      .where(eq(eventMembers.eventId, eventId)).orderBy(asc(mentors.name)),
    db.select({ id: mentors.id, name: mentors.name }).from(mentors).where(eq(mentors.active, true)).orderBy(asc(mentors.name)),
    db.select({ id: events.id, name: events.name }).from(events).where(ne(events.id, eventId)).orderBy(asc(events.name)),
  ])
  const memberIds = new Set(members.map(m => m.mentorId))
  const available = allMentors.filter(m => !memberIds.has(m.id))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display font-semibold text-sm mb-1 text-slate-600">Adicionar participante</h2>
          <p className="text-xs text-slate-500 mb-4">Mentores acompanham a evolução das equipes. Especialistas registram atendimentos e tiram dúvidas.</p>
          <AdminForm action={addMember.bind(null, eventId)}>
            <div className="flex-1">
              <label className="label" htmlFor="mentorId">Pessoa</label>
              <select id="mentorId" name="mentorId" required className="input" defaultValue="">
                <option value="" disabled>{available.length ? 'Selecione...' : 'Todos já participam'}</option>
                {available.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="role">Papel</label>
              <select id="role" name="role" className="input" defaultValue="mentor">
                <option value="mentor">Mentor</option>
                <option value="specialist">Especialista</option>
              </select>
            </div>
          </AdminForm>
        </div>

        <div className="card">
          <h2 className="font-display font-semibold text-sm mb-1 text-slate-600">Copiar participantes</h2>
          <p className="text-xs text-slate-500 mb-4">Traz as pessoas (ativas) de outro evento, com os mesmos papéis. Quem já participa é mantido.</p>
          <AdminForm action={copyMembers.bind(null, eventId)} submitLabel="Copiar">
            <div className="flex-1">
              <label className="label" htmlFor="sourceEventId">Evento de origem</label>
              <select id="sourceEventId" name="sourceEventId" required className="input" defaultValue="">
                <option value="" disabled>Selecione...</option>
                {otherEvents.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </AdminForm>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {members.length} participante{members.length === 1 ? '' : 's'}
        </div>
        {members.length === 0 && <p className="px-4 py-8 text-center text-slate-500 text-sm">Ninguém escalado ainda.</p>}
        <ul>
          {members.map(m => {
            const other = m.role === 'mentor' ? 'specialist' : 'mentor'
            return (
              <li key={m.mentorId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 border-b border-slate-200/60 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.name}{!m.active && <span className="text-xs text-slate-400"> (inativo)</span>}</p>
                  <p className="text-xs text-slate-500 truncate">{m.username}</p>
                </div>
                <span className={`self-start sm:self-center text-xs font-bold px-2 py-0.5 rounded-full border ${
                  m.role === 'specialist' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-pale text-orange-dark border-orange/30'}`}>
                  {ROLE_LABEL[m.role as keyof typeof ROLE_LABEL] ?? m.role}
                </span>
                <div className="flex gap-2 self-end sm:self-center">
                  <ActionButton action={setMemberRole.bind(null, eventId, m.mentorId, other)}>
                    Tornar {ROLE_LABEL[other]}
                  </ActionButton>
                  <ActionButton action={removeMember.bind(null, eventId, m.mentorId)} className="btn-danger" confirm={`Remover ${m.name} deste evento?`}>
                    Remover
                  </ActionButton>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
