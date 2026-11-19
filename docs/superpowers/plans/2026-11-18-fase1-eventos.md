# Fase 1 — Eventos, participantes e etapas · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a plataforma multi-evento: eventos com etapas, equipes, blocos e participantes próprios; painel e formulário filtrados pelo evento selecionado; formulários de admin que limpam após salvar.

**Architecture:** Novas tabelas `events`, `event_steps`, `event_members`; `event_id` em `teams`, `blocks`, `mentoring_records`; `step` → `step_id`. Migração SQL única e idempotente leva os dados atuais para o evento "Arquivo (antes da v2)". O evento corrente do usuário vem de um cookie `liinc_event` validado contra os eventos que ele pode ver. Admin de equipes/blocos passa a viver em `/admin/eventos/[id]/...`.

**Tech Stack:** Next.js 14 App Router, Server Actions, Drizzle ORM 0.45 + `neon-http`, NextAuth v5, Tailwind 3, Vitest (novo, dev).

**Spec:** `docs/superpowers/specs/2026-11-18-plataforma-v2-design.md` (seções 5.1, 5.2, 5.3, 5.10, 5.12, 5.13 fase 1)

## Global Constraints

- Interface 100% em português; termos: "Evento", "Etapas", "Equipes", "Blocos", "Participantes", papéis "Mentor" e "Especialista".
- Valores de papel no banco: `'mentor' | 'specialist'`. Tipo de registro (`kind`): `'mentoring' | 'specialist'` (coluna criada nesta fase, default `'mentoring'`; uso pleno na fase 3).
- Driver `neon-http`: **sem transações interativas** — operações multi-linha devem ser um único statement SQL ou tolerar execução parcial.
- Acesso ao banco via Server Actions; única API route de dados é `/api/records`.
- Não criar seed de dados. Não remover o login atual nesta fase (fase 2 troca).
- Cores/tokens do `tailwind.config.ts` existentes; classes utilitárias atuais (`card`, `input`, `label`, `btn-primary`, `btn-secondary`, `btn-danger`, `badge-ok`).
- Bloco ativo: no máximo 1 por evento. Vários eventos podem estar ativos.
- Nome do evento de arquivo: exatamente `Arquivo (antes da v2)`, `active = false`.
- Etapas do evento de arquivo (posições 1–6): `Entendimento do problema`, `Explorando soluções`, `Escolha da solução`, `Protótipo`, `Testes`, `Pitch`.

## Review Focus

- **Cookie apontando para evento inexistente/encerrado/de que o usuário saiu** → cai no primeiro evento ativo disponível, nunca erro 500. (teste em Task 3)
- **Usuário sem nenhum evento ativo** (ou só no arquivo) → páginas mostram "Você não está escalado em nenhum evento ativo", formulário não renderiza. (teste em Task 3 + verificação manual Task 6)
- **Mentoria enviada para equipe de outro evento** (teamId forjado) → rejeitada com erro legível. (teste em Task 6 via função pura `assertTeamInEvent`)
- **Excluir etapa já usada em registros** → bloqueado com mensagem "Etapa em uso por N registros". (Task 4)
- **Erro de duplicidade no admin** (usuário de mentor repetido, mentor já participante) → mensagem legível, campos **não** limpam; sucesso → campos limpam. (teste em Task 2)

---

## File Structure

```
drizzle/0001_v2_fase1_eventos.sql      # migração SQL idempotente (DDL + dados)
src/schema.ts                          # + events, eventSteps, eventMembers; colunas novas; relations
src/lib/event-context.ts               # pickEventId (puro) + getEventContext (server)
src/lib/event-context.test.ts
src/lib/action-result.ts               # tipo ActionResult + helper toActionError
src/lib/action-result.test.ts
src/lib/constants.ts                   # remove PROCESS_STEPS; RecordWithRelations com step/eventId
src/lib/records.ts                     # getLatestByTeam (movido), assertTeamInEvent
src/lib/records.test.ts
src/components/admin/AdminForm.tsx     # client form: chama action, reseta no sucesso, mostra erro
src/components/layout/EventSwitcher.tsx# seletor de evento (client) + action setCurrentEvent
src/actions/events.ts                  # CRUD eventos, etapas, participantes, setCurrentEvent
src/actions/admin.ts                   # teams/blocks recebem eventId; retornam ActionResult
src/actions/mentoria.ts                # usa evento corrente e stepId
src/app/(app)/admin/eventos/page.tsx                    # lista + criar
src/app/(app)/admin/eventos/[id]/layout.tsx             # cabeçalho + abas
src/app/(app)/admin/eventos/[id]/page.tsx               # Dados
src/app/(app)/admin/eventos/[id]/etapas/page.tsx
src/app/(app)/admin/eventos/[id]/equipes/page.tsx       # move de /admin/equipes
src/app/(app)/admin/eventos/[id]/blocos/page.tsx        # move de /admin/blocos
src/app/(app)/admin/eventos/[id]/participantes/page.tsx
src/app/(app)/admin/mentores/page.tsx  # usa AdminForm
(delete) src/app/(app)/admin/equipes, src/app/(app)/admin/blocos
src/app/(app)/painel/page.tsx, src/app/api/records/route.ts, src/app/(app)/mentoria/**, 
src/components/painel/*, src/components/mentoria/MentoriaForm.tsx, src/app/(print)/admin/relatorio/page.tsx
src/app/(app)/layout.tsx, src/components/layout/SidebarNav.tsx
vitest.config.ts, package.json
```

---

### Task 1: Schema, migração e Vitest

**Files:**
- Modify: `src/schema.ts`, `package.json`
- Create: `drizzle/0001_v2_fase1_eventos.sql`, `vitest.config.ts`

**Interfaces:**
- Produces (Drizzle exports em `src/schema.ts`):
  - `events`: `id serial PK`, `name text notNull`, `company text`, `startDate date('start_date') notNull`, `endDate date('end_date')`, `active boolean notNull default true`, `createdAt`.
  - `eventSteps` (`event_steps`): `id serial PK`, `eventId integer('event_id') notNull → events.id onDelete cascade`, `position integer notNull`, `label text notNull`.
  - `eventMembers` (`event_members`): `eventId integer notNull → events.id cascade`, `mentorId uuid('mentor_id') notNull → mentors.id cascade`, `role text notNull default 'mentor'`, `createdAt`; `primaryKey({ columns: [eventId, mentorId] })`.
  - `teams.eventId`, `blocks.eventId`: `integer('event_id').notNull().references(() => events.id)`.
  - `mentoringRecords`: `+ eventId integer('event_id') notNull → events.id`, `+ kind text notNull default 'mentoring'`, `+ stepId integer('step_id') → eventSteps.id` (nullable), **remove** `step`.
  - Relations: `events` many teams/blocks/eventSteps/eventMembers/records; `eventMembers` one event/mentor; `mentoringRecords` + `step: one(eventSteps)`, `event: one(events)`; `teams`/`blocks` + `event: one(events)`.

- [ ] **Step 1: Adicionar Vitest** — `npm i -D vitest@^2`; script `"test": "vitest run"`; `vitest.config.ts` com `resolve.alias { '@': path.resolve(__dirname, 'src') }`, `test.environment: 'node'`. Run `npm test` → "No test files found" (exit 1 aceitável neste passo).

- [ ] **Step 2: Escrever `drizzle/0001_v2_fase1_eventos.sql`** — idempotente (`IF NOT EXISTS`, `DO $$ ... $$` com checagens), na ordem:
  1. `CREATE TABLE IF NOT EXISTS events/event_steps/event_members` conforme Interfaces.
  2. `ALTER TABLE teams/blocks/mentoring_records ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`; `mentoring_records ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mentoring'`, `step_id integer REFERENCES event_steps(id)`.
  3. Se não existir evento `Arquivo (antes da v2)`: inserir com `start_date = coalesce((select min(date) from blocks), current_date)`, `active = false`; inserir as 6 etapas (Global Constraints).
  4. `UPDATE teams/blocks/mentoring_records SET event_id = <arquivo> WHERE event_id IS NULL`.
  5. Se coluna `step` existir: `UPDATE mentoring_records r SET step_id = s.id FROM event_steps s WHERE s.event_id = r.event_id AND s.position = least(greatest(r.step,1),6) AND r.step_id IS NULL`; depois `ALTER TABLE mentoring_records DROP COLUMN step`.
  6. `INSERT INTO event_members (event_id, mentor_id, role) SELECT <arquivo>, id, 'mentor' FROM mentors ON CONFLICT DO NOTHING`.
  7. `ALTER TABLE teams/blocks/mentoring_records ALTER COLUMN event_id SET NOT NULL`.
  8. `CREATE UNIQUE INDEX IF NOT EXISTS blocks_one_active_per_event ON blocks(event_id) WHERE active`.

- [ ] **Step 3: Atualizar `src/schema.ts`** conforme Interfaces (incluindo o índice parcial via `uniqueIndex('blocks_one_active_per_event').on(t.eventId).where(sql\`${t.active}\`)`).

- [ ] **Step 4: Validar migração numa branch do Neon** — pedir ao usuário a connection string de uma **branch** (não produção). Run: `psql "$BRANCH_URL" -f drizzle/0001_v2_fase1_eventos.sql` duas vezes (segunda deve passar sem erro). Depois `DATABASE_URL=$BRANCH_URL npx drizzle-kit push --strict` → Expected: nenhuma alteração pendente (ou apenas diferenças cosméticas; nenhuma DROP de dados). Conferir: `select count(*) from mentoring_records where step_id is null` = 0.

- [ ] **Step 5: `npx tsc --noEmit`** — Expected: erros apenas nos usos de `step`/`PROCESS_STEPS` (corrigidos nas tasks seguintes). Commit:
```bash
git add drizzle src/schema.ts vitest.config.ts package.json package-lock.json
git commit -m "feat(db): add events, steps and members schema with archive migration"
```

---

### Task 2: ActionResult e AdminForm (corrige campos que não limpam)

**Files:**
- Create: `src/lib/action-result.ts`, `src/lib/action-result.test.ts`, `src/components/admin/AdminForm.tsx`
- Modify: `src/actions/admin.ts`, `src/app/(app)/admin/mentores/page.tsx`

**Interfaces:**
- Produces:
  - `type ActionResult = { ok: true; message?: string } | { ok: false; error: string }`
  - `toActionError(err: unknown): { ok: false; error: string }` — mapeia erro Postgres `code === '23505'` (unique violation, também aninhado em `err.cause`) para `"Registro já existe."`; `Error` com mensagem → a mensagem; outro → `"Erro inesperado. Tente novamente."`
  - `<AdminForm action={(fd: FormData) => Promise<ActionResult>} className? submitLabel="+ Adicionar" successMessage?>{fields}</AdminForm>` — client; usa `useTransition`; no `ok` chama `formRef.current.reset()` e mostra mensagem verde por 3s; no erro mostra mensagem vermelha e **mantém** os valores.
  - Todas as actions de `src/actions/admin.ts` passam a retornar `Promise<ActionResult>` (try/catch com `toActionError`).
  - `createMentor(fd: FormData)`: lê `name`, `username` (lowercase/trim); se já houver mentor com o mesmo `email`, retorna `{ ok:false, error:'Já existe um mentor com esse usuário.' }`.

- [ ] **Step 1: Testes** em `action-result.test.ts`:
  - `toActionError({ code: '23505' })` → `{ ok:false, error:'Registro já existe.' }`
  - `toActionError({ cause: { code: '23505' } })` → mesmo resultado
  - `toActionError(new Error('Acesso negado'))` → `error:'Acesso negado'`
  - `toActionError(42)` → `error:'Erro inesperado. Tente novamente.'`
- [ ] **Step 2:** `npm test` → FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar `action-result.ts`, `AdminForm.tsx`, refatorar `admin.ts` e `/admin/mentores` para `AdminForm` (texto de rodapé sobre `EVENT_ACCESS_CODE` permanece até a fase 2).
- [ ] **Step 4:** `npm test` → PASS. `npx tsc --noEmit` sem erros novos nesses arquivos.
- [ ] **Step 5:** Commit `fix(admin): reset admin forms on success and show readable errors`.

---

### Task 3: Contexto de evento

**Files:**
- Create: `src/lib/event-context.ts`, `src/lib/event-context.test.ts`, `src/components/layout/EventSwitcher.tsx`
- Modify: `src/actions/events.ts` (criar), `src/app/(app)/layout.tsx`, `src/components/layout/SidebarNav.tsx`

**Interfaces:**
- Produces:
  - `const EVENT_COOKIE = 'liinc_event'`
  - `type EventOption = { id: number; name: string; active: boolean; role: 'mentor' | 'specialist' | null }`
  - `pickEventId(options: EventOption[], cookieValue: string | undefined): number | null` — puro. Regras: considerar só `active`; se cookie for id numérico presente entre os ativos → ele; senão o ativo de maior `id`; sem ativos → `null`.
  - `getEventContext(): Promise<{ event: { id: number; name: string } | null; role: 'mentor' | 'specialist' | null; options: EventOption[]; isAdmin: boolean; mentorId: string | null }>` — server. Admin: options = todos os eventos (role = participação dele se houver). Não-admin: eventos onde `event_members.mentor_id` = mentor cujo `email = session.user.email`.
  - `setCurrentEvent(eventId: number): Promise<void>` (em `src/actions/events.ts`) — valida que o id está em `options` antes de gravar o cookie (`httpOnly`, `sameSite: 'lax'`, 90 dias); `revalidatePath('/', 'layout')`.
  - `<EventSwitcher options current />` — `<select>` quando há >1 opção ativa; texto simples quando 1; nada quando 0.

- [ ] **Step 1: Testes** `pickEventId`:
  - cookie `'3'` com ativos [1,3] → 3
  - cookie `'9'` (inexistente) com ativos [1,3] → 3
  - cookie `'2'` onde evento 2 existe mas `active:false` → maior ativo
  - cookie `'abc'` → maior ativo
  - sem ativos (só arquivo inativo) → `null`
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar; inserir `EventSwitcher` no topo da sidebar desktop e no header mobile de `(app)/layout.tsx`. Na sidebar, `NAV_ADMIN` vira: `Eventos (/admin/eventos)`, `Mentores (/admin/mentores)`, `Relatório (PDF) (/admin/relatorio)`. Rótulo do papel na sidebar: `Administrador` | `Mentor` | `Especialista` (do `role` do contexto).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: add per-user current event context and switcher`.

---

### Task 4: Admin de eventos (Dados, Etapas, Participantes)

**Files:**
- Modify: `src/actions/events.ts`
- Create: `src/app/(app)/admin/eventos/page.tsx`, `.../[id]/layout.tsx`, `.../[id]/page.tsx`, `.../[id]/etapas/page.tsx`, `.../[id]/participantes/page.tsx`, `src/lib/steps.ts`, `src/lib/steps.test.ts`

**Interfaces:**
- Consumes: `ActionResult`, `toActionError`, `AdminForm` (Task 2).
- Produces (todas `requireAdmin()`, retornam `Promise<ActionResult>`, `revalidatePath('/admin/eventos', 'layout')`):
  - `createEvent(fd)` campos `name`, `company?`, `startDate`, `endDate?`; cria também, se marcado `copySteps` = id de outro evento, cópia das etapas dele.
  - `updateEvent(id: number, fd)`; `setEventActive(id: number, active: boolean)`.
  - `addStep(eventId: number, fd)` (`label`; position = max+1), `renameStep(stepId: number, label: string)`, `moveStep(eventId: number, stepId: number, dir: 'up' | 'down')`, `deleteStep(stepId: number)` → se houver registros com o `step_id`: `{ ok:false, error:'Etapa em uso por N registros.' }`.
  - `addMember(eventId: number, fd)` (`mentorId`, `role`), `setMemberRole(eventId, mentorId: string, role)`, `removeMember(eventId, mentorId)`, `copyMembers(targetEventId: number, sourceEventId: number)` (`INSERT ... SELECT ... ON CONFLICT DO NOTHING`).
  - `swapPositions(steps: {id:number; position:number}[], stepId: number, dir: 'up'|'down'): {id:number; position:number}[]` em `src/lib/steps.ts` — puro; retorna só os dois itens alterados (ou `[]` nos extremos). `moveStep` aplica o retorno com um único `UPDATE ... FROM (VALUES ...)`.

- [ ] **Step 1: Testes** `swapPositions`: subir o 2º de [1,2,3] → `[{id:b,position:1},{id:a,position:2}]`; subir o 1º → `[]`; descer o último → `[]`; posições não contíguas [1,4,7] descer o 1º → troca 1↔4.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implementar `steps.ts` e actions. **Step 4:** PASS.
- [ ] **Step 5: Páginas.** `/admin/eventos`: lista (nome, empresa, datas, badge Ativo/Encerrado, nº equipes) + `AdminForm` de criação (com select opcional "Copiar etapas de…"). `[id]/layout.tsx`: título do evento + abas `Dados | Etapas | Equipes | Blocos | Participantes` (links; aba ativa via `usePathname` num pequeno client component), rolagem horizontal no mobile. Participantes: select de mentores ativos ainda não participantes + select de papel (Mentor/Especialista); tabela com papel editável e remover; botão "Copiar participantes de…".
- [ ] **Step 6:** `npx tsc --noEmit && npm run lint` → sem erros. Commit `feat(admin): event management with steps and participants`.

---

### Task 5: Equipes e blocos por evento

**Files:**
- Create: `src/app/(app)/admin/eventos/[id]/equipes/page.tsx`, `.../[id]/blocos/page.tsx`
- Delete: `src/app/(app)/admin/equipes/page.tsx`, `src/app/(app)/admin/blocos/page.tsx`
- Modify: `src/actions/admin.ts`

**Interfaces:**
- `createTeam(eventId: number, fd)` (`number`, `name`), `toggleTeam(id: string, active: boolean)`, `createBlock(eventId: number, fd)` (`label`, `date`), `activateBlock(eventId: number, id: number)` — **um único statement**: `UPDATE blocks SET active = (id = $id) WHERE event_id = $eventId`; `deactivateBlock(id: number)`. Todos `Promise<ActionResult>`; revalidam `/admin/eventos/[id]/...`, `/painel`, `/mentoria`.
- `createTeam` recusa número duplicado no mesmo evento: `'Já existe a equipe nº X neste evento.'`

- [ ] **Step 1:** Mover as páginas (mesmo visual), usando `AdminForm`, filtrando por `eventId` da rota. Tabela vira lista de cards abaixo de `sm` (`hidden sm:table` / `sm:hidden`).
- [ ] **Step 2:** `npx tsc --noEmit` → sem erros nesses arquivos. Commit `feat(admin): move teams and blocks under events`.

---

### Task 6: Painel, formulário, edição e relatório por evento

**Files:**
- Create: `src/lib/records.ts`, `src/lib/records.test.ts`
- Modify: `src/lib/constants.ts`, `src/actions/mentoria.ts`, `src/app/(app)/painel/page.tsx`, `src/app/api/records/route.ts`, `src/app/(app)/mentoria/page.tsx`, `src/app/(app)/mentoria/edit/[id]/page.tsx`, `src/components/painel/{PainelClient,TeamCard,HistoryModal}.tsx`, `src/components/mentoria/MentoriaForm.tsx`, `src/app/(print)/admin/relatorio/page.tsx`

**Interfaces:**
- Consumes: `getEventContext()` (Task 3).
- Produces:
  - `type Step = { id: number; position: number; label: string }`
  - `RecordWithRelations` += `eventId: number; kind: string; stepId: number | null; step: Step | null`.
  - `getLatestByTeam(records)` movido para `src/lib/records.ts` (mesma regra: maior `blockId`, depois maior `createdAt`); considera apenas `kind === 'mentoring'`.
  - `assertTeamInEvent(team: { eventId: number; active: boolean } | undefined, eventId: number): void` — lança `'Equipe inválida para este evento.'` se ausente, de outro evento ou inativa.
  - `GET /api/records` → usa `getEventContext()`; sem evento → `[]`; filtra `eventId`.
  - `submitMentoria(fd)`/`updateMentoria(id, fd)` → evento do contexto; exige `role !== null` (`'Você não participa deste evento.'`); bloco ativo **do evento**; `stepId` validado como pertencente ao evento; `assertTeamInEvent`.
  - `MentoriaForm` recebe `steps: Step[]`; botões de etapa gerados de `steps` (quebrando em 2 linhas no mobile quando > 4), hidden `stepId`.
  - `TeamCard`, `HistoryModal`, legenda do `PainelClient` e relatório usam `steps`/`record.step` em vez de `PROCESS_STEPS` (removido de `constants.ts`).

- [ ] **Step 1: Testes** `records.test.ts`:
  - `getLatestByTeam` escolhe maior `blockId`; empate → maior `createdAt`; ignora `kind:'specialist'`.
  - `assertTeamInEvent(undefined, 1)` lança; `{eventId:2,active:true}` com 1 lança; `{eventId:1,active:false}` lança; `{eventId:1,active:true}` não lança.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Páginas sem evento (`ctx.event === null`) mostram card: "Você não está escalado em nenhum evento ativo." (painel e mentoria). Relatório: escopo = evento do contexto (reescrita completa na fase 6).
- [ ] **Step 6: Verificação manual** com `npm run dev` apontando para a branch do Neon: criar evento "Teste", 3 etapas, 2 equipes, 1 bloco ativo, adicionar admin como participante Mentor; registrar mentoria; ver no painel; trocar para o arquivo (admin) e ver dados antigos; confirmar que formulários de admin limparam após salvar. `npm run build` → sucesso.
- [ ] **Step 7:** Commit `feat: scope dashboard, form and report to current event`.

---

### Task 7: Documentação

**Files:** Modify `CLAUDE.md`, `README.md`

- [ ] **Step 1:** Atualizar CLAUDE.md: modelo de dados (eventos, etapas, participantes, `kind`, `stepId`), rotas `/admin/eventos/...`, regra "registros editáveis pelo autor" (substitui "imutáveis"), login atual (usuário + código — será trocado na fase 2), regra de bloco ativo por evento, como rodar a migração SQL. README: passo de migração `psql "$DATABASE_URL" -f drizzle/0001_v2_fase1_eventos.sql` antes de `drizzle-kit push`, e `npm test`.
- [ ] **Step 2:** Commit `docs: update CLAUDE.md and README for multi-event`.
- [ ] **Step 3:** Aplicar migração em produção (com aprovação do usuário), `git push`.

---

## Próximas fases

Cada fase (2 Login, 3 Especialistas, 4 Gráfico/responsividade/logo, 5 IA, 6 Relatório final) terá seu próprio plano em `docs/superpowers/plans/`, escrito ao final da fase anterior, sobre o código já migrado.
