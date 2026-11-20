# Matching por IA — design

Item do `docs/backlog.md` (acesso de facilitador, parte 3). Usa o **projeto atual** (`team_projects`) e o **perfil dos mentores** (`mentors.area`, `mentors.experience`).

## Intenção

Na prática, os mentores escolhem livremente a equipe que vão atender, ou o facilitador indica alguém. A plataforma não guarda escala. O matching é uma **sugestão sob demanda**: quando for conveniente, o facilitador pede para uma equipe e a IA aponta de que a equipe precisa agora e quem do evento combina com ela. O valor está no insight que pode ter passado batido. Ele não é gerado sempre nem automaticamente.

## Decisões (do dono)

- Sob demanda, pedido pelo facilitador; não automático e nem a cada mentoria.
- Fica na tela **Acompanhamento**, junto de cada equipe.
- Quem já atendeu a equipe é **só sinalizado**; a IA não prefere nem evita ninguém por isso, e a decisão fica com o facilitador.
- A última sugestão fica numa **tabela própria** (abordagem A).

## Objetivos

1. Botão **"Sugerir mentores"** por equipe no Acompanhamento (facilitador do evento e admin).
2. A sugestão traz: **do que a equipe precisa agora** (1 a 2 frases), **até 3 mentores** e **até 2 especialistas** do evento, cada um com **uma frase de motivo**.
3. A última sugestão de cada equipe fica guardada com data e autor; **"Atualizar sugestão"** gera de novo.

## Não-objetivos

- Gerar sozinho, a cada mentoria ou para o evento inteiro de uma vez.
- Escala ou atribuição dentro da plataforma, ou avisar mentores.
- Mostrar sugestões a mentores ou especialistas.
- Balancear a carga entre mentores.

## Anti-objetivos

- A sugestão vazar para quem não pode ver o perfil (os motivos citam o perfil, que é restrito).
- A IA inventar pessoas, ou sugerir alguém que não participa do evento ou está desativado.
- Travar a tela: a geração leva até ~20 s e precisa de estado de carregamento e erro legível.

## Abordagens

- **A) Tabela própria `team_matchings`** — *escolhida*. Lida só pela página do Acompanhamento, depois do guard. O isolamento impede o vazamento por construção.
- B) `team_summaries` com um tipo novo — descartada: o polling do painel (`/api/records`) devolve todos os resumos do evento aos mentores, então a sugestão vazaria se alguém esquecesse um filtro.
- C) Não guardar — descartada: some ao recarregar, outro facilitador não vê, e cada olhada gasta outra chamada.

## Design

### Dados

Tabela `team_matchings` (migração `drizzle/0007_matching.sql`, idempotente):

| coluna | tipo |
|---|---|
| `id` | serial PK |
| `event_id` | integer → events |
| `team_id` | uuid → teams, cascade; **único** (uma sugestão por equipe) |
| `content` | jsonb not null: `{ need: string, mentors: { id: uuid, reason: string }[], specialists: { id: uuid, reason: string }[] }` |
| `requested_by` | uuid → mentors, null (admin sem cadastro de mentor) |
| `model` | text |
| `created_at` | timestamp default now |

Gravação com upsert por `team_id`.

### Entrada da IA (função pura `buildMatchingMessages`)

- **Equipe:** nome; projeto atual e pivôs datados (`projectContext`); status e etapa atuais; textos dos alertas atuais (`eventAlerts`); as últimas **8 mentorias** (data, bloco, status, trabalhou em, orientação, a melhorar, observações para facilitadores, sugestão ao próximo mentor) e os últimos **5 atendimentos** (tema, orientação, observações).
- **Inclui as observações para facilitadores**: só facilitador e admin veem o resultado, e elas costumam conter o problema escondido.
- **Pessoas:** os participantes do evento com papel Mentor ou Especialista e acesso ativo (`mentors.active`), cada um com um **apelido curto** (`P1`, `P2`, …, em vez do uuid: menos tokens, e a IA não inventa identificadores), papel, área e experiência. Pessoas sem perfil entram só com nome e papel.
- **Limites (decisão do dono):** **nenhum campo de texto é cortado**; cortar no meio pode esconder justamente a parte importante. Só há um **teto de segurança para o pedido inteiro, de 60.000 caracteres**. Se ele for ultrapassado, saem **registros inteiros, dos mais antigos para os mais novos** (atendimentos e mentorias); o projeto, os alertas e os perfis nunca são cortados, e os **3 registros mais recentes vão sempre**, mesmo acima do teto (decidido na revisão: muitos perfis completos não podem apagar o histórico). Os delimitadores falsos continuam sendo neutralizados, como nos resumos (`clip`, sem o corte de tamanho). Os dados vão entre `<equipe>` e `<pessoas>` e são tratados como dado; a instrução manda ignorar comandos escritos ali (mesma defesa dos resumos).
- **Instruções (system):** escolher só entre as pessoas listadas, pelo apelido; até 3 mentores e até 2 especialistas; motivo em uma frase ligando o perfil a uma necessidade da equipe; `need` em 1 a 2 frases; não preferir nem evitar quem já atendeu a equipe; quem não tem perfil só entra se o histórico da equipe justificar; sem inventar fatos; português do Brasil. Responder **só com JSON** `{ "need": "...", "mentors": [{ "p": "P3", "reason": "..." }], "specialists": [...] }`.
- **Chamada:** `chat({ json: true, maxTokens: 2000 })` (o modelo raciocina antes de responder), modelo `SUMMARY_MODEL()`.

### Validação (função pura `parseMatching`)

- JSON inválido ou sem objeto → `null`.
- `need`: string com trim, até 400 caracteres.
- Cada item: apelido existente, papel compatível com a lista (mentor em `mentors`, especialista em `specialists`), sem repetição; corta em 3 e 2 itens; `reason` com trim, até 200 caracteres; item sem motivo é descartado.
- Traduz o apelido para o `id` real.
- Sem `need` e sem nenhum item válido → `null`, e a ação responde "A IA não devolveu sugestões. Tente de novo."

### Ação `suggestMatching(teamId)` (`src/actions/matching.ts`)

- `requireActiveSession` → `getEventContext` → `canSeePrivateNotes(ctx)`; senão "Sem permissão."
- Equipe do evento selecionado (`assertTeamInEvent`).
- `groqConfigured()`; senão "IA não configurada."
- Sem nenhum mentor ou especialista ativo no evento → "Nenhum mentor ou especialista escalado no evento." *(minha decisão)*
- Equipe sem projeto e sem nenhum registro → "Ainda não há informações da equipe para sugerir." *(minha decisão: a IA não teria base)*
- Monta a entrada, chama, valida, faz o upsert. Devolve `{ ok: true, matching }` (linha salva) ou `{ ok: false, error }`. Falha da IA: "A IA não respondeu agora. Tente de novo."
- `export const maxDuration = 60` no módulo da ação, se o Next permitir; senão, na página `/acompanhamento`.

### Interface (Acompanhamento)

- Cada equipe ganha o botão **"Sugerir mentores"** (ícone `Sparkles`). Com sugestão guardada, ele vira **"Ver sugestão"**, e o painel abre e fecha abaixo da equipe.
- Painel:
  ```
  Do que a equipe precisa agora
  Validar preço com clientes reais antes do pitch.

  Mentores
  • Evandro Temperini — forte em precificação e pitch.   [já atendeu no Bloco 2]
  • Ana Souza — ...
  Especialistas
  • Sergio Accioly — LGPD para o app que coleta dados de saúde.

  2 pessoas sem perfil preenchido — a IA não teve como avaliá-las.
  Sugerido pela IA em 20/11 14:32 por Fulano · Há registros novos desde então · [Atualizar sugestão]
  ```
- Nomes clicáveis abrem o perfil (`PersonProfile`).
- **"já atendeu no Bloco X"**: calculado pelos registros (mentorias e atendimentos daquela pessoa com a equipe); vários blocos aparecem separados por vírgula; atendimento sem bloco aparece como "fora de bloco".
- **"Há registros novos desde então"**: aparece quando existe registro da equipe mais novo que a sugestão.
- Pessoa sugerida que saiu do evento ou foi desativada depois da sugestão não é exibida.
- Carregando: botão desabilitado com "Gerando sugestão…" (até ~20 s). Erro aparece em linha, abaixo do botão.
- As sugestões vêm da página (server), depois do guard, por `getEventMatchings(eventId)`. Não entram no polling. Depois de gerar, o cliente usa a linha devolvida pela ação.

## Restrições

- Next.js 14, Server Actions, Drizzle `neon-http`, Groq via `src/lib/groq.ts` (timeout 20 s, sem SDK).
- Regras puras com teste: `buildMatchingMessages` (incluindo o teto de 60.000 e a ordem de descarte), `parseMatching`, "já atendeu" (`servedBlocks`).
- O tempo de espera pela IA continua o do cliente (`src/lib/groq.ts`, 20 s); a resposta é curta (`maxTokens: 2000`, com folga para o raciocínio do modelo).
- Atualizar `CLAUDE.md` (tabela, regra de privacidade, IA) e `docs/backlog.md`.

## Fica para o implementador

- Componentes da interface e o texto exato do prompt, respeitando as regras acima.
- Formato da data e do "por Fulano" (nome do mentor; "organização" quando `requested_by` for nulo).
