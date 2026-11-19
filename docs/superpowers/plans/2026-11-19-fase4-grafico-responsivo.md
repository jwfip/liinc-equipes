# Fase 4 — Gráfico de evolução, responsividade e identidade visual · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gráfico de evolução de cada equipe (etapa ao longo do tempo, com o status de cada mentoria), interface confortável no celular e logo oficial da Liinc em toda a plataforma.

**Architecture:** O gráfico é um componente SVG próprio (`EvolutionChart`) alimentado por uma função pura (`evolutionPoints`) que junta mentorias e ajustes de etapa em uma série temporal. Aparece no histórico da equipe e no relatório. A responsividade é feita por auditoria com screenshots a 390 px em cada página e correções pontuais; a navegação mobile vira barra inferior fixa. Logos SVG em `public/brand/` (derivadas do arquivo do Google Drive do usuário).

**Tech Stack:** Next.js 14, Tailwind, SVG inline (sem biblioteca de gráficos), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-18-plataforma-v2-design.md` (seções 5.8, 5.10, 5.11)

## Global Constraints

- Cores de status (CLAUDE.md): ok `#16A34A`, attention `#CA8A04`, emergency `#DC2626`, flying `#2563EB`. Ajuste da organização: marcador vazado navy `#1A2744`.
- Logo: `public/brand/liinc-logo.svg` (fundo claro: anéis `#FF7F00`, letras `#000222`) e `public/brand/liinc-logo-dark-bg.svg` (fundo escuro: letras `#F4F4F4`). Sempre com `alt="Liinc"`.
- Sem dependência nova de gráfico. Gráfico precisa funcionar na impressão (relatório) e em 320 px de largura.
- Mobile: largura de referência **390 px** (e checagem em 320 px); nenhuma página com rolagem horizontal; alvos de toque ≥ 44 px nos controles principais (navegação, botões de status/etapa, enviar).
- Acessibilidade: gráfico com `role="img"` e `aria-label` resumindo a trajetória; tabela/listagem textual equivalente disponível (`<details>` "Ver dados").

## Review Focus

- **Equipe sem nenhuma mentoria nem ajuste** → gráfico não aparece (mensagem "Sem dados de evolução ainda"), sem erro. (teste Task 1)
- **Uma única mentoria** → gráfico com um ponto, sem linha quebrada. (teste Task 1)
- **Etapa removida/renomeada depois do registro** (stepId que não está mais na lista) → ponto ignorado, sem quebrar. (teste Task 1)
- **Muitas mentorias (20+) em tela de 320 px** → gráfico continua legível (rótulos do eixo X reduzidos, sem sobreposição). (screenshot Task 2)
- **Relatório impresso** → gráfico aparece no PDF com cores. (verificação manual Task 2)

---

### Task 1: `evolutionPoints` (pura)

**Files:** Create `src/lib/evolution.ts`, `src/lib/evolution.test.ts`

**Interfaces — Produces:**
- `type EvolutionPoint = { at: number; stepIndex: number; stepLabel: string; status: string | null; source: 'mentoring' | 'organization'; who: string | null; blockLabel: string | null }`
- `evolutionPoints(steps: { id: number; label: string }[], mentoring: { createdAt; stepId: number | null; status: string | null; mentor?: { name: string } | null; block?: { label: string } | null }[], changes: { createdAt; stepId: number }[]): EvolutionPoint[]` — ordenado por `at` crescente; `stepIndex` = posição em `steps` (0-based); ignora `stepId` ausente da lista.
- `describeEvolution(points: EvolutionPoint[]): string` — texto para `aria-label`, ex.: `"3 registros: de 1 — Ideação a 2 — Protótipo; status atual Atenção"`; vazio → `"Sem dados de evolução ainda"`.

- [ ] Testes: vazio → `[]` e descrição "Sem dados de evolução ainda"; uma mentoria → 1 ponto; mentoria + ajuste intercalados por data; stepId inexistente ignorado; status do ajuste é `null` e `source` `'organization'`.
- [ ] FAIL → implementar → PASS. Commit `feat: evolution points for team charts`.

### Task 2: `EvolutionChart` no histórico e no relatório

**Files:** Create `src/components/painel/EvolutionChart.tsx`; Modify `src/components/painel/HistoryModal.tsx`, `src/app/(print)/admin/relatorio/page.tsx`

**Interfaces:** `<EvolutionChart steps points compact? />` — SVG responsivo (`viewBox`, `width="100%"`), eixo Y com os números das etapas (rótulo completo em `<title>`), linha em degraus laranja, marcadores coloridos por status (ajuste = círculo vazado navy), eixo X com o bloco ou a data (mostra no máx. ~6 rótulos; os demais só no `<title>` do ponto). `<details>` "Ver dados" com lista textual. Server-safe (sem hooks) para usar no relatório.
- Histórico: no topo da aba Mentorias, quando houver pontos.
- Relatório: em cada equipe, antes da linha do tempo.
- [ ] Implementar; screenshots a 1280/390/320 px com 1, 3 e 20 pontos (gerar dados na branch Neon de teste) e do relatório em modo impressão (`page.pdf`). Commit `feat: team evolution chart in history and report`.

### Task 3: Identidade visual

**Files:** `public/brand/*` (já gerados), `src/app/login/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/(print)/admin/relatorio/page.tsx`, `src/app/layout.tsx` (metadata/ícone)

- Login: logo (fundo claro) no lugar do emoji 🧭; título "Mentorias".
- Sidebar desktop e header mobile: logo fundo escuro substitui o texto "Liinc".
- Relatório: logo na capa.
- Favicon: `src/app/icon.svg` com só os anéis (recorte do SVG oficial).
- [ ] Screenshots login/painel/relatório. Commit `feat: official Liinc logo`.

### Task 3b: Ícones e azul da marca (pedido do usuário)

**Files:** `package.json` (`lucide-react`), `tailwind.config.ts`, `src/lib/constants.ts`, componentes com emoji (`SidebarNav`, `TeamCard`, `HistoryModal`, `FilterBar`, `SummaryStrip`, `PainelClient`, `MentoriaForm`, `AtendimentoForm`, `StepAdjuster`, `NoEventNotice`, admin, relatório).

- `lucide-react` substitui os emojis da interface. `src/components/ui/StatusIcon.tsx`: ok → `Route`, attention → `TriangleAlert`, emergency → `Siren`, flying → `Rocket`. Labels de status sem emoji (`'No caminho'`, `'Atenção'`, `'Emergência'`, `'Voando'`) e ícone renderizado ao lado. Ícones decorativos com `aria-hidden`.
- Azul da marca: `navy.DEFAULT` passa de `#1A2744` para `#000222` (cor das letras da logo oficial); `navy.light` `#0B1036`, `navy.muted` `#3A3F66`. Cor de status "Voando" (`#2563EB`) não muda.
- [ ] Screenshots antes/depois; `grep` não encontra emoji nos componentes de interface (exceto conteúdo digitado pelo usuário). Commit `feat: lucide icons and Liinc brand navy`.

### Task 4: Responsividade e acessibilidade

**Files:** conforme auditoria; certamente `src/app/(app)/layout.tsx`, `src/components/layout/SidebarNav.tsx`, `src/components/painel/{FilterBar,HistoryModal,StepAdjuster}.tsx`, `src/components/mentoria/{TeamPicker,MentoriaForm}.tsx`

- **Navegação mobile:** barra inferior fixa com Painel, Nova mentoria/atendimento, Admin (menu) e Conta; header mobile com logo + seletor de evento compacto. Conteúdo com `padding-bottom` para não ficar sob a barra.
- **Auditoria:** script Playwright percorre login, painel, histórico, mentoria, atendimento, conta/senha e todas as páginas admin a 390 e 320 px; falha se `scrollWidth > innerWidth`; salva screenshots. Corrigir cada achado.
- **Pendências de acessibilidade da fase 3:** abas do histórico com `id`/`aria-controls`/`aria-labelledby` e setas ←/→; "Ajustar etapa" com nome acessível incluindo a equipe e foco no select ao abrir; `TeamPicker` com teclado (↑/↓/Enter/Esc) ou trocar por `<select>` nativo com busca opcional.
- **`adjustTeamStep`** recusa evento encerrado e equipe inativa (`'Evento encerrado.'` / `'Equipe inativa.'`).
- [ ] Auditoria antes/depois anexada ao ledger. Commit(s) `feat: mobile navigation and responsive fixes`, `fix: accessibility of tabs, step adjuster and team picker`.

### Task 5: E2E, docs

- [ ] E2E contra a branch Neon: gráfico com mentorias + ajuste; histórico no celular; navegação inferior; relatório em PDF com gráfico e logo.
- [ ] CLAUDE.md: gráfico (`evolutionPoints`), logos em `public/brand/`, navegação mobile.

## Implantação

Sem migração de banco. PR + merge após aprovação.
