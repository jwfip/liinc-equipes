# Refinamento da UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Interface consistente, sem zoom nem estouro no celular, com os 13 itens do design.

**Architecture:** Tamanhos e estilos nas classes de `globals.css` e em poucos componentes comuns (`DateField`); regras puras testadas (`date-input`, `audio-guide`, `smoothPath`); varredura automática com Playwright na cópia do banco como critério de pronto.

**Tech Stack:** Next.js 14, Tailwind, Vitest, Playwright (auditoria).

**Spec:** `docs/superpowers/specs/2026-11-20-refinamento-ui-design.md`

## Global Constraints

- Campos 16px no celular, 14px a partir de `sm`; sem `maximum-scale`.
- Alturas: 44px normal (`.input`, `select`, `.btn-primary/.btn-secondary/.btn-danger`), 36px compacto (`.btn-sm`).
- Datas: exibição dd/mm/aaaa, envio aaaa-mm-dd com o mesmo `name`.
- Sem mudança de dados, regras ou actions (exceto mensagens).
- Impressão do relatório igual à atual.

## Review Focus

1. Data digitada inválida (31/02, "1/1/26") → "Data inválida", envio bloqueado (teste em Task 2).
2. Data vinda do banco (edição de evento) aparece em dd/mm/aaaa e salva sem mudar (teste em Task 2: `formatBrDate`/`parseBrDate` ida e volta).
3. Relatório impresso sem barra lateral, cabeçalho ou menu do celular (conferir em Task 7 com PDF do Chromium).
4. Gráfico com um ponto só ou etapas repetidas não desenha curva passando da etapa (teste em Task 5).
5. Roteiro do áudio pede só campos que a extração conhece (teste em Task 4).

---

### Task 1: Base visual
**Files:** `src/app/globals.css`, `src/components/admin/AdminForm.tsx`, `src/app/(app)/layout.tsx` (seletor de evento), telas que usam `h-[..]`/`min-h-[..]`/`py-1.5 text-xs` em botões e `lg:grid-cols-6` em formulários (varredura com `grep`).
- [ ] `.input`/`select`: `text-base sm:text-[14px]`, altura 44px (`h-11` para input/select; textarea sem altura fixa). Botões: `h-11`, `.btn-sm` = `h-9 px-3 text-xs`. `focus-visible:ring` em botões e links. AdminForm sem `h-[38px]`, alinhado por `items-end`. Formulários do admin: 1 coluna no celular.
- [ ] Trocar alturas avulsas pelas classes; ações de lista usam `.btn-sm`.
- [ ] Varredura (script de auditoria) sem campo < 16px no celular; `npx tsc --noEmit`, `npm test`.
- [ ] Commit `style(ui): tamanhos e fontes padronizados`.

### Task 2: Campo de data
**Files:** Create `src/lib/date-input.ts` (+ teste), `src/components/ui/DateField.tsx`; Modify `src/app/(app)/admin/eventos/page.tsx`, `src/app/(app)/admin/eventos/[id]/page.tsx`, `src/app/(app)/admin/eventos/[id]/blocos/page.tsx`.
**Interfaces:** `maskDate(raw: string): string` (só dígitos, até 8, barras após dia e mês); `parseBrDate(s: string): string | null` (dd/mm/aaaa válido → aaaa-mm-dd; data impossível → null); `formatBrDate(iso: string | null | undefined): string`; `DateField({ id, name, label?, required?, defaultValue?: string /* iso */ })`.
- [ ] Testes: `maskDate('21112026')` = `'21/11/2026'`; `maskDate('2a1')` = `'21'`; `parseBrDate('21/11/2026')` = `'2026-11-21'`; `parseBrDate('31/02/2026')`, `('1/1/26')`, `('')` = `null`; `parseBrDate('29/02/2028')` = `'2028-02-29'`; ida e volta com `formatBrDate`.
- [ ] Implementar; `DateField`: input texto visível (`inputMode="numeric"`, `placeholder="dd/mm/aaaa"`), input `type=hidden name` com o iso, ícone `Calendar` que chama `showPicker()` de um `<input type=date>` escondido (fallback: foca o texto); inválido → borda vermelha, "Data inválida", `setCustomValidity`.
- [ ] Trocar os 5 campos; testes, tsc; commit `feat(ui): campo de data dd/mm/aaaa`.

### Task 3: Configurações
**Files:** Create `src/app/(app)/conta/page.tsx`; Modify `src/components/layout/nav-items.ts`, `SidebarNav.tsx`, `MobileNav.tsx`, `src/app/(app)/layout.tsx`.
- [ ] `/conta`: título "Configurações", card com nome e usuário (só leitura), card "Senha" com o formulário de troca (reaproveitar o componente da `/conta/senha`). `ACCOUNT_NAV` vira `{ href: '/conta', label: 'Configurações', Icon: Settings }`, fora do "Acesso rápido"; na barra lateral fica no rodapé ao lado de "Sair"; no "Mais" do celular continua. `isActive` cobre `/conta/senha`.
- [ ] tsc, testes (ajustar teste de nav se houver); commit `feat(ui): página Configurações`.

### Task 4: Gravar relato
**Files:** Create `src/lib/ai/audio-guide.ts` (+ teste); Modify `src/components/mentoria/AudioRecorder.tsx`.
**Interfaces:** `AUDIO_GUIDE: Record<'mentoring' | 'specialist', { key: string; label: string }[]>` com os itens do spec; chaves `status`, `step`, `project`, `working`, `advice`, `pros`, `cons`, `obs`, `suggestion` / `topic`, `advice`, `obs`.
- [ ] Teste: toda chave do roteiro aparece no prompt de `buildExtractionMessages(kind, …)` (como `chave (`) — e o roteiro de mentoria tem 9 itens, o de atendimento 3.
- [ ] Recorder: estado parado = botão `.btn-secondary w-full` "Gravar relato" + `<details open>` "O que falar" com a lista; gravando = linha do contador e linha com "Parar e preencher" + cancelar (44px), lista visível; sem quebra em 390px.
- [ ] testes, tsc; commit `feat(ui): gravação compacta com roteiro do que falar`.

### Task 5: Curva do gráfico
**Files:** `src/lib/evolution.ts` (+ teste), `src/components/painel/EvolutionChart.tsx`.
**Interfaces:** `smoothPath(points: { x: number; y: number }[]): string`.
- [ ] Testes: 1 ponto → `"M x y"`; 2 pontos → começa em `M` e termina no 2º ponto; pontos com mesmo `y` → segmento sem variação de y nos controles (todos os y de controle iguais); controles nunca passam do intervalo [min(y_i, y_{i+1}), max] (monotonicidade).
- [ ] Implementar Fritsch–Carlson com segmentos `C`; usar no chart.
- [ ] testes; commit `feat(ui): gráfico de evolução com curvas`.

### Task 6: Painel, card da equipe e abas
**Files:** `src/components/painel/SummaryStrip.tsx`, `TeamCard.tsx`, `src/app/(app)/admin/eventos/[id]/layout.tsx`.
- [ ] Resumo: no celular (`md:hidden`) faixa de chips rolável (`overflow-x-auto`, sem barra visível), mesmas contagens, ícones e cores; grade atual `hidden md:grid`.
- [ ] Card: "Última mentoria · Nome" em linha própria abaixo do nome (`truncate`), selo à direita do nome.
- [ ] Abas: `overflow-x-auto` com degradê à direita no celular; aba ativa com `scrollIntoView({ inline: 'center' })` ao montar (componente cliente pequeno).
- [ ] tsc; commit `style(ui): painel, card da equipe e abas no celular`.

### Task 7: Relatório no layout do app
**Files:** mover `src/app/(print)/admin/eventos/[id]/relatorio/page.tsx` para `src/app/(app)/admin/eventos/[id]/relatorio/page.tsx` (remover o grupo `(print)` se vazio); `src/app/(app)/layout.tsx` (`print:hidden` em cabeçalho, barra lateral, menu do celular; `main` sem padding na impressão); layout das abas do evento não envolve o relatório (ou o relatório fica fora do layout de abas — conferir rota).
- [ ] Na tela: barra de ferramentas como card no topo; páginas das equipes como cards do padrão. Na impressão: igual a hoje.
- [ ] Gerar PDF com `page.pdf()` (Chromium) antes e depois na cópia do banco e comparar número de páginas e capa visualmente.
- [ ] tsc, build; commit `feat(ui): relatório na tela com o padrão do app`.

### Task 8: Pendências menores
**Files:** `PersonProfile.tsx`, `AcompanhamentoClient.tsx`, `MatchingPanel.tsx`, `BlockControl.tsx`, `src/actions/matching.ts`, `src/lib/groq.ts` (se precisar expor o status).
- [ ] Foco volta ao gatilho ao fechar o perfil; "ver mais" só se a experiência estiver cortada (medir `scrollHeight > clientHeight`); `role="alert"` no erro da sugestão; BlockControl mostra `r.message` 3 s e "Encerrando…"; erro 413/limite do Groq → "A sugestão ficou grande demais para a IA. Tente de novo mais tarde." (teste puro da função que escolhe a mensagem a partir do erro).
- [ ] testes, tsc; commit `fix(ui): pendências menores de interface`.

### Task 9: Auditoria final e documentação
- [ ] Refazer capturas e varredura (celular e computador) na cópia do banco; nenhuma violação dos critérios do spec; capturas antes/depois para o dono.
- [ ] Contraste: `text-slate-400` em texto informativo → `text-slate-500`.
- [ ] `CLAUDE.md` (tamanhos padrão, `DateField`, `/conta`, relatório no layout) e `docs/backlog.md`.
- [ ] `npm test`, build; commit `docs: refinamento da UI`.
