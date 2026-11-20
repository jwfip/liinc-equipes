# Perfil dos mentores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin preenche área de atuação e experiência de cada pessoa; facilitador e admin veem esse perfil na tela Acompanhamento.

**Architecture:** Duas colunas opcionais em `mentors`. Validação pura em `src/lib/mentor-profile.ts`; edição por `updateMentor` (admin). O Acompanhamento carrega os perfis dos participantes no servidor (só para quem passa em `canSeePrivateNotes`) e os mostra num diálogo e numa seção recolhida.

**Tech Stack:** Next.js 14 App Router + Server Actions, Drizzle (`neon-http`), Vitest, Tailwind, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-20-perfil-mentores-design.md`

## Global Constraints

- Campos: "Área de atuação" (até 120 caracteres) e "Experiência" (até 2000), ambos opcionais, texto livre.
- Restrito: perfil só sai do servidor para facilitador ativo do evento e admin; painel e `/api/records` não ganham esses campos.
- Ajuda nos campos: "Visível só para facilitadores e organização."
- Sem perfil: "Perfil não preenchido".
- Migração idempotente `drizzle/0006_perfil_mentores.sql`.
- Ícones lucide, sem emoji; textos em português do Brasil.

## Review Focus

1. Admin apaga a área (campo vazio) → grava `null`, a lista volta a mostrar "Perfil não preenchido" (teste em Task 1).
2. Nome só com espaços → erro "Informe o nome.", nada gravado (teste em Task 1).
3. Texto acima do limite → cortado no limite, sem erro (teste em Task 1).
4. Mentor (não facilitador) abre `/acompanhamento` → redireciona antes de qualquer perfil ser lido (já coberto pelo guard; conferir na revisão).
5. Mesmo mentor em dois blocos aparece como "Ana (B4), Ana (B3)" e cada nome abre o mesmo perfil (teste em Task 2).

---

### Task 1: Campos, migração e edição pelo admin

**Files:**
- Create: `src/lib/mentor-profile.ts`, `src/lib/mentor-profile.test.ts`, `drizzle/0006_perfil_mentores.sql`
- Modify: `src/schema.ts` (`mentors`), `src/actions/admin.ts`, `src/app/(app)/admin/mentores/page.tsx`

**Interfaces:**
- Produces: `readMentorProfile(fd: FormData): { name: string; area: string | null; experience: string | null }` (lança `Error('Informe o nome.')`); `updateMentor(id: string, fd: FormData): Promise<ActionResult>`; colunas `mentors.area`, `mentors.experience`.

- [ ] **Step 1: Testes que falham** em `mentor-profile.test.ts`: trim de nome/área/experiência; vazio → `null`; nome `'   '` lança `'Informe o nome.'`; área com 200 caracteres → 120; experiência com 2500 → 2000.
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar `readMentorProfile`; colunas `area text`, `experience text` no schema; SQL `ALTER TABLE mentors ADD COLUMN IF NOT EXISTS area text; … experience text;`; `updateMentor` (`requireAdmin`, `readMentorProfile`, `update mentors`, também atualiza `users.name` pelo `email` do mentor, `revalidatePath('/admin/mentores')`, mensagem "Perfil de {nome} atualizado."). Na página: abaixo do usuário, a área (ou "Perfil não preenchido" em cinza); botão **Editar perfil** abre um formulário inline (`<details>` + `AdminForm`) com Nome, Área de atuação (input), Experiência (textarea) e a ajuda.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit` → passam.
- [ ] **Step 5:** Commit `feat(perfil): área e experiência no cadastro, editáveis pelo admin`.

### Task 2: Perfis na tela Acompanhamento

**Files:**
- Modify: `src/lib/follow-up.ts` (+ teste), `src/lib/event-data.ts`, `src/app/(app)/acompanhamento/page.tsx`, `src/components/acompanhamento/AcompanhamentoClient.tsx`
- Create: `src/components/acompanhamento/PersonProfile.tsx`

**Interfaces:**
- Consumes: colunas da Task 1; `canSeePrivateNotes`.
- Produces: `recentMentors(...)` passa a devolver `{ mentorId: string; name: string; block: string }[]` (records precisam de `mentorId`); `type EventPerson = { id: string; name: string; role: 'mentor' | 'specialist'; area: string | null; experience: string | null }`; `getEventPeople(eventId): Promise<EventPerson[]>` (participantes Mentor/Especialista, ordem por nome; facilitadores fora); `groupPeople(people: EventPerson[]): { mentor: EventPerson[]; specialist: EventPerson[] }` em `follow-up.ts`.

- [ ] **Step 1: Testes que falham:** `recentMentors` devolve objetos (`[{ mentorId: 'c', name: 'Caio', block: 'B4' }, …]`), mantém um item por pessoa+bloco (Ana em B4 e B3 → dois itens); `groupPeople` separa por papel e ordena por nome (`localeCompare` pt).
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar. Página: depois do guard, `getEventPeople(eventId)` e passa `people`. Cliente: nomes da linha "Mentores" viram `<button>` que abre `PersonProfile` (diálogo `role="dialog"`, Esc fecha, nome, papel "Mentor"/"Especialista", área, experiência com quebra de linha, "Perfil não preenchido" quando vazio). Seção `<details>` **"Mentores e especialistas do evento (N)"** abaixo de "Sem alertas": grupos "Mentores" e "Especialistas", cada pessoa com nome, área e experiência em `line-clamp-3` com botão "ver mais" (abre o mesmo diálogo).
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, build → passam.
- [ ] **Step 5:** Commit `feat(perfil): perfis de mentores e especialistas no Acompanhamento`.

### Task 3: Documentação e verificação

- [ ] **Step 1:** `CLAUDE.md`: colunas `area`/`experience` em `mentors`, regra de privacidade do perfil, edição em `/admin/mentores`. `docs/backlog.md`: perfil feito; falta matching.
- [ ] **Step 2:** `npm test`, build → passam. Commit `docs: perfil dos mentores`.
