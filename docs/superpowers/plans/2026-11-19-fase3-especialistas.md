# Fase 3 — Especialistas e Atendimentos · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Participantes com papel **Especialista** registram **Atendimentos** (equipe, tema/dúvida, orientação, observações — sem status e sem etapa), separados das **Mentorias**: não alteram card, status, etapa nem a distribuição por mentor; aparecem numa aba própria do histórico da equipe.

**Architecture:** Mesma tabela `mentoring_records` com `kind = 'specialist'` (coluna criada na fase 1); `status` e `block_id` passam a aceitar nulo e entra a coluna `topic`. A página `/mentoria` escolhe o formulário pelo papel do participante no evento. Regras puras novas em `src/lib/records.ts` e `src/lib/participation.ts`; a UI do painel separa os registros por tipo no cliente.

**Tech Stack:** Next.js 14, Drizzle + neon-http, Vitest, Playwright (E2E contra a branch Neon de teste).

**Spec:** `docs/superpowers/specs/2026-11-18-plataforma-v2-design.md` (seção 5.5)

## Global Constraints

- Termos de interface: **Mentoria** / **Mentorias** (mentor), **Atendimento** / **Atendimentos** (especialista), papel **Especialista**.
- Valores no banco: `kind` `'mentoring' | 'specialist'`; papel `'mentor' | 'specialist'`.
- Atendimento: campos `topic` (obrigatório, rótulo "Tema ou dúvida *"), `advice` (obrigatório, rótulo "Orientação dada *"), `obs` (opcional, rótulo "Observações"). `status` e `stepId` sempre `null`.
- Atendimento grava o **bloco ativo do evento se houver**; não exige bloco ativo. Mentoria continua exigindo.
- Mentor só registra Mentoria; Especialista só registra Atendimento (mensagens exatas: `'Especialistas registram atendimentos, não mentorias.'` / `'Mentores registram mentorias, não atendimentos.'`).
- Todos veem tudo. Histórico abre na aba do papel de quem vê (Especialista → Atendimentos; demais → Mentorias).
- Atendimentos **não** entram em: status do card, etapa, `getLatestByTeam`, resumo de status, "Distribuição por Mentor".
- Edição: só o autor, no evento do próprio registro (mesma regra das mentorias).
- Resumo por IA dos atendimentos fica para a fase 5.
- **Etapa da equipe** = a mais recente entre (etapa da última mentoria) e (último ajuste feito pela organização). Status continua vindo só das mentorias. Só **admin** ajusta etapa (o facilitador do backlog herdará isso). Ajustes ficam em tabela própria `team_step_changes` e aparecem no histórico como "Etapa ajustada pela organização".

## Review Focus

- **Equipe só com atendimentos** → card no grupo "Sem mentoria ainda" com contador "N atendimento(s)", sem etapa nem status. (teste Task 2 em `groupTeams`)
- **Especialista sem bloco ativo** → consegue registrar; o histórico mostra o atendimento sem rótulo de bloco ("Fora de bloco"). (E2E Task 5)
- **Papel trocado** (admin muda alguém de Mentor para Especialista com o formulário aberto) → envio recusado com mensagem legível. (teste Task 1)
- **Edição de atendimento** pelo autor mantém `kind`; ninguém consegue transformar atendimento em mentoria ou vice-versa via `updateMentoria`/`updateAtendimento`. (teste Task 1 em `assertSameKind`)
- **Equipe sem mentoria, com etapa ajustada pelo admin** → card mostra a etapa (sem status) e continua em "Sem mentoria ainda". (teste Task 2 em `currentStepFor`)
- **Mentoria posterior a um ajuste** prevalece, e ajuste posterior a uma mentoria prevalece. (teste Task 2)
- **Relatório impresso** continua só com mentorias na tabela de status; atendimentos aparecem em seção separada por equipe. (verificação manual Task 5)

---

## File Structure

```
drizzle/0003_v2_fase3_atendimentos.sql   # status e block_id nullable; coluna topic
src/schema.ts                            # idem
src/lib/participation.ts (+test)         # registrationError(ctx, kind)
src/lib/records.ts (+test)               # splitByKind, countByTeam, defaultHistoryTab, assertSameKind, groupTeams
src/lib/constants.ts                     # RecordWithRelations: status/blockId/block nullable, topic
src/actions/mentoria.ts                  # submitAtendimento, updateAtendimento; papel validado
src/components/mentoria/AtendimentoForm.tsx
src/app/(app)/mentoria/page.tsx          # formulário pelo papel
src/app/(app)/mentoria/edit/[id]/page.tsx# edita pelo kind do registro
src/components/layout/SidebarNav.tsx     # "Novo Atendimento" para especialista
src/components/painel/{PainelClient,TeamCard,HistoryModal,SummaryStrip}.tsx
src/app/(print)/admin/relatorio/page.tsx # seção de atendimentos por equipe
CLAUDE.md
```

---

### Task 1: Banco e regras de papel

**Files:** Create `drizzle/0003_v2_fase3_atendimentos.sql`; Modify `src/schema.ts`, `src/lib/participation.ts`, `src/lib/participation.test.ts`, `src/lib/records.ts`, `src/lib/records.test.ts`

**Interfaces — Produces:**
- SQL idempotente: `ALTER TABLE mentoring_records ALTER COLUMN status DROP NOT NULL`, `ALTER COLUMN block_id DROP NOT NULL`, `ADD COLUMN IF NOT EXISTS topic text`. Schema: `status: text('status')`, `blockId: integer('block_id').references(...)` (sem `notNull`), `topic: text('topic')`.
- `type RecordKind = 'mentoring' | 'specialist'`
- `registrationError(who, kind: RecordKind = 'mentoring'): string | null` — regras atuais + papel: `kind === 'mentoring' && role === 'specialist'` → mensagem de especialista; `kind === 'specialist' && role === 'mentor'` → mensagem de mentor.
- `assertSameKind(record: { kind: string }, kind: RecordKind): void` — lança `'Registro não encontrado.'` se diferente.

- [ ] **Step 1: Testes:** especialista tentando `mentoring` → mensagem exata; mentor tentando `specialist` → mensagem exata; especialista com `specialist` → `null`; chamada sem `kind` mantém comportamento atual. `assertSameKind({kind:'specialist'}, 'mentoring')` lança; igual não lança.
- [ ] **Step 2:** FAIL. **Step 3:** implementar + SQL + schema. **Step 4:** PASS + tsc.
- [ ] **Step 5:** Aplicar a migração na branch Neon de teste 2× via MCP; conferir `is_nullable` de `status`/`block_id` e a coluna `topic`.
- [ ] **Step 6:** Commit `feat(db): allow specialist records without status/block; role rules`.

---

### Task 2: Regras de exibição (puras)

**Files:** Modify `src/lib/records.ts`, `src/lib/records.test.ts`

**Interfaces — Produces:**
- `splitByKind<R extends { kind: string }>(records: R[]): { mentoring: R[]; specialist: R[] }`
- `countByTeam(records: { teamId: string }[]): Record<string, number>`
- `defaultHistoryTab(role: 'mentor' | 'specialist' | null): 'mentoring' | 'specialist'` — `'specialist'` só para especialista.
- `groupTeams<T extends { id: string; number: number }>(teams: T[], latestByTeam: Record<string, { status: string | null }>): Record<StatusValue | 'none', T[]>` — move para cá a lógica de agrupamento do `PainelClient` (ordem numérica dentro do grupo; sem mentoria → `'none'`).

- [ ] **Step 1: Testes:** split separa por `kind`; `countByTeam` conta por equipe; `defaultHistoryTab('specialist')` → `'specialist'`, `('mentor')`/`(null)` → `'mentoring'`; `groupTeams` com equipe só de atendimentos (ausente de `latestByTeam`) → grupo `'none'`; ordenação numérica dentro do grupo.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: pure helpers to split mentoring and specialist records`.

---

### Task 2b: Ajuste de etapa pela organização

**Files:** SQL na `drizzle/0003_v2_fase3_atendimentos.sql`; Modify `src/schema.ts`, `src/lib/records.ts` (+test), `src/actions/admin.ts`, `src/app/api/records/route.ts`, `src/lib/event-data.ts`

**Interfaces — Produces:**
- Tabela `team_step_changes`: `id serial PK`, `event_id → events` notNull, `team_id → teams` notNull, `step_id → event_steps` notNull, `changed_by text → users.id`, `created_at timestamp default now()`. Relations: team, step, user.
- `type StepChange = { id: number; teamId: string; stepId: number; createdAt: string | Date; step: Step | null }`
- `currentStepFor(latestMentoring: { step: Step | null; createdAt } | undefined, changes: StepChange[]): { step: Step | null; source: 'mentoring' | 'organization' | null }` — o mais recente por `createdAt`.
- `adjustTeamStep(teamId: string, stepId: number): Promise<ActionResult>` (admin; equipe e etapa do mesmo evento).
- `getEventStepChanges(eventId)` em `event-data.ts`; `/api/records` passa a responder `{ records, stepChanges }`.
- [ ] Testes de `currentStepFor`: só mentoria → mentoria; só ajuste → ajuste (source `organization`); ajuste mais novo vence; mentoria mais nova vence; nenhum → `{ step: null, source: null }`.

---

### Task 3: Registro de atendimento

**Files:** Modify `src/actions/mentoria.ts`, `src/app/(app)/mentoria/page.tsx`, `src/app/(app)/mentoria/edit/[id]/page.tsx`, `src/components/layout/SidebarNav.tsx`, `src/app/(app)/layout.tsx`; Create `src/components/mentoria/AtendimentoForm.tsx`

**Interfaces:**
- Consumes: `registrationError(ctx, kind)`, `assertSameKind` (Task 1).
- Produces:
  - `submitAtendimento(fd: FormData): Promise<ActionResult>` — `requireActiveSession`; `registrationError(ctx,'specialist')`; equipe do evento (`assertTeamInEvent`); `topic` e `advice` obrigatórios (`'Campos obrigatórios não preenchidos.'`); `blockId` = bloco ativo ou `null`; `kind: 'specialist'`, `status: null`, `stepId: null`.
  - `updateAtendimento(recordId: string, fd: FormData): Promise<ActionResult>` — autor + `assertSameKind(record, 'specialist')`.
  - `submitMentoria`/`updateMentoria` passam a usar `registrationError(ctx,'mentoring')` e `assertSameKind(record,'mentoring')`.
  - `<AtendimentoForm teams activeBlock recordToEdit? />` — seletor de equipe igual ao da mentoria (extrair `TeamPicker` de `MentoriaForm` para `src/components/mentoria/TeamPicker.tsx`); banner do bloco ativo ou "Fora de bloco"; textareas `topic`, `advice`, `obs`; limpa após sucesso; botão "Registrar atendimento" / "Salvar alterações".
  - `/mentoria`: título "Novo atendimento" e `AtendimentoForm` para especialista; "Nova mentoria" e `MentoriaForm` para mentor.
  - Edit: escolhe o formulário pelo `record.kind`.
  - Sidebar: item do formulário com rótulo "Novo Atendimento" (ícone 💬) quando o papel no evento é especialista. `SidebarNav` recebe `eventRole`.
- [ ] **Step 1:** Implementar. **Step 2:** `npx tsc --noEmit`, `npm test` verdes.
- [ ] **Step 3:** Commit `feat: specialists register atendimentos`.

---

### Task 4: Painel, histórico e relatório

**Files:** Modify `src/components/painel/{PainelClient,TeamCard,HistoryModal,SummaryStrip}.tsx`, `src/app/(app)/painel/page.tsx`, `src/app/(print)/admin/relatorio/page.tsx`, `src/lib/constants.ts`

**Interfaces — Consumes:** helpers da Task 2.
- `RecordWithRelations`: `status: string | null`, `blockId: number | null`, `block: ... | null`, `topic: string | null`.
- `PainelClient` recebe `viewerRole: 'mentor' | 'specialist' | null`; usa `splitByKind`; `getLatestByTeam`/`groupTeams` só com mentorias; grupo `'none'` com título **"Sem mentoria ainda"**; "Distribuição por Mentor" só com mentorias; nova seção "Atendimentos de especialistas" (por especialista: nome, nº de atendimentos, equipes atendidas) exibida só se houver atendimentos.
- `TeamCard` recebe `specialistCount: number` e `current: { step, source }` (de `currentStepFor`); mostra a etapa também para equipes sem mentoria quando houver ajuste; para admin, controle "Ajustar etapa" (select com as etapas + confirmar) que chama `adjustTeamStep`; quando `source === 'organization'`, legenda "ajustada pela organização".
- `HistoryModal` aba Mentorias intercala os ajustes de etapa na linha do tempo ("Etapa ajustada pela organização → N — rótulo", data).
- `PainelClient` consome `{ records, stepChanges }` do polling.
- `TeamCard` (atendimentos): mostra "💬 N atendimento(s)" quando > 0 (também em equipes sem mentoria).
- `HistoryModal` recebe `mentoring`, `specialist`, `initialTab`; abas **Mentorias (n)** | **Atendimentos (n)** com `role="tablist"`; aba Atendimentos lista bloco (ou "Fora de bloco"), data, especialista, tema, orientação, observações, link "Editar" para o autor; cabeçalho lista mentores e especialistas separadamente.
- `SummaryStrip`: "Mentores com registros" conta só mentorias; novo cartão "Atendimentos" (total) quando houver.
- Relatório: consultas por evento trazem os dois tipos; tabelas de status/etapa só com mentorias; em cada equipe, subseção "Atendimentos de especialistas" (tema, orientação, especialista, data) se houver.

- [ ] **Step 1:** Implementar. **Step 2:** tsc + tests verdes; `npm run build` OK.
- [ ] **Step 3:** Commit `feat: show atendimentos separately in dashboard, history and report`.

---

### Task 5: E2E e documentação

- [ ] **Step 1: E2E (Playwright) na branch Neon de teste**, com o ajuste local de rede (não commitado): admin cria evento com etapas, equipes, bloco; escala Mentor A e Especialista B; B vê "Novo Atendimento", registra atendimento **com bloco ativo** e outro **sem bloco ativo**; B não consegue enviar mentoria (formulário não aparece; action recusa); A registra mentoria; painel: card da equipe com mentoria mantém status, equipe só com atendimentos fica em "Sem mentoria ainda" com contador; histórico abre em Mentorias para A e em Atendimentos para B; "Fora de bloco" aparece; B edita o próprio atendimento; relatório mostra a subseção de atendimentos; troca de papel de B para Mentor com formulário aberto → envio recusado com mensagem.
- [ ] **Step 2:** CLAUDE.md: atendimentos, regras de papel, campos `topic`, `status`/`block_id` nulos para atendimento, migração 0003.
- [ ] **Step 3:** Commit `docs: specialists and atendimentos`.

## Implantação (após aprovação)

Migração `0003` na produção (só relaxa NOT NULL e adiciona coluna — compatível com o código atual), depois merge do PR.
