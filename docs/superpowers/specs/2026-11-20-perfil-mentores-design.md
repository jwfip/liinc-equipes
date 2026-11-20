# Perfil dos mentores — design (mudança pequena)

Item do `docs/backlog.md` (acesso de facilitador, parte 2). Depois dele vem o matching por IA, que vai usar este perfil.

## Intenção

O facilitador precisa saber quem é cada mentor e especialista (área, experiência) para conversar com as pessoas certas sobre uma equipe e, depois, para o **matching por IA** sugerir quem combina com cada equipe. Quem conhece a rede é a organização: **o admin preenche**, em **texto livre**.

## Decisões (do dono)

- Admin preenche; texto livre (sem categorias).
- **Restrito**: só facilitador e admin veem. O admin pode escrever com franqueza ("forte em pitch, menos em tecnologia").

## Abordagens

- **Colunas no cadastro da pessoa (`mentors`)** — *escolhida*. Perfil é 1:1 com a pessoa, vale para todos os eventos, sem histórico.
- Tabela separada de perfis — descartada: só acrescenta junção.
- Perfil por evento — descartada: a experiência não muda entre eventos; o admin reescreveria a cada evento.

## Design

**Dados.** `mentors.area text null` ("Área de atuação", até 120 caracteres) e `mentors.experience text null` ("Experiência", até 2000). Migração `drizzle/0006_perfil_mentores.sql` (`ADD COLUMN IF NOT EXISTS`).

**Admin — `/admin/mentores`.** Cada pessoa ganha **Editar**: formulário com Nome (obrigatório), Área de atuação (uma linha) e Experiência (texto longo), com a ajuda "Visível só para facilitadores e organização." Action `updateMentor(id, fd)` (`requireAdmin`, `ActionResult`, trim e limites). A lista mostra a área abaixo do nome, ou "Perfil não preenchido". *(Minha decisão: editar o nome entra junto, já que hoje não há como corrigi-lo.)*

**Privacidade.** Os campos só são lidos no servidor para quem passa em `canSeePrivateNotes` (facilitador ativo do evento ou admin) e na página de admin. As consultas do painel e do `/api/records` continuam trazendo só id, nome e usuário do mentor.

**Acompanhamento.**
- Na linha "Mentores: Ana (Bloco 3), …", cada nome vira botão que abre um pequeno painel com nome, papel no evento, área e experiência. `recentMentors` passa a devolver `{ mentorId, name, block }` em vez de texto.
- Nova seção recolhida **"Mentores e especialistas do evento (N)"** abaixo da lista de equipes: participantes com papel Mentor e Especialista, agrupados por papel e por nome; cada um com área e experiência (experiência cortada em 3 linhas com "ver mais"). Facilitadores não entram na lista.
- Os perfis vêm da página (server), não do polling: mudam raramente; atualizam ao recarregar.

## Não-objetivos

Mentor editar o próprio perfil; categorias ou tags; perfil visível a mentores e especialistas; qualquer uso de IA (fica para o matching).

## Fica para o implementador

Formato do painel do perfil (diálogo ou popover, acessível e usável no celular); onde exatamente fica o "Editar" na linha do admin.
