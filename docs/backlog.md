# Backlog — depois das 6 fases da v2

Ideias aprovadas para depois que as fases do design v2 (`docs/superpowers/specs/2026-11-18-plataforma-v2-design.md`) estiverem concluídas. Cada item passa por design próprio antes de virar plano.

## Acesso de facilitador

O **facilitador** conduz o evento. Precisa de um acesso próprio (papel por evento, ao lado de Mentor e Especialista) com:

> **Parte 1 feita** (`docs/superpowers/specs/2026-11-19-facilitador-design.md`): papel Facilitador, observações privadas, projeto atual com pivôs e tela Acompanhamento. Faltam **perfil dos mentores** e **matching por IA**, nesta ordem.

- ~~**Visão rápida da evolução**~~ (feito: tela Acompanhamento): quais equipes estão evoluindo bem e quais estão ficando para trás (a partir do status, da etapa e do ritmo de avanço entre mentorias).
- **Perfil dos mentores**: descrição/perfil de cada mentor e especialista (área de atuação, experiência), visível ao facilitador. Exige campos novos no cadastro de mentores.
- **Sugestão de matching por IA**: a partir do projeto e da situação atual de cada equipe, sugerir quais mentores/especialistas combinam com ela, para orientar a distribuição nos próximos blocos. Pode entrar na própria tela **Acompanhamento** (`/acompanhamento`), junto de cada equipe — o facilitador já usa essa tela para decidir onde agir.

Decidido na parte 1: facilitador não registra; observações para facilitadores são privadas (facilitador, admin e autor). Fica para o design do matching: sob demanda ou a cada nova mentoria? O matching usa o **projeto atual** da equipe (`team_projects`).

## Facilitador ativa blocos de mentoria

Permitir que o **facilitador** ative (e encerre) o bloco de mentoria do seu evento, sem depender do admin. Hoje só o admin faz isso em `/admin/eventos/[id]/blocos` (`activateBlock`).

Pontos a decidir no design: o facilitador só ativa/encerra blocos já cadastrados ou também cria/edita blocos? Onde fica o controle (na tela Acompanhamento, que já mostra o bloco ativo, ou numa tela própria)? Vale só para evento ativo, como a correção de projeto.
