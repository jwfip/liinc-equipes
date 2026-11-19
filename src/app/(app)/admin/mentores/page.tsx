import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { mentors, users } from '@/schema'
import { createMentor, toggleMentor } from '@/actions/admin'
import AdminForm from '@/components/admin/AdminForm'
import ActionButton from '@/components/admin/ActionButton'
import ResetPasswordButton from '@/components/admin/ResetPasswordButton'

export const dynamic = 'force-dynamic'

function PasswordBadge({ hasPassword, mustChange }: { hasPassword: boolean; mustChange: boolean }) {
  if (!hasPassword) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">Sem senha</span>
  if (mustChange)   return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">Senha temporária</span>
  return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">Senha definida</span>
}

export default async function MentoresPage() {
  const list = await db.select({
    id: mentors.id, name: mentors.name, username: mentors.email, active: mentors.active,
    passwordHash: users.passwordHash, mustChange: users.mustChangePassword,
  }).from(mentors).leftJoin(users, eq(users.email, mentors.email)).orderBy(asc(mentors.name))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl">Mentores</h1>
        <p className="text-slate-500 text-sm mt-1">Pessoas que usam a plataforma. Em cada evento você escolhe quem participa e com qual papel.</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-display font-semibold text-sm mb-4 text-slate-600">Adicionar pessoa</h2>
        <AdminForm action={createMentor}>
          <div className="flex-1">
            <label className="label" htmlFor="m-name">Nome</label>
            <input id="m-name" name="name" type="text" required placeholder="Nome completo" className="input" />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="m-username">Usuário</label>
            <input id="m-username" name="username" type="text" required placeholder="Ex: joao.silva" autoCapitalize="none" className="input" />
          </div>
        </AdminForm>
        <p className="text-xs text-slate-500 mt-2">
          Ao cadastrar, uma senha temporária é gerada. Repasse à pessoa: ela troca a senha no primeiro acesso.
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {list.length} pessoa{list.length === 1 ? '' : 's'}
        </div>
        {list.length === 0 && <p className="px-4 py-8 text-center text-slate-500 text-sm">Nenhum mentor cadastrado.</p>}
        <ul>
          {list.map(m => (
            <li key={m.id} className="flex flex-col sm:flex-row sm:items-start gap-3 px-4 py-3 border-b border-slate-200/60 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.name}</p>
                <p className="text-xs text-slate-500 truncate">{m.username}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {m.active
                    ? <span className="badge-ok">Ativo</span>
                    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Inativo</span>}
                  <PasswordBadge hasPassword={!!m.passwordHash} mustChange={!!m.mustChange} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <ResetPasswordButton mentorId={m.id} name={m.name} />
                <ActionButton action={toggleMentor.bind(null, m.id, !m.active)}
                  className={m.active ? 'btn-danger' : 'btn-secondary text-xs py-1.5'}>
                  {m.active ? 'Desativar' : 'Ativar'}
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
