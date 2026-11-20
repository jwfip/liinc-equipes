# Facilitador ativa blocos — design (mudança pequena)

Item do `docs/backlog.md`.

## Intenção

O facilitador conduz o evento ao vivo, mas hoje depende do admin para virar o bloco de mentoria (`/admin/eventos/[id]/blocos`). Ele passa a **ativar e encerrar** os blocos do próprio evento.

## Decisões (do dono)

- O facilitador **só ativa e encerra** blocos já cadastrados. Criar e editar blocos continua com o admin.
- O controle fica na tela **Acompanhamento**, com **confirmação** antes de ativar ou encerrar, porque a troca muda o formulário de todos os mentores na hora.

## Abordagens

- **Controle no topo do Acompanhamento, reaproveitando a lógica do admin** — *escolhida*.
- Acesso do facilitador à tela de blocos do admin — descartada: abre `/admin` e mostra o "criar bloco", que não é dele.
- Tela própria de blocos para o facilitador — descartada: mais uma tela para duas ações, e o Acompanhamento já mostra o bloco ativo.

## Design

**Permissão.** Regra pura `canManageBlocks(ctx)` em `src/lib/participation.ts`: admin sempre (com evento selecionado); facilitador do evento, com acesso ativo e **evento ativo**. Mentor e especialista não.

**Servidor.**
- A escrita sai de `activateBlock`/`deactivateBlock` (admin) para um helper interno `setActiveBlock(eventId, blockId | null)`, usado pelo admin e pelas ações novas. Ele usa o mesmo `db.batch`: desativa o bloco atual e ativa o novo.
- Ações novas em `src/actions/blocks.ts`:
  - `activateEventBlock(blockId)` e `closeActiveBlock()`.
  - O evento vem do contexto (`getEventContext`), não de parâmetro. O bloco precisa ser desse evento, senão: "Bloco inválido para este evento."
  - Sem permissão: "Sem permissão para mudar o bloco."
  - Devolvem `ActionResult` e revalidam `/painel`, `/mentoria` e `/acompanhamento`.

**Tela (topo do Acompanhamento, para quem passa em `canManageBlocks`).**
```
Bloco ativo: Bloco 2 (20/11)            [Encerrar bloco]
Ativar outro bloco: [ Bloco 3 — 21/11 ▾ ]  [Ativar]
```
- Sem bloco ativo, a primeira linha mostra "Nenhum bloco ativo — os mentores não conseguem registrar mentorias."
- O seletor lista os outros blocos do evento em ordem de data.
- **Confirmações (texto definido):**
  - Ativar com bloco ativo: "Ativar {novo}? O {atual} será encerrado e as novas mentorias passam a ser registradas no {novo}."
  - Ativar sem bloco ativo: "Ativar {novo}? As novas mentorias passam a ser registradas nele."
  - Encerrar: "Encerrar {atual}? Os mentores não poderão registrar mentorias até outro bloco ser ativado."
- Depois de confirmar, a tela recarrega os dados (o polling já traz os blocos). Para quem não pode mudar, o topo continua só mostrando o bloco ativo, como hoje.

**Testes (puros).** `canManageBlocks` e o texto das confirmações (`blockSwitchMessage(current, next)` com `next = null` para encerrar).

## Não-objetivos

Criar, editar ou remover blocos; histórico de quem trocou o bloco; avisar os mentores da troca (o formulário já mostra o bloco ativo).

## Fica para o implementador

Componente do controle; reaproveitar `ActionButton` (que já tem confirmação) ou um formulário próprio para o seletor.
