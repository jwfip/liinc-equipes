# Acesso de facilitador (parte 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Papel Facilitador por evento, observações para facilitadores privadas, projeto atual da equipe com pivôs e a tela Acompanhamento com alertas.

**Architecture:** O papel novo entra em `event_members.role` (texto) e é tratado explicitamente em `participation.ts`/`mainNav`. Privacidade de `obs` é uma função pura aplicada no servidor antes de qualquer resposta para não-facilitador. Projeto atual é uma tabela `team_projects` (uma linha por versão). Alertas são uma função pura `eventAlerts` rodando no cliente sobre os mesmos dados do polling.

**Tech Stack:** Next.js 14 App Router + Server Actions, Drizzle (`neon-http`, só `db.batch`), Vitest, Tailwind, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-19-facilitador-design.md`

## Global Constraints

- Um papel por pessoa por evento: `'mentor' | 'specialist' | 'facilitator'`; rótulo "Facilitador".
- Facilitador não registra mentoria/atendimento, não ajusta etapa, não acessa `/admin` nem relatório. Única escrita: corrigir texto do projeto (evento ativo).
- `obs` (mentoria e atendimento) visível só para facilitador do evento, admin e o autor do registro — filtrado no servidor.
- `obs` nunca entra nos prompts dos resumos do painel.
- Sem `db.transaction`; escritas múltiplas com `db.batch`. Migração SQL idempotente em `drizzle/0005_facilitador.sql`, FKs nomeadas no padrão Drizzle.
- Ícones lucide, sem emoji. Textos da UI em português do Brasil.
- Constantes de alerta: `STUCK_BLOCKS = 2`, `BEHIND_STEPS = 2`; selo "Pivotou" se o pivô foi nos últimos 2 blocos.

## Review Focus

1. Mentor abre o painel e vê a própria observação, mas não a de outro mentor — inclusive na resposta do `/api/records` (teste em Task 2).
2. Evento com um só bloco, ou no primeiro bloco ativo: nenhum alerta "Sem mentoria" (teste em Task 6).
3. Evento sem etapas ou equipe sem etapa: regras de etapa não disparam nem quebram (teste em Task 6).
4. Mentor marca "A equipe pivotou" e deixa o novo projeto vazio → erro legível, nada gravado (teste em Task 4).
5. Facilitador de evento encerrado tenta corrigir projeto → recusado (teste em Task 5).

---

### Task 1: Papel Facilitador

**Files:**
- Modify: `src/lib/event-pick.ts` (tipo `EventRole`), `src/lib/participation.ts`, `src/lib/records.ts` (`defaultHistoryTab`), `src/actions/events.ts` (`ROLES`), `src/app/(app)/admin/eventos/[id]/participantes/page.tsx`, `src/components/layout/nav-items.ts` (+ chamadores de `mainNav`), `src/components/painel/PainelClient.tsx` (tipo `viewerRole`)
- Test: `src/lib/participation.test.ts`, `src/lib/records.test.ts`

**Interfaces:**
- Produces: `EventRole = 'mentor' | 'specialist' | 'facilitator'`; `canSeePrivateNotes(ctx: { isAdmin: boolean; role: EventRole | null }): boolean`; `canCorrectProject(ctx: { isAdmin: boolean; role: EventRole | null; event: { active: boolean } | null }): boolean` (admin: sempre que há evento; facilitador: só evento ativo); `mainNav(eventRole: EventRole | null, isAdmin: boolean): NavItem[]`; `ACOMPANHAMENTO_NAV` (`/acompanhamento`, "Acompanhamento", ícone `Radar`).

- [ ] **Step 1: Testes que falham** em `participation.test.ts`:
  - `registrationError({ ...base, role: 'facilitator' }, 'mentoring')` e `(…, 'specialist')` → `'Facilitadores acompanham o evento e não registram mentorias nem atendimentos.'`
  - `canSeePrivateNotes`: admin true; facilitator true; mentor/specialist/null false.
  - `canCorrectProject`: facilitador com evento ativo true, encerrado false; admin com evento encerrado true; mentor false.
  - em `records.test.ts`: `defaultHistoryTab('facilitator')` → `'mentoring'`.
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar. `registrationError` compara papéis explicitamente (facilitador antes das regras de tipo). `ROLES` em `events.ts` inclui `'facilitator'`. Participantes: select com três opções e a troca rápida de papel vira `<select>` (chama `setMemberRole`); cor do selo do facilitador: `bg-navy/5 text-navy border-navy/20`. `mainNav`: facilitador → Painel + Acompanhamento; mentor/especialista como hoje; admin acrescenta Acompanhamento.
- [ ] **Step 4:** `npm test` e `npx tsc --noEmit` → passam.
- [ ] **Step 5:** Commit `feat(facilitador): papel Facilitador por evento`.

### Task 2: Observações privadas

**Files:**
- Create: `src/lib/privacy.ts`, `src/lib/privacy.test.ts`
- Modify: `src/app/(app)/painel/page.tsx`, `src/app/api/records/route.ts`, `src/lib/ai/summary-prompt.ts` (+ testes), `src/components/mentoria/MentoriaForm.tsx`, `src/components/mentoria/AtendimentoForm.tsx`, `src/components/painel/TeamCard.tsx`, `src/components/painel/HistoryModal.tsx`

**Interfaces:**
- Consumes: `canSeePrivateNotes` (Task 1).
- Produces: `redactPrivateNotes<R extends { obs: string | null; mentorId: string }>(records: R[], viewer: { canSeeAll: boolean; mentorId: string | null }): R[]`.

- [ ] **Step 1: Testes que falham** em `privacy.test.ts`: com `canSeeAll: true` devolve igual; com `false` zera `obs` dos registros de outros e mantém os do `mentorId` do leitor; `mentorId: null` zera todos; não muta a entrada. Em `summary-prompt.test.ts`: `buildMentoringSummaryMessages` e `buildSpecialistSummaryMessages` com `obs: 'segredo'` → nenhuma mensagem contém `'segredo'`.
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar `redactPrivateNotes`; aplicar em `painel/page.tsx` e `/api/records` com `canSeeAll = canSeePrivateNotes(ctx)`. Tirar `part('Observações', …)` dos dois prompts (o tipo pode manter `obs`). Formulários: rótulo "Observações para facilitadores" nos dois, e abaixo `<p className="text-xs text-slate-500">Visível só para facilitadores e organização.</p>`. Selo "Observação" no `TeamCard` → "Para facilitadores"; idem no `HistoryModal`.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit` → passam. `grep -rn "getEventRecords" src` e confirmar que toda leitura para não-admin passa por `redactPrivateNotes` (o relatório é só admin).
- [ ] **Step 5:** Commit `feat(facilitador): observações para facilitadores privadas`.

### Task 3: Tabela `team_projects` e regras de projeto

**Files:**
- Modify: `src/schema.ts` (tabela + relations), `src/lib/event-data.ts`
- Create: `drizzle/0005_facilitador.sql`, `src/lib/project.ts`, `src/lib/project.test.ts`

**Interfaces:**
- Produces:
  - `teamProjects` (colunas do spec: `id serial`, `eventId`, `teamId` (cascade), `description`, `kind 'initial'|'pivot'|'correction'`, `recordId` null, `createdBy` → mentors null, `createdAt`).
  - `type ProjectRow = { id: number; teamId: string; description: string; kind: 'initial' | 'pivot' | 'correction'; recordId: string | null; createdAt: string | Date | null; author: { name: string } | null }`
  - `currentProject(rows: ProjectRow[], teamId: string): ProjectRow | null` (mais recente por `createdAt`, empate por `id`).
  - `projectSince(rows, teamId): ProjectRow | null` — a linha mais recente de tipo `initial`/`pivot` (data "desde" ignora correções).
  - `recentPivot(rows, teamId, recordBlock: Map<string, number>, recentBlockIds: number[]): ProjectRow | null` — último pivô cuja mentoria (`recordId`) está em `recentBlockIds`.
  - `getEventProjects(eventId): Promise<ProjectRow[]>` (com `author` via `createdBy`).
  - `getEventBlocks(eventId)` → `{ id, label, date, active }[]` ordenados por `date`, `id`.

- [ ] **Step 1: Testes que falham** para `currentProject` (vazio → null; correção mais recente vence como texto atual), `projectSince` (correção depois de pivô → devolve o pivô) e `recentPivot` (pivô em bloco fora da janela → null).
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar funções, schema e SQL (`CREATE TABLE IF NOT EXISTS team_projects …` com `team_projects_event_id_events_id_fk`, `team_projects_team_id_teams_id_fk ON DELETE CASCADE`, `team_projects_record_id_mentoring_records_id_fk`, `team_projects_created_by_mentors_id_fk`; índice `team_projects_team_idx (team_id, created_at)`).
- [ ] **Step 4:** `npm test` passa. Se `DATABASE_URL` existir: `psql "$DATABASE_URL" -f drizzle/0005_facilitador.sql` e `npx drizzle-kit push` sem pendências; senão, anotar no relatório final que a migração precisa ser aplicada antes do deploy.
- [ ] **Step 5:** Commit `feat(projeto): tabela team_projects e regras de projeto atual`.

### Task 4: Projeto no formulário de mentoria

**Files:**
- Modify: `src/actions/mentoria.ts`, `src/components/mentoria/MentoriaForm.tsx`, `src/components/mentoria/AtendimentoForm.tsx`, `src/app/(app)/mentoria/page.tsx`, `src/app/(app)/mentoria/edit/[id]/page.tsx`, `src/lib/ai/extraction.ts` (+ teste)
- Create: `src/lib/project-input.ts`, `src/lib/project-input.test.ts`

**Interfaces:**
- Consumes: `currentProject`, `getEventProjects` (Task 3).
- Produces: `readProjectInput(input: { pivoted: boolean; description: string | null }, hasProject: boolean): { kind: 'initial' | 'pivot'; description: string } | null` — lança `Error` com mensagem legível. `parseExtraction` passa a devolver também `project: string | null` e `pivot: boolean` para `kind = 'mentoring'`.

- [ ] **Step 1: Testes que falham:**
  - sem projeto e descrição vazia → lança `'Descreva o projeto da equipe.'`; com descrição → `{ kind: 'initial', description }` (trim, máx. 1000 caracteres).
  - com projeto e `pivoted: false` → `null` (ignora descrição).
  - com projeto, `pivoted: true`, descrição vazia → lança `'Descreva o novo projeto da equipe.'`; preenchida → `{ kind: 'pivot', … }`.
  - `parseExtraction('{"project":"App X","pivot":true}', 'mentoring', steps)` → `project: 'App X', pivot: true`; `pivot: "sim"` → `false`.
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar.
  - Campos do form: `project` (texto) e `pivoted` (`'on'`).
  - `submitMentoria`: lê o projeto atual da equipe, chama `readProjectInput`; gera `id = crypto.randomUUID()` para o registro; `db.batch([insert registro, insert team_projects { recordId: id, createdBy: mentorId, eventId, teamId, … }])` quando houver projeto, senão só o insert.
  - `updateMentoria` não mexe em projeto.
  - `MentoriaForm` recebe `projects: Record<teamId, { description: string; since: string; author: string | null }>`; sem projeto: textarea obrigatória "Projeto da equipe *" com ajuda "Descreva o projeto em uma ou duas frases. Os próximos mentores vão ver este texto."; com projeto: bloco só leitura "Projeto atual · desde dd/mm, por Fulano" + checkbox "A equipe pivotou" que abre "Novo projeto *". Na edição, só o bloco leitura.
  - Campo `working` → rótulo "No que a equipe trabalhou nesta mentoria? *".
  - Áudio: prompt de extração pede `project` (descrição do projeto) e `pivot` (true só se o relato disser que a equipe mudou de projeto). Sem projeto e campo vazio → preenche com `AiHint`. Com projeto e `pivot: true` → não marca a caixa; mostra "A IA identificou um possível pivô — confira" com botão "Usar texto sugerido" que marca a caixa e preenche.
  - `AtendimentoForm`: mostra projeto atual da equipe escolhida, só leitura.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit` → passam.
- [ ] **Step 5:** Commit `feat(projeto): projeto atual e pivô no formulário de mentoria`.

### Task 5: Projeto no painel, histórico, IA e relatório; correção

**Files:**
- Create: `src/actions/projects.ts`
- Modify: `src/app/api/records/route.ts`, `src/app/(app)/painel/page.tsx`, `src/components/painel/PainelClient.tsx`, `TeamCard.tsx`, `HistoryModal.tsx`, `src/lib/ai/summary-prompt.ts`, `src/lib/ai/final-summary.ts`, `src/lib/ai/team-summary.ts` (+ testes dos prompts), `src/app/(print)/admin/eventos/[id]/relatorio/page.tsx`
- Test: `src/lib/participation.test.ts` (já cobre `canCorrectProject`), `summary-prompt.test.ts`, `final-summary.test.ts`

**Interfaces:**
- Consumes: `ProjectRow`, `currentProject`, `projectSince`, `recentPivot`, `getEventProjects`, `getEventBlocks` (Task 3); `canCorrectProject`, `canSeePrivateNotes` (Task 1).
- Produces: `correctProject(teamId: string, description: string): Promise<ActionResult>`; `/api/records` passa a devolver `{ records, stepChanges, summaries, projects }`; prompts aceitam `project?: { current: string | null; pivots: { at: Stamp; description: string }[] }` como último parâmetro.

- [ ] **Step 1: Testes que falham:** `buildMentoringSummaryMessages(…, { current: 'App X', pivots: [] })` → mensagem contém `App X` e cada registro usa o rótulo `Trabalhou em` (não `Projeto`); com pivô, aparece a data dd/mm. `buildFinalSummaryMessages` com projeto → contém o projeto atual e os pivôs.
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar.
  - `correctProject`: `requireActiveSession`, `getEventContext`, `canCorrectProject` senão `'Sem permissão para corrigir o projeto.'`; equipe do evento (`assertTeamInEvent`); exige projeto existente (`'A equipe ainda não tem projeto.'`); descrição não vazia; insere `kind: 'correction'`, `recordId: null`, `createdBy: ctx.mentorId`. Retorna `ActionResult`.
  - Polling e página do painel incluem `projects`; `PainelClient` guarda em estado e passa adiante. Para `recentPivot`, a janela são os 2 últimos blocos com data ≤ hoje (de `getEventBlocks`, passado como prop).
  - `TeamCard`: linha "Projeto: …" (`line-clamp-2`) e selo "Pivotou" (`Shuffle`) quando `recentPivot`.
  - `HistoryModal`: terceira aba **Projeto** (lista cronológica: Inicial/Pivô/Correção, autor, data, bloco quando houver registro); linha da mentoria que pivotou ganha marca "Pivotou". Botão "Corrigir texto do projeto" (form inline) quando `canCorrect` for true (prop vinda do servidor).
  - `team-summary.ts` carrega projetos da equipe e passa aos prompts (mentoria e final).
  - Relatório: "Projeto atual" e lista de pivôs com data na página da equipe.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit` → passam.
- [ ] **Step 5:** Commit `feat(projeto): projeto atual no painel, histórico, IA e relatório`.

### Task 6: Regras de alerta

**Files:**
- Create: `src/lib/alerts.ts`, `src/lib/alerts.test.ts`

**Interfaces:**
- Consumes: `currentStepFor`, `getLatestByTeam`, `StepChange` (`src/lib/records.ts`); `ProjectRow` (Task 3).
- Produces:
  - `type AlertCode = 'status' | 'worse' | 'stuck' | 'back' | 'behind' | 'absent'`
  - `type TeamAlert = { code: AlertCode; text: string }`
  - `eventAlerts(input: { teams: { id: string }[]; records: { id: string; teamId: string; kind: string; blockId: number | null; status: string | null; createdAt: Stamp; step: StepRef | null }[]; stepChanges: StepChange[]; projects: ProjectRow[]; blocks: { id: number; label: string; date: string; active: boolean }[]; today: string }): Record<string, TeamAlert[]>`
  - `STATUS_SEVERITY = { flying: 0, ok: 1, attention: 2, emergency: 3 }`

Regras (só `kind = 'mentoring'`; "por bloco" = mentoria mais recente da equipe em cada bloco, blocos na ordem de `blocks`):

- [ ] **Step 1: Testes que falham**, um `describe` por regra, com os textos exatos:
  - `status`: último status `emergency` → `'Emergência'`; `attention` → `'Atenção'`.
  - `worse`: penúltimo `ok`, último `attention` → `'Status piorou: No caminho → Atenção'`; melhora não alerta.
  - `stuck`: mesma etapa (posição 2) nos 2 últimos blocos com mentoria → `'Parada na etapa 2 há 2 blocos'`; 3 blocos → `'há 3 blocos'`; ajuste do admin para outra etapa depois da última mentoria → sem alerta.
  - `back`: anterior etapa 4, atual 2 → `'Etapa voltou: 4 → 2'`; com linha `pivot` cujo `recordId` é a última mentoria → `'Pivotou e voltou para a etapa 2'`.
  - `behind`: posições das equipes [5,5,5,2] → só a de posição 2 recebe `'3 etapas atrás do grupo'` (mediana 5, alerta quando `mediana − posição ≥ 2`); equipes sem etapa ficam fora da mediana.
  - `absent`: blocos B1 (passado), B2 (ativo); equipe sem mentoria em B1 → `'Sem mentoria no B1'`. Só B1 ativo → nenhum `absent`. Nenhum ativo e último bloco com `date <= today` → considera o último. Equipe sem nenhuma mentoria recebe só `absent` (quando aplicável).
  - Evento sem etapas (todas as `step` nulas) → nenhuma regra de etapa dispara, sem exceção.
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar `eventAlerts` em `alerts.ts`.
- [ ] **Step 4:** `npm test` → passa.
- [ ] **Step 5:** Commit `feat(acompanhamento): regras de alerta por equipe`.

### Task 7: Tela Acompanhamento

**Files:**
- Create: `src/app/(app)/acompanhamento/page.tsx`, `src/components/acompanhamento/AcompanhamentoClient.tsx`
- Modify: `src/components/layout/SidebarNav.tsx` / `MobileNav.tsx` se precisarem do item novo; `src/lib/auth-routes.ts` se a rota precisar ser listada

**Interfaces:**
- Consumes: `eventAlerts`, `STATUS_SEVERITY` (Task 6); `getEventProjects`, `getEventBlocks`, `currentProject` (Task 3); `redactPrivateNotes`/`canSeePrivateNotes` (Tasks 1–2); `HistoryModal` (com aba Projeto, Task 5); `/api/records` com `projects`.

- [ ] **Step 1:** Página server: sem evento → `NoEventNotice`; `!canSeePrivateNotes(ctx)` → `redirect('/painel')`. Carrega times ativos, registros (sem redação, pois o leitor pode ver), ajustes, resumos, projetos, blocos, etapas.
- [ ] **Step 2:** Cliente: polling de 5 s em `/api/records` (mesmo padrão do `PainelClient`); `eventAlerts(…, today = data local yyyy-mm-dd)`; ordena por nº de alertas desc, depois `STATUS_SEVERITY` desc (sem mentoria por último), depois número. Cada item: `#número nome`, `StatusIcon`, motivos (um por linha), "Projeto: …", "Mentores: Nome (Bloco X), …" (mentorias dos 3 últimos blocos, sem repetir nome+bloco), botão **Histórico** abrindo `HistoryModal` com `canCorrect`. Cabeçalho "Acompanhamento — {evento}" e "Bloco X ativo". Seção recolhida "Sem alertas (N)" (`<details>`) com as demais equipes. Mobile: cartões empilhados.
- [ ] **Step 3:** `npx tsc --noEmit`, `npm run lint`, `npm run build` → passam.
- [ ] **Step 4:** Com o app rodando (skill `run`, se houver banco), entrar como facilitador e conferir: item no menu, lista, histórico com observações; como mentor, `/acompanhamento` redireciona.
- [ ] **Step 5:** Commit `feat(acompanhamento): tela de acompanhamento do facilitador`.

### Task 8: Documentação e verificação final

**Files:**
- Modify: `CLAUDE.md`, `docs/backlog.md`

- [ ] **Step 1:** `CLAUDE.md`: papel Facilitador em Visão geral e Regras de negócio; rota `/acompanhamento`; tabela `team_projects`; regra de privacidade de `obs`; projeto atual/pivô/correção; alertas em `src/lib/alerts.ts`. `docs/backlog.md`: marcar a parte 1 como feita, manter perfis e matching.
- [ ] **Step 2:** `npm test`, `npm run lint`, `npm run build` → tudo passa.
- [ ] **Step 3:** Commit `docs: facilitador, projeto atual e acompanhamento` e push.
