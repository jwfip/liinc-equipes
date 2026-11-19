# Fase 6 — Relatório final por equipe (para a empresa) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relatório final de um evento, entregue à empresa: capa, visão geral e uma seção por equipe com resumo final (IA, editável pelo admin), gráfico de evolução, linha do tempo das mentorias e atendimentos — com seções que o admin escolhe mostrar ou ocultar. PDF pela impressão do navegador.

**Architecture:** Página `/admin/eventos/[id]/relatorio` (layout de impressão, sem sidebar), substitui `/admin/relatorio` (que passa a redirecionar para o evento selecionado). Resumo final = `team_summaries` com `kind = 'final'` (tabela da fase 5), gerado por `generateFinalSummary` (servidor) e editável (`edited_by_admin = true` impede sobrescrever sem confirmação). Geração em lote feita pelo navegador, uma equipe por vez, com progresso — evita o limite de tempo de uma única função. Opções de seções via parâmetros da URL (`?ocultar=cons,obs`), para o que se vê ser exatamente o que imprime.

**Tech Stack:** Next.js 14, Groq (mesmo cliente da fase 5), `EvolutionChart` (fase 4), Vitest, Playwright (`page.pdf`).

**Spec:** `docs/superpowers/specs/2026-11-18-plataforma-v2-design.md` (seção 5.9)

## Global Constraints

- Público: **empresa**. Tom do resumo final: profissional, construtivo, sem jargão interno; 1 parágrafo de 4 a 6 frases (trajetória, ponto alto, desafio, situação final); máx. ~900 caracteres; não inventar.
- Entrada do resumo final: todas as mentorias (até 20 mais recentes) + atendimentos (até 10) da equipe, campos truncados, conteúdo entre delimitadores tratado como dado (mesmo padrão da fase 5).
- Seções ocultáveis (chaves da URL): `cons` (A melhorar), `obs` (Observações para facilitadores), `suggestion` (Sugestão ao próximo mentor), `atendimentos`, `timeline` (linha do tempo detalhada), `chart`. **Padrão: `obs` e `suggestion` ocultas** (são notas internas da organização).
- Resumo editado pelo admin (`edited_by_admin`) **nunca** é sobrescrito em lote; individualmente, só com confirmação ("Substituir o texto editado?").
- Só admin acessa. Equipes inativas sem registros ficam fora.
- Impressão: capa em página própria; cada equipe começa em página nova; controles de edição/geração não aparecem no PDF.

## Review Focus

- **Equipe sem mentorias** (só atendimentos ou nada) → seção sem gráfico/timeline, resumo final usa o que houver ou mostra "Sem registros suficientes para um resumo". (teste Task 1)
- **Parâmetro de URL inválido** (`?ocultar=xyz,,cons`) → ignora o desconhecido, aplica o válido. (teste Task 1)
- **Geração em lote com falha numa equipe** → continua as demais e lista as que falharam com "Tentar de novo". (E2E Task 3)
- **Admin edita e depois clica "Gerar todos"** → editado preservado. (teste Task 1 + E2E)
- **PDF com 15+ equipes** → quebra de página por equipe, gráfico legível, sem controles. (E2E Task 3)

---

### Task 1: Regras puras

**Files:** `src/lib/report/options.ts` (+test), `src/lib/ai/final-summary.ts` (+test)

- `REPORT_SECTIONS = ['cons','obs','suggestion','atendimentos','timeline','chart'] as const`; `DEFAULT_HIDDEN = ['obs','suggestion']`.
- `parseHidden(param: string | string[] | undefined): Set<Section>` — sem parâmetro → padrão; `ocultar=` (vazio) → nada oculto; valores desconhecidos ignorados.
- `hiddenToQuery(hidden: Set<Section>): string`.
- `teamsToGenerate(teams: {id}[], finals: {teamId, editedByAdmin}[], overwriteEdited: boolean): string[]`.
- `buildFinalSummaryMessages(team, steps, mentoring, specialist)` + reuso de `cleanSummary` com limite 900.
- [ ] Testes (incluindo os do Review Focus). FAIL → implementar → PASS. Commit.

### Task 2: Geração e edição do resumo final

**Files:** `src/lib/ai/team-summary.ts` (+ `generateFinalSummary`), `src/actions/report.ts`

- `generateFinalSummary(teamId)`: sem registros → `'Sem registros suficientes para um resumo.'`; senão gera e faz upsert `kind='final'`, `edited_by_admin=false`.
- Actions (admin): `generateFinal(teamId, { overwriteEdited }): ActionResult` — recusa editado sem `overwriteEdited`; `saveFinalSummary(teamId, content)` — limpa espaços, máx. 2000 caracteres, `edited_by_admin=true`; `resetFinalSummary(teamId)` — volta a gerar pela IA (com confirmação na UI).
- [ ] tsc/tests. Commit.

### Task 3: Página do relatório

**Files:** `src/app/(print)/admin/eventos/[id]/relatorio/page.tsx` (+ componentes em `src/components/report/`), `src/app/(print)/admin/relatorio/page.tsx` (vira redirect), `src/components/admin/EventTabs.tsx` (aba "Relatório"), `src/components/layout/nav-items.ts`

- **Barra de ações (não impressa):** "Gerar resumos finais" (lote no navegador, uma equipe por vez, barra de progresso, falhas listadas com "Tentar de novo"; checkbox "Substituir textos editados"), checkboxes de seções (alteram a URL), "Baixar PDF".
- **Capa (página 1):** logo Liinc, nome do evento, empresa, datas, nº de equipes, mentores e especialistas, nº de mentorias e atendimentos, distribuição final de status (barras), etapas do evento.
- **Por equipe (página nova):** nome e número; status e etapa finais; **resumo final** (no modo tela: texto + "Editar" → textarea com "Salvar"/"Cancelar" e "Gerar com IA"; selo "Editado" quando editado); gráfico (se `chart` visível e houver pontos); linha do tempo (se `timeline` visível): bloco, data, mentor, status, etapa, projeto, orientação, pontos positivos, a melhorar (se `cons`), observações (se `obs`), sugestão (se `suggestion`); atendimentos (se `atendimentos`).
- `/admin/relatorio` → redirect para `/admin/eventos/<evento selecionado>/relatorio` (ou `/admin/eventos` se nenhum).
- [ ] E2E na branch Neon: gerar todos (com Groq real), editar uma equipe, gerar todos de novo (editado preservado), ocultar `cons` e `atendimentos`, gerar PDF e conferir páginas (texto extraído do PDF com `pdftotext` se disponível) e screenshot. Commit.

### Task 4: Docs

- [ ] CLAUDE.md (rota, `kind='final'`, opções de seções) e README.

## Implantação

Sem migração (usa `team_summaries` da fase 5). PR + merge após aprovação.
