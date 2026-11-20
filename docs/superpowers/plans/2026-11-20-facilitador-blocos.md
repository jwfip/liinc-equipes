# Facilitador ativa blocos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O facilitador ativa e encerra os blocos do próprio evento no topo da tela Acompanhamento, com confirmação.

**Architecture:** Regra pura `canManageBlocks` e texto das confirmações `blockSwitchMessage`. A escrita do admin vira o helper `setActiveBlock`, reaproveitado pelas ações novas `activateEventBlock`/`closeActiveBlock`, que pegam o evento do contexto.

**Tech Stack:** Next.js 14 + Server Actions, Drizzle (`neon-http`, `db.batch`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-facilitador-blocos-design.md`

## Global Constraints

- Facilitador: só ativa e encerra; acesso ativo e evento ativo. Admin sempre (com evento selecionado).
- Mensagens: "Sem permissão para mudar o bloco.", "Bloco inválido para este evento."
- Confirmações com o texto exato do spec.
- Sem migração.

## Review Focus

1. Facilitador de evento encerrado → sem controle e ação recusada (teste em Task 1).
2. Bloco de outro evento enviado à ação → "Bloco inválido para este evento.", nada muda (conferir na Task 2).
3. Ativar o bloco que já está ativo → nada quebra (o batch desativa e reativa o mesmo).
4. Encerrar sem bloco ativo → botão não aparece; a ação, se chamada, não falha.
5. Admin continua ativando pelo `/admin/eventos/[id]/blocos` como antes (mesmo helper).

---

### Task 1: Regras puras

**Files:** Modify `src/lib/participation.ts` (+ teste); Create `src/lib/blocks.ts`, `src/lib/blocks.test.ts`

**Interfaces:**
- Produces: `canManageBlocks(v: { isAdmin: boolean; role: EventRole | null; mentorActive?: boolean; event: { active: boolean } | null }): boolean`; `blockSwitchMessage(current: string | null, next: string | null): string`.

- [ ] **Step 1: Testes que falham:** `canManageBlocks` — admin com evento (inclusive encerrado) true; admin sem evento false; facilitador ativo em evento ativo true; facilitador em evento encerrado false; facilitador desativado false; mentor false. `blockSwitchMessage('Bloco 2', 'Bloco 3')` = "Ativar Bloco 3? O Bloco 2 será encerrado e as novas mentorias passam a ser registradas no Bloco 3."; `(null, 'Bloco 3')` = "Ativar Bloco 3? As novas mentorias passam a ser registradas nele."; `('Bloco 2', null)` = "Encerrar Bloco 2? Os mentores não poderão registrar mentorias até outro bloco ser ativado."
- [ ] **Step 2:** `npm test` → falham.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` → passa.
- [ ] **Step 5:** Commit `feat(blocos): regras para o facilitador mudar o bloco`.

### Task 2: Ações e controle no Acompanhamento

**Files:** Modify `src/actions/admin.ts`, `src/app/(app)/acompanhamento/page.tsx`, `src/components/acompanhamento/AcompanhamentoClient.tsx`; Create `src/lib/block-writes.ts`, `src/actions/blocks.ts`, `src/components/acompanhamento/BlockControl.tsx`

**Interfaces:**
- Consumes: Task 1.
- Produces: `setActiveBlock(eventId: number, blockId: number | null): Promise<void>` (server-only; batch: desativa os ativos do evento, ativa o bloco se houver); `activateEventBlock(blockId: number): Promise<ActionResult>`; `closeActiveBlock(): Promise<ActionResult>`.

- [ ] **Step 1:** `activateBlock`/`deactivateBlock` do admin passam a usar `setActiveBlock` (comportamento igual).
- [ ] **Step 2:** Ações novas: sessão → contexto → `canManageBlocks` (senão a mensagem) → bloco do evento do contexto (senão "Bloco inválido para este evento.") → `setActiveBlock` → `revalidatePath` de `/painel`, `/mentoria`, `/acompanhamento`.
- [ ] **Step 3:** Página passa `canManageBlocks={canManageBlocks(ctx)}`. `BlockControl` no topo (só com permissão), conforme o desenho do spec: bloco ativo com data e "Encerrar bloco"; seletor dos outros blocos (ordem de data, "Bloco 3 — 21/11") e "Ativar"; aviso sem bloco ativo; `window.confirm(blockSwitchMessage(...))` antes de cada ação; erro em linha; depois do sucesso chama o `reload` do cliente.
- [ ] **Step 4:** Conferir no celular simulado (página temporária, removida depois). `npx tsc --noEmit`, `npm test`, build → passam.
- [ ] **Step 5:** Commit `feat(blocos): facilitador ativa e encerra blocos no Acompanhamento`. `CLAUDE.md` (regra e rota) e `docs/backlog.md` (item feito) no mesmo commit ou em `docs: facilitador ativa blocos`.
