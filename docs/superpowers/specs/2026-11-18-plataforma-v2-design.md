# Plataforma Liinc Mentorias — v2 (eventos, login, especialistas, IA, evolução)

Data: 2026-11-18 · Status: em revisão

## 1. Intenção e porquê

Hoje a plataforma serve a **um evento só**: equipes, mentores, blocos e registros vivem soltos no banco, e para rodar um novo evento a organização apaga tudo e recadastra. Além disso o login é fraco (usuário + código global do evento — quem sabe o código entra como qualquer mentor), as etapas do processo são fixas no código, e não há visão de evolução nem síntese do que os mentores escreveram.

A v2 transforma a plataforma em algo **reutilizável entre eventos**, com:

- **Eventos** como entidade principal; equipes, blocos e etapas pertencem a um evento.
- **Mentores persistentes** (são as pessoas que fazem login) e selecionados por evento, com um **papel por evento**: *Mentor* ou *Especialista*.
- **Login individual com senha.**
- **Especialistas** (eventos dentro de empresas): pessoas que tiram dúvidas das equipes e registram **Atendimentos**, separados das **Mentorias** da maratona.
- **Resumo por IA** (Groq) da situação de cada equipe a cada nova mentoria.
- **Gráfico de evolução** de cada equipe (sem IA, a partir de status/etapa informados).
- **Relato por áudio**: o mentor/especialista grava, a plataforma transcreve e preenche o formulário.
- **Relatório final por evento**, uma seção por equipe, para entregar à **empresa** interessada.
- Correções de bugs de formulários, melhor responsividade, identidade visual Liinc.

## 2. Objetivos, não-objetivos, anti-objetivos

**Objetivos**
- Criar um novo evento sem tocar no banco manualmente.
- Reaproveitar o cadastro de mentores entre eventos.
- Registrar mentorias e atendimentos pelo celular, inclusive por voz.
- Ver de relance a situação e a trajetória de cada equipe.
- Gerar um relatório final apresentável à empresa.

**Não-objetivos**
- Reaproveitar histórico de equipes entre eventos (equipes são recadastradas por evento).
- Acesso de membros das equipes à plataforma.
- Recuperação de senha por e-mail (redefinição é feita pelo admin).
- Trilhas de etapas diferentes por equipe dentro do mesmo evento.
- WebSocket / tempo real (polling continua suficiente).

**Anti-objetivos (seria fracasso mesmo funcionando)**
- Atendimentos de especialistas alterando status, gráfico ou resumo de evolução da equipe.
- Fluxo de registro mais lento que o atual (o mentor está entre sessões, no celular).
- Custo de IA relevante — deve ficar em centavos por evento.
- Perda dos logins/mentores atuais na migração.

## 3. Restrições

- Stack atual mantida: Next.js 14 App Router, Neon (driver `neon-http`, **sem transações interativas**), Drizzle, NextAuth v5 (Credentials + JWT), Tailwind, Vercel.
- Acesso ao banco via Server Actions; API routes só para polling (`/api/records`) e upload de áudio se necessário (limites de body de Server Action).
- Vercel free: funções com timeout curto (~10s hobby / 60s com config) — chamadas de IA devem ser rápidas ou fora do caminho crítico do submit.
- Groq: token fornecido pelo usuário. Nunca no código; variável `GROQ_API_KEY`.
- Identidade visual Liinc (cores já no `tailwind.config.ts`; logo a buscar no Google Drive ou pedir ao usuário).
- Interface em português.

## 4. Abordagens consideradas

1. **Evoluir o código atual (escolhida).** Adicionar eventos e relações ao schema existente, migrar dados atuais para um evento de arquivo, entregar em fases. Reaproveita telas e infraestrutura que já funcionam.
2. **Reescrever do zero.** Descartada: joga fora telas funcionais sem ganho.
3. **Um banco/deploy por evento.** Descartada: quebra o requisito de mentor persistente entre eventos e multiplica manutenção.

O usuário escolheu a abordagem 1.

## 5. Decisões de design

### 5.1 Modelo de dados

Novas tabelas e mudanças (nomes em inglês, como hoje):

```ts
events          id serial PK, name text, company text null, startDate date, endDate date null,
                active boolean default true, createdAt
eventSteps      id serial PK, eventId → events, position int, label text   // ordem = position
eventMembers    eventId → events, mentorId → mentors, role text ('mentor' | 'specialist'),
                PK(eventId, mentorId)
teams           + eventId → events (not null após migração)
blocks          + eventId → events (not null após migração)
mentoringRecords+ eventId → events (denormalizado p/ consulta), kind text ('mentoring' | 'specialist'),
                  status null p/ specialist, stepId → eventSteps null p/ specialist,
                  topic text null (atendimento: tema/dúvida), audioTranscript text null
teamSummaries   id, teamId → teams, kind ('mentoring' | 'specialist' | 'final'),
                content text, basedOnRecordId uuid, model text, createdAt
users           + passwordHash text null, mustChangePassword boolean default true
```

- `mentors` continua a entidade de pessoa que mentora; `users` continua a entidade de login. Relação por `mentors.email = users.email` (como hoje; o campo guarda o nome de usuário). **Decisão minha:** manter os dois, não fundir, para reduzir risco de migração.
- `active` em `mentors` passa a significar "pode logar na plataforma"; a participação em evento é `eventMembers`.
- Coluna `step int` atual é substituída por `stepId`; a migração cria as 6 etapas atuais no evento de arquivo e converte.
- **Blocos**: continua valendo "um bloco ativo por vez", mas **por evento**.
- **Edição de registros**: hoje o mentor pode editar os próprios registros — mantido (o CLAUDE.md dizia imutável; está desatualizado e será corrigido). Editar uma mentoria regenera o resumo da equipe.

### 5.2 Eventos (admin)

- `/admin/eventos`: lista, criar, editar, encerrar (active=false).
- `/admin/eventos/[id]` com abas: **Dados**, **Etapas** (criar, renomear, reordenar, remover se não usada), **Equipes**, **Blocos**, **Participantes** (adicionar mentores existentes com papel Mentor/Especialista, trocar papel, remover; atalho "copiar participantes do evento X").
- Equipes e blocos passam a viver dentro do evento (substituem `/admin/equipes` e `/admin/blocos`). `/admin/mentores` continua global (cadastro de pessoas + senha).
- **Vários eventos podem estar ativos ao mesmo tempo.**

### 5.3 Contexto de evento para o usuário

- Ao entrar, o usuário vê os eventos ativos dos quais participa. Se só um, entra direto. Se vários, escolhe (seletor no topo/sidebar; escolha guardada em cookie).
- Admin vê todos os eventos e pode alternar.
- Painel, formulário, histórico e gráfico sempre filtrados pelo evento selecionado.
- Quem não participa de nenhum evento ativo vê uma mensagem ("Você não está escalado em nenhum evento ativo").

### 5.4 Login com senha individual

- Provider Credentials com usuário + senha; hash com **bcryptjs** (puro JS, compatível com Vercel). Remover `EVENT_ACCESS_CODE`.
- Admin cria o mentor com **senha temporária** (gerada e mostrada uma vez, ou digitada pelo admin); `mustChangePassword = true` força a tela `/conta/senha` no primeiro acesso.
- Admin pode **redefinir senha** em `/admin/mentores` (gera nova temporária).
- Usuário pode trocar a própria senha em `/conta/senha`.
- Usuários existentes: migração marca `passwordHash = null`; o admin define senhas pelo painel antes do próximo evento. O admin inicial recebe senha via script/SQL documentado no README.
- Rate-limit simples de tentativas de login (por usuário, em memória ou tabela) — **decisão minha**, leve.

### 5.5 Mentor x Especialista

- Papel vem de `eventMembers.role` no evento selecionado.
- **Mentor** registra **Mentoria**: equipe, status, etapa, projeto/o que está trabalhando, conselho, pontos positivos/negativos, sugestão, observações (campos atuais).
- **Especialista** registra **Atendimento**: equipe, tema/dúvida, orientação dada, observações. Sem status, sem etapa.
- **Visibilidade**: todos veem tudo. No histórico da equipe há abas **Mentorias** | **Atendimentos**; abre na aba do papel de quem está vendo. Painel, gráfico e histórico acessíveis a ambos.
- Atendimentos **não** entram em: status do card, gráfico, resumo de evolução. Têm resumo próprio (opcional, ver 5.6).
- Card da equipe mostra um contador discreto de atendimentos ("3 atendimentos").
- **Bloco no atendimento** (decisão minha): `blockId` passa a ser nullable. Atendimento grava o bloco ativo se houver, mas não exige bloco ativo. Mentoria continua exigindo bloco ativo. Ordenação de atendimentos por `createdAt`.
- **Evento só com especialistas** (decisão minha): permitido sem tipo de evento especial. Equipes sem nenhuma mentoria aparecem num grupo "Sem mentoria ainda" no painel; resumo/cartão mostram contagem de atendimentos; gráfico e status ficam ocultos quando não há mentorias.
- **Admins** (decisão minha): admin vê e gerencia todos os eventos, mas para **registrar** precisa estar escalado como participante (com papel). Ao adicionar um admin como participante, garantir que exista a linha em `mentors` (criar se faltar).

### 5.6 IA (Groq)

- Cliente HTTP simples para a API OpenAI-compatível do Groq (`https://api.groq.com/openai/v1`), sem SDK extra.
- **Resumo de evolução** (`teamSummaries.kind='mentoring'`): após cada mentoria criada/editada, gera um resumo curto (≈ 3–5 frases: situação atual, avanço, riscos, próximo passo) a partir das mentorias da equipe no evento, em ordem. Exibido no card/histórico da equipe.
- **Resumo de atendimentos** (`kind='specialist'`): após cada atendimento, resumo das principais dúvidas e orientações. Exibido na aba Atendimentos.
- **Resumo final** (`kind='final'`): gerado sob demanda pelo admin para o relatório final, por equipe, combinando mentorias e atendimentos, com tom adequado para a empresa.
- **Execução fora do caminho crítico**: o submit grava o registro e retorna; o resumo é gerado em seguida (via `after`/`waitUntil` do Vercel, ou disparado pelo cliente após o submit). Se falhar, o registro continua salvo e o resumo mostra "resumo indisponível" com botão "gerar novamente".
- Modelo: um modelo Llama pequeno/rápido do Groq para resumos (ex.: `llama-3.1-8b-instant`), configurável por env `GROQ_SUMMARY_MODEL`. **Decisão minha**; o builder verifica modelos disponíveis no momento.
- Prompt em português, com instrução de não inventar fatos e citar apenas o que está nos registros.

### 5.7 Relato por áudio

- No formulário, botão **"Gravar relato"** (MediaRecorder no navegador, funciona em iOS Safari/Android Chrome). Limite ~3 min.
- Áudio enviado para uma rota que chama **Groq Whisper** (`whisper-large-v3-turbo`, idioma `pt`), depois o LLM extrai os campos do formulário em JSON (para Mentoria: status sugerido, etapa sugerida, projeto, conselho, positivos, negativos, sugestão, obs; para Atendimento: tema, orientação, obs).
- Os campos são **preenchidos no formulário para revisão** — nada é enviado automaticamente. Status e etapa sugeridos ficam pré-selecionados mas destacados para confirmação.
- O áudio **não é armazenado**; a transcrição bruta é salva em `audioTranscript` (útil para auditoria e relatório).
- Upload via API route (`/api/transcribe`) por causa do limite de tamanho de Server Actions; autenticada.

### 5.8 Gráfico de evolução

- Por equipe, no histórico (modal/página da equipe) e no relatório final.
- Eixo X: mentorias em ordem (rotuladas por bloco). Duas leituras:
  - **Etapa** (linha em degraus, eixo Y = etapas do evento).
  - **Status** (pontos coloridos com as cores de status definidas no CLAUDE.md).
- Implementação em SVG próprio (sem dependência pesada) — **decisão minha**; o builder pode usar uma lib leve se preferir.
- Visão geral opcional no painel: mini-sparkline de etapa em cada card.

### 5.9 Relatório final (para a empresa)

- `/admin/eventos/[id]/relatorio` (layout de impressão, PDF pelo navegador, como o `/admin/relatorio` atual, que será substituído).
- Capa: evento, empresa, datas, nº de equipes, mentores e especialistas, distribuição final de status.
- Uma seção por equipe (quebra de página): resumo final (IA, editável pelo admin antes de imprimir), gráfico de evolução, linha do tempo das mentorias (bloco, mentor, status, etapa, principais pontos), seção separada **Atendimentos de especialistas**.
- Botão "gerar/atualizar resumos finais" para todas as equipes.
- **Edição do resumo final é salva** (decisão minha): `teamSummaries` ganha `editedByAdmin boolean`; "atualizar resumos" não sobrescreve resumos editados sem confirmação explícita por equipe.
- O público é a empresa; todos os campos dos registros entram. **Decisão minha:** permitir ao admin ocultar seções (ex.: "pontos negativos", "observações") por checkbox antes de imprimir.

### 5.10 Bugs e responsividade

- Formulários de admin (equipes, mentores, blocos e novos) **limpam os campos após sucesso** e mostram feedback (sucesso/erro). Padrão: client component com `useFormState`/`useFormStatus` + `form.reset()`.
- Ações de admin com mensagens de erro legíveis (ex.: usuário duplicado) em vez de erro genérico.
- Responsividade: tabelas de admin viram cards no mobile; sidebar vira menu inferior/hambúrguer; formulário de mentoria otimizado para uma mão (botões de status grandes, gravação de áudio acessível); painel com cards em 1 coluna no celular; modal de histórico em tela cheia no celular.

### 5.11 Identidade visual

- Manter tokens do `tailwind.config.ts`. Logo Liinc: buscar no Google Drive do usuário; se não encontrar, pedir. Usar no login, sidebar e capa do relatório.

### 5.12 Migração de dados existentes

- Script Drizzle/SQL que: cria evento "Arquivo (antes da v2)"; cria as 6 etapas atuais nele; associa todas as equipes, blocos e registros a esse evento; converte `step` → `stepId`; marca registros existentes como `kind='mentoring'`; adiciona todos os mentores atuais como participantes (papel Mentor) do evento de arquivo; encerra o evento de arquivo.
- Testar primeiro numa **branch do Neon** antes da produção. Precisa da connection string (usuário fornece quando chegarmos lá).

### 5.13 Entrega em fases

Cada fase é deployável sozinha:

1. **Eventos**: schema, migração, admin de eventos/etapas/equipes/blocos/participantes, contexto de evento, painel e formulário por evento, correção dos formulários que não limpam.
2. **Login com senha**.
3. **Especialista e Atendimentos**.
4. **Gráfico de evolução + responsividade + logo**.
5. **IA**: resumos e relato por áudio (requer `GROQ_API_KEY`).
6. **Relatório final** por evento.

Ao final, atualizar CLAUDE.md e README para refletir a v2.

## 6. Deixado para o builder

- Nomes exatos de rotas internas e componentes além dos citados.
- Forma de disparar o resumo pós-submit (`after` do Next / `waitUntil` / chamada do cliente) conforme suporte no Next 14 + Vercel.
- Escolha do modelo Groq atual mais barato que entregue boa qualidade em português.
- Detalhes visuais do gráfico e dos layouts mobile, seguindo a identidade Liinc.
- Testes: há zero testes hoje; adicionar testes unitários para regras de negócio puras (status mais recente, ordenação, montagem de prompt/parse do JSON da IA) com um runner leve (Vitest).
