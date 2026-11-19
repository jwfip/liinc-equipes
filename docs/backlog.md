# Backlog — depois das 6 fases da v2

Ideias aprovadas para depois que as fases do design v2 (`docs/superpowers/specs/2026-11-18-plataforma-v2-design.md`) estiverem concluídas. Cada item passa por design próprio antes de virar plano.

## Acesso de facilitador

O **facilitador** conduz o evento. Precisa de um acesso próprio (papel por evento, ao lado de Mentor e Especialista) com:

- **Visão rápida da evolução**: quais equipes estão evoluindo bem e quais estão ficando para trás (a partir do status, da etapa e do ritmo de avanço entre mentorias).
- **Perfil dos mentores**: descrição/perfil de cada mentor e especialista (área de atuação, experiência), visível ao facilitador. Exige campos novos no cadastro de mentores.
- **Sugestão de matching por IA**: a partir do projeto e da situação atual de cada equipe, sugerir quais mentores/especialistas combinam com ela, para orientar a distribuição nos próximos blocos.

Pontos a decidir no design: o facilitador também registra mentorias? Vê observações internas ("Observações para facilitadores" já existe no formulário)? A sugestão de matching é sob demanda ou a cada nova mentoria?

## Pendências anotadas nas revisões das fases 1–6

Melhorias pequenas, nenhuma bloqueante. Origem: revisões finais de cada fase.

**Segurança e custo**
- Limite de uso dos botões/rotas de IA (`refreshTeamSummary`, `generateFinal`, `/api/transcribe`): hoje qualquer participante pode chamar em sequência.
- Limite de tentativas na troca de senha (`changePassword`), como já existe no login.
- Limpeza periódica de `login_attempts` (linhas antigas nunca são apagadas).
- `clip()` remove delimitadores em uma passada só (tags aninhadas como `<regis<registros>tros>` voltam a formar a tag); o prompt já manda tratar tudo como dado.

**Comportamento**
- Cadastrar como mentor alguém que já tem login (ex.: o admin) redefine a senha dessa pessoa sem avisar.
- Mentor inativo ainda consegue entrar e ver os painéis (decisão atual: manter assim).
- Dois envios muito rápidos podem deixar o resumo da equipe marcado "pode estar desatualizado" até alguém clicar em "Atualizar resumo"; editar o registro mais recente não marca o resumo como desatualizado se a regeneração falhar.
- Resumo da IA ordena por data, enquanto o status do card considera primeiro o bloco; histórico ordena por data de registro.
- No relatório, o parecer da IA considera "A melhorar" e atendimentos mesmo quando essas seções estão ocultas (o admin pode editar o texto).
- Erros de duplicidade genéricos ("Registro já existe.") em alguns formulários de admin.
- `setCurrentEvent` com opção já inválida (pessoa removida do evento com a página aberta) cai na tela de erro em vez de voltar ao evento padrão.

**Desempenho e acessibilidade**
- `getEventContext` roda duas vezes por página (layout + página) e a cada 5 s no polling — envolver em `React.cache()`.
- Relatório filtra todos os registros por equipe (ok na escala de um evento).
- Barra de progresso do relatório sem anúncio para leitor de tela durante a geração em lote.
- `bcryptjs` entra no pacote do middleware (só aviso de build).
