# Backlog — depois das 6 fases da v2

Ideias aprovadas para depois que as fases do design v2 (`docs/superpowers/specs/2026-11-18-plataforma-v2-design.md`) estiverem concluídas. Cada item passa por design próprio antes de virar plano.

## Acesso de facilitador

O **facilitador** conduz o evento. Precisa de um acesso próprio (papel por evento, ao lado de Mentor e Especialista) com:

> **Parte 1 feita** (`docs/superpowers/specs/2026-11-19-facilitador-design.md`): papel Facilitador, observações privadas, projeto atual com pivôs e tela Acompanhamento. **Parte 2 feita** (`docs/superpowers/specs/2026-11-20-perfil-mentores-design.md`): perfil dos mentores. **Parte 3 feita** (`docs/superpowers/specs/2026-11-20-matching-design.md`): matching por IA na tela Acompanhamento.

- ~~**Visão rápida da evolução**~~ (feito: tela Acompanhamento): quais equipes estão evoluindo bem e quais estão ficando para trás (a partir do status, da etapa e do ritmo de avanço entre mentorias).
- ~~**Perfil dos mentores**~~ (feito): descrição/perfil de cada mentor e especialista (área de atuação, experiência), visível ao facilitador. Exige campos novos no cadastro de mentores.
- ~~**Sugestão de matching por IA**~~ (feito): a partir do projeto e da situação atual de cada equipe, sugerir quais mentores/especialistas combinam com ela, para orientar a distribuição nos próximos blocos. Pode entrar na própria tela **Acompanhamento** (`/acompanhamento`), junto de cada equipe — o facilitador já usa essa tela para decidir onde agir.

Decidido na parte 1: facilitador não registra; observações para facilitadores são privadas (facilitador, admin e autor). Fica para o design do matching: sob demanda ou a cada nova mentoria? O matching usa o **projeto atual** da equipe (`team_projects`).

## ~~Facilitador ativa blocos de mentoria~~ (feito: `docs/superpowers/specs/2026-11-20-facilitador-blocos-design.md`)

Permitir que o **facilitador** ative (e encerre) o bloco de mentoria do seu evento, sem depender do admin. Hoje só o admin faz isso em `/admin/eventos/[id]/blocos` (`activateBlock`).

Pontos a decidir no design: o facilitador só ativa/encerra blocos já cadastrados ou também cria/edita blocos? Onde fica o controle (na tela Acompanhamento, que já mostra o bloco ativo, ou numa tela própria)? Vale só para evento ativo, como a correção de projeto.

## Refinamento completo da UI

Uma passada de acabamento em toda a interface (painel, formulários, Acompanhamento, histórico, admin, relatório), no celular e no computador: consistência visual entre as telas, estados vazios, de carregamento e de erro, textos, acessibilidade (foco, leitores de tela, contraste) e ajustes que foram ficando para depois nas entregas anteriores.

Pontos a decidir no design: o que mais incomoda hoje no uso real (por onde começar)? Há referências visuais que a Liinc quer seguir? Inclui revisar o fluxo de alguma tela ou é só acabamento?

Pendências menores já anotadas nas revisões, que podem entrar aqui:
- Ao fechar o perfil de um mentor, o foco não volta ao nome clicado; "ver mais" aparece mesmo com experiência curta.
- Erro do painel de sugestão não é anunciado como alerta para leitores de tela.
- Nomes "Fulano (Bloco)" deduplicados pelo nome do bloco (dois blocos com o mesmo nome).
- Lista de pessoas do Acompanhamento só atualiza ao recarregar.
- Pedido grande demais para a IA aparece como "A IA não respondeu agora".
- Nome no cabeçalho só muda no próximo login depois que o admin renomeia a pessoa.
