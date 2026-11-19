# Acesso de facilitador — parte 1: papel, projeto atual, observações privadas e Acompanhamento

Item do `docs/backlog.md`. O backlog descreve três entregas; esta é a **primeira**. As outras duas — **perfil dos mentores** e **sugestão de matching por IA** — terão design próprio depois, nesta ordem.

## Intenção

O **facilitador** conduz o evento. Quando uma equipe começa a ficar para trás, ele investiga o caso com os mentores (o problema pode aparecer nos registros ou estar escondido na equipe) e decide como intervir. O papel da plataforma é **indicar que um possível problema pode estar acontecendo e mostrar onde olhar**. A intervenção é do facilitador e fica fora da plataforma.

Junto com isso entram duas mudanças que o facilitador e o futuro matching precisam:

- **Projeto atual** da equipe, fixo entre mentorias até alguém registrar um **pivô** (hoje cada mentor reescreve "o projeto" num campo que mistura projeto e trabalho do dia).
- **Observações para facilitadores** passam a ser **privadas** (hoje qualquer participante as vê).

## Objetivos

1. Papel **Facilitador** por evento, ao lado de Mentor e Especialista.
2. Facilitador vê o **Painel Geral** como os mentores (para não depender deles para nenhuma informação que já está lá), com as observações privadas.
3. Tela **Acompanhamento**: lista de equipes que merecem atenção, cada uma com o motivo em uma linha e acesso direto às evidências (histórico, resumo, quem mentorou e quando).
4. **Projeto atual** por equipe, com histórico de pivôs.
5. **Observações para facilitadores** visíveis só a facilitador, admin e ao próprio autor.

## Não-objetivos

- Registrar intervenções, marcar equipe como "em investigação"/"resolvida", notificar alguém. A plataforma só aponta.
- Facilitador registrar mentoria ou atendimento, ajustar etapa, acessar `/admin` ou o relatório final. (A única escrita do facilitador é corrigir o texto do projeto atual.)
- Pessoa com mais de um papel no mesmo evento (decidido: **um papel por pessoa por evento**).
- Perfil de mentores e matching por IA (próximas entregas).
- Deduzir o projeto atual a partir de registros antigos.

## Anti-objetivos

- Alerta que o facilitador não consegue verificar. Cada alerta tem motivo explícito, conferível no histórico — por isso regras simples, sem IA.
- Observação privada vazando por outro caminho: resposta do `/api/records`, resumo da IA exibido no painel, cache no navegador.
- Excesso de alertas no início de cada bloco (ex.: "sem mentoria no bloco ativo" logo que o bloco abre marcaria todas as equipes).

## Abordagens consideradas

- **A) Tela própria "Acompanhamento" + acesso ao Painel Geral** — *escolhida.* O facilitador quer responder "o que investigo agora?"; uma lista com motivos responde melhor que um painel organizado por status. O painel continua acessível, igual ao dos mentores.
- **B) Alertas dentro do painel** (selo nos cards + filtro). Uma tela só, mas o selo disputa com os grupos de status, carrega os cards no celular e dilui os alertas entre muitos cards.
- **C) As duas.** Mais completo, o dobro de UI para manter. Fica fácil de adicionar depois porque as regras de alerta são uma função pura.

---

## Design

### 1. Papel Facilitador

- `event_members.role` aceita `'facilitator'` (texto livre hoje; sem migração de schema). `EventRole` em `src/lib/event-pick.ts` vira `'mentor' | 'specialist' | 'facilitator'`.
- Rótulo: **Facilitador**. Em `/admin/eventos/[id]/participantes`, a opção entra no select de papel; a troca rápida de papel (hoje alterna mentor ↔ especialista) passa a ser um select com os três. A cópia de participantes de outro evento copia o papel como já faz.
- `registrationError(ctx, kind)`: facilitador → `'Facilitadores acompanham o evento e não registram mentorias nem atendimentos.'` (para os dois `kind`). Hoje a função trata qualquer papel ≠ `specialist` como mentor; isso precisa virar comparação explícita.
- Navegação (`mainNav`): facilitador vê **Painel Geral** e **Acompanhamento**; não vê "Nova mentoria/atendimento". Admin vê **Acompanhamento** também (como admin, não precisa ser participante para ver).
- `/mentoria` para facilitador: mostra o aviso do `registrationError` (mesma mecânica de hoje).
- Helper `canSeePrivateNotes(ctx)` = `ctx.isAdmin || ctx.role === 'facilitator'`, usado em todos os pontos abaixo.

### 2. Observações privadas

Vale para `obs` de mentorias **e** de atendimentos.

- **Servidor filtra.** `getEventRecords` (usado pelo painel e pelo `/api/records`) recebe se o leitor pode ver notas privadas; quando não pode, devolve `obs = null` **exceto** nos registros cujo `mentor_id` é o do próprio leitor (o autor continua vendo o que escreveu). Nada de esconder só na UI.
- **Resumos da IA do painel** (`buildMentoringSummaryMessages`, `buildSpecialistSummaryMessages`): `obs` sai do prompt. O resumo é visível a todos e repetiria a nota. O parecer final (`final-summary.ts`) já exclui `obs`.
- Resumos já gerados podem conter trechos de observações. **Minha decisão:** não regenerar automaticamente; eles serão atualizados na próxima mentoria de cada equipe ou pelo botão "Atualizar resumo". Registrar isso nas notas da entrega para o admin decidir se clica em "Atualizar" nas equipes do evento em curso.
- **Formulários:** campo `obs` com rótulo **"Observações para facilitadores"** nos dois formulários (no de atendimento hoje é só "Observações") e uma linha de ajuda abaixo: *"Visível só para facilitadores e organização."*
- **Painel e histórico:** `TeamCard` e `HistoryModal` só mostram observação quando o dado vier preenchido (já é assim), então o filtro do servidor basta. Para quem vê, o selo "Observação" muda para **"Para facilitadores"** para deixar claro que é privado.
- **Relatório final:** inalterado (só admin; `obs` já oculto por padrão).
- **Extração por áudio:** inalterada — o mentor confere o que vai no campo antes de enviar.

### 3. Projeto atual

**Dados.** Nova tabela `team_projects`:

| coluna | tipo | |
|---|---|---|
| `id` | serial PK | |
| `event_id` | integer → events | |
| `team_id` | uuid → teams, cascade | |
| `description` | text not null | |
| `kind` | text not null | `'initial' \| 'pivot' \| 'correction'` |
| `record_id` | uuid → mentoring_records, null | mentoria que registrou (nulo em correção) |
| `created_by` | uuid → mentors, null | quem escreveu (nulo se for admin sem cadastro de mentor) |
| `created_at` | timestamp default now | |

Projeto atual = linha mais recente da equipe. Função pura `currentProject(rows)` em `src/lib/project.ts`.

**Formulário de mentoria** (`MentoriaForm`):

- Equipe **sem projeto**: campo obrigatório **"Projeto da equipe"** (*"Descreva o projeto em uma ou duas frases. Os próximos mentores vão ver este texto."*). Salvar cria linha `initial`.
- Equipe **com projeto**: mostra o projeto atual em bloco somente leitura (com "desde dd/mm, registrado por Fulano") e uma caixa **"A equipe pivotou"**. Marcando, abre o campo obrigatório **"Novo projeto"** (pré-preenchido vazio). Salvar cria linha `pivot`.
- O campo `working` passa a se chamar **"No que a equipe trabalhou nesta mentoria? \*"**. Coluna e dados antigos não mudam.
- O projeto exibido depende da equipe escolhida; a página já carrega as equipes, passa a carregar também o projeto atual de cada uma.
- **Corrida:** dois mentores abrem o formulário de uma equipe sem projeto e ambos enviam. O segundo envio vira um novo `initial` mais recente; aceitável (ganha o mais recente, histórico guarda os dois). Não bloquear.
- `submitMentoria` grava registro + linha de projeto com `db.batch` (o `id` do registro é gerado no servidor com `crypto.randomUUID()` para poder referenciá-lo no mesmo batch).
- **Edição de mentoria** (`updateMentoria`): não altera projeto. O bloco do projeto aparece só leitura na edição. **Minha decisão**, para evitar o caso "editei e desfiz o pivô". Correções passam pelo facilitador ou admin.

**Correção pelo facilitador ou admin:** no histórico da equipe (aba nova, abaixo), facilitador do evento e admin têm **"Corrigir texto do projeto"** (action `correctProject`, guard `canCorrectProject(ctx)` = `ctx.isAdmin || ctx.role === 'facilitator'`, evento ativo para facilitador), que cria linha `correction` com o texto novo. Correção não conta como pivô em lugar nenhum. Só corrige equipe que já tem projeto.

**Mentores e especialistas** fora do formulário veem o projeto atual (card, histórico) sem alterar. O formulário de atendimento mostra o projeto atual da equipe escolhida, somente leitura, como contexto.

**Relato por áudio:** a extração ganha a chave `project` (descrição do projeto) e `pivot` (booleano). Se a equipe não tem projeto e o campo está vazio, preenche com o selo "Sugerido pela IA — confirme". Se tem projeto e a IA indicar `pivot: true`, **não** marca a caixa sozinha: mostra um aviso "A IA identificou um possível pivô — confira" ao lado da caixa, com o texto sugerido disponível para aplicar.

**Onde aparece:**

- **Card do painel:** linha "Projeto: …" (truncada em 2 linhas) e, se houve pivô nos últimos 2 blocos, um selo **"Pivotou"** (ícone lucide `Shuffle`).
- **Histórico** (`HistoryModal`): nova aba **Projeto** com a lista cronológica (inicial, pivôs, correções; autor, data, bloco). Pivô também marcado na linha da mentoria correspondente.
- **Resumo da IA do painel:** a linha de cada registro deixa de usar `working` como "Projeto"; o prompt recebe o projeto atual (e pivôs com data) num campo próprio e `working` como "Trabalhou em".
- **Relatório final:** "Projeto atual" na página da equipe e lista de pivôs com data; o prompt do parecer final recebe o projeto atual e os pivôs.

**Eventos em andamento:** equipes começam sem projeto; o próximo mentor de cada uma preenche.

**Dados no painel:** `getEventProjects(eventId)` em `src/lib/event-data.ts`, incluído na página do painel e na resposta do `/api/records`, para o card refletir um pivô no polling. O histórico da aba Projeto vem da mesma lista.

**Histórico para facilitador:** `defaultHistoryTab` abre na aba Mentorias (como para mentor). A edição de registro (`/mentoria/edit/[id]`) já lê o registro direto do banco, então o autor continua vendo a própria observação.

### 4. Tela Acompanhamento — `/acompanhamento`

Acesso: facilitador do evento selecionado ou admin. Outros papéis → redireciona para `/painel`.

```
Acompanhamento — Evento X                          Bloco 3 ativo
──────────────────────────────────────────────────────────────────
#07 Alfa   [Emergência] Parada na etapa 2 há 2 blocos
           Projeto: app de logística reversa
           Mentores: Ana (Bloco 3), Carlos (Bloco 2)      [Histórico]
#12 Beta   Sem mentoria no Bloco 2 · 2 etapas atrás do grupo
           ...
──────────────────────────────────────────────────────────────────
Sem alertas (14)  ▸ lista recolhida com as demais equipes
```

- Ordem: mais alertas primeiro; empate por gravidade do status (Emergência → Atenção → No caminho → Voando → sem mentoria) e depois número da equipe.
- Cada equipe mostra: número, nome, status atual (`StatusIcon`), motivos (uma linha cada), projeto atual, mentores que a atenderam nos últimos 3 blocos (nome + bloco) e botão **Histórico** (reaproveita `HistoryModal`, com observações).
- Atualização: mesma fonte do painel (`/api/records` com polling de 5 s, já filtrado por permissão), regras calculadas no cliente com a função pura.
- Celular: lista em cartões empilhados; mesmo conteúdo.

**Regras de alerta** — função pura `teamAlerts(input)` em `src/lib/alerts.ts`, com testes. Considera só mentorias (`kind = 'mentoring'`) e equipes ativas. "Blocos" = blocos do evento ordenados por `date`, depois `id`.

| Alerta | Regra | Texto |
|---|---|---|
| Status crítico | status atual (regra do card) é `emergency` ou `attention` | "Emergência" / "Atenção" |
| Status piorou | gravidade do status da última mentoria > da penúltima (`flying` 0 < `ok` 1 < `attention` 2 < `emergency` 3) | "Status piorou: No caminho → Atenção" |
| Parada na etapa | nas últimas **2** mentorias de blocos distintos (blocos consecutivos em que a equipe teve mentoria) a etapa é a mesma e não houve ajuste do admin para outra etapa depois delas | "Parada na etapa 2 há 2 blocos" (conta quantos) |
| Etapa voltou | etapa atual com `position` menor que a da mentoria anterior | "Etapa voltou: 4 → 2"; se houve pivô entre as duas, "Pivotou e voltou para a etapa 2" |
| Atrás do grupo | `position` da etapa atual ≤ mediana das posições das equipes com etapa − 2 | "2 etapas atrás do grupo" |
| Sem mentoria | a equipe não tem mentoria no **último bloco anterior ao bloco ativo** (ou no último bloco, se nenhum ativo e o bloco já tem data passada) | "Sem mentoria no Bloco 2" |

Equipe sem nenhuma mentoria: só entra pelo alerta "Sem mentoria" (as outras regras não se aplicam). O alerta de "Sem mentoria" ignora o bloco ativo de propósito (evita marcar todas as equipes no começo do bloco).

### 5. Fora desta entrega, para registrar

- Limiar "2 blocos" e "2 etapas" são constantes no código; tornar configuráveis por evento só se o uso pedir.
- Selo de alerta nos cards do painel (abordagem C), se fizer falta.

## Restrições

- Next.js 14 App Router, Server Actions, Drizzle, `neon-http` (sem transação interativa: `db.batch`).
- Migração SQL idempotente em `drizzle/NNNN_*.sql` para `team_projects`, com nomes de FK no padrão do Drizzle; `drizzle-kit push` sem pendências depois.
- Regras de negócio puras com teste em `src/lib/*.test.ts` (`alerts`, `project`, `participation`, filtro de `obs`).
- Ícones lucide, sem emoji. Paleta Liinc.
- Atualizar `CLAUDE.md` (papéis, rotas, tabela nova, regras de privacidade).

## Decisões deixadas ao implementador

- Formato exato do helper de filtro de `obs` (parâmetro em `getEventRecords` ou função de pós-processamento pura), desde que aplicado no servidor em painel, `/api/records` e qualquer outra leitura de registros para não-admin.
- Estrutura de componentes da tela Acompanhamento e do bloco "Projeto" no formulário.
- Ícone do item de menu Acompanhamento (sugestão: `Radar`).
