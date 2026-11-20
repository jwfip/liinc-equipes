# Refinamento completo da UI — design

Item do `docs/backlog.md`. Pontos levantados pelo dono, mais uma auditoria feita em 20/11/2026: 33 capturas de tela de uma cópia do banco (celular iPhone 13 e computador 1280px; papéis admin, mentor, especialista e facilitador) e uma varredura automática de tamanhos de fonte, alturas e estouros.

## Intenção

A plataforma é usada principalmente no celular, durante o evento. Hoje ela dá zoom ao tocar nos campos, tem botões e campos de tamanhos diferentes em cada tela, componentes fora do padrão e algumas telas que ocupam espaço demais. O objetivo é que tudo pareça um produto só, sem zoom, sem estouro e com o mesmo tamanho de toque em toda parte.

## Princípio (decisão)

**Corrigir na base e depois varrer as telas.** Tamanhos e estilos ficam nas classes compartilhadas (`src/app/globals.css`) e em poucos componentes comuns. As telas usam esses estilos em vez de alturas avulsas como `h-[38px]` ou `min-h-[44px]`.

## Itens

### 1. Zoom ao tocar em campo (iPhone)

- **Causa:** campos com letra de 13 a 14px. O Safari do iPhone dá zoom em qualquer campo abaixo de 16px.
- **Correção:** `input`, `textarea` e `select`, inclusive o seletor de evento do topo e a busca do painel, ficam com **16px no celular** e 14px a partir de `sm`. O zoom não é desligado na página (`maximum-scale`), porque isso prejudica a acessibilidade.

### 2. Alturas iguais para campos e botões

- **Medido hoje:** campos com 47px; seletores com 36 ou 45px; o botão de enviar do `AdminForm` forçado em 38px; outros botões com 28, 30, 34, 48 e 56px.
- **Padrão novo:**
  - **Tamanho normal: 44px**, igual para `.input`, `select` e `.btn-primary`, `.btn-secondary` e `.btn-danger`.
  - **Tamanho compacto: 36px** (`.btn-sm`), para ações dentro de listas, como "Ativar", "Remover", "Tornar Mentor" e "Redefinir senha".
  - Paddings, raio e peso da fonte também ficam iguais.
- O `AdminForm` deixa de forçar `h-[38px]` e alinha o botão pela base dos campos.
- Botões de ícone (fechar, cancelar gravação) têm área de toque mínima de 44px no celular.

### 3. Campo de data (decisão: campo próprio com formato fixo e o calendário do sistema)

- O campo nativo segue o idioma do aparelho e por isso mostrava "mm/dd/yyyy". Ele também tem largura mínima própria no iPhone, que estourava o formulário de evento.
- Componente novo **`DateField`** (`src/components/ui/DateField.tsx`):
  - Campo de texto com o mesmo visual dos outros e **formato fixo dd/mm/aaaa**.
  - `inputMode="numeric"` e barras automáticas ao digitar ("21112026" vira "21/11/2026").
  - Ícone de calendário que abre o **seletor nativo do aparelho**, por meio de um `<input type="date">` escondido e `showPicker()`. Navegador sem `showPicker`: o ícone foca o campo de texto.
  - O valor enviado no formulário continua **aaaa-mm-dd** (um input escondido com o mesmo `name`), então as actions não mudam.
  - Data inválida (31/02, texto incompleto): o campo marca o erro em vermelho e mostra "Data inválida", e o envio é bloqueado pelo `required` e por `setCustomValidity`.
- Regras puras com teste em `src/lib/date-input.ts`: `maskDate(digits)`, `parseBrDate('21/11/2026') → '2026-11-21' | null` e `formatBrDate('2026-11-21') → '21/11/2026'`.
- O `DateField` substitui os 5 campos de data: criação e edição de evento (início e fim) e criação de bloco.

### 4. Nada estoura no celular

- Todos os formulários do admin passam a ter 1 coluna no celular, sem `lg:grid-cols-6` espremido.
- Nenhum elemento passa da borda em 390px de largura. O critério de pronto vale nas telas listadas em "Verificação".

### 5. Trocar senha sai do menu principal → página Configurações

- Nova página **`/conta`** ("Configurações") com a seção "Senha" (o formulário atual) e o nome e o usuário da pessoa, só leitura.
- `/conta/senha` continua existindo: é para onde o middleware leva quem tem senha temporária.
- **Computador:** "Alterar senha" sai de "Acesso rápido". O rodapé da barra lateral, onde já ficam o usuário e o "Sair", ganha o link **Configurações** (ícone `Settings`).
- **Celular:** o menu "Mais" troca "Alterar senha" por **Configurações**.

### 6. Gravar relato (áudio)

- **Compacto:**
  - Parado: um botão de altura normal, "Gravar relato", com ícone.
  - Gravando: uma linha com o contador e o indicador; abaixo, outra linha com "Parar e preencher" e o "Cancelar" lado a lado, sem quebra em 390px.
- **Roteiro do que falar**, visível antes de gravar (recolhível, aberto por padrão na primeira vez) e durante a gravação:
  - **Mentoria:** status da equipe (no caminho, atenção, emergência ou voando); etapa; o projeto (se for a primeira mentoria da equipe ou se ela pivotou); no que trabalharam; a orientação que você deu; pontos positivos; o que melhorar; observações para facilitadores; sugestão ao próximo mentor.
  - **Atendimento:** tema ou dúvida; orientação; observações para facilitadores.
- O texto do roteiro fica em `src/lib/ai/audio-guide.ts`, junto da extração, e um teste confere que cada item do roteiro corresponde a uma chave que a extração pede.

### 7. Gráfico de evolução com curvas

- Hoje ele desenha degraus em ângulo reto (`H` e depois `V`).
- Passa a desenhar uma **curva suave monotônica** (interpolação de Fritsch–Carlson): ela passa por todos os pontos e não ultrapassa a etapa entre duas mentorias.
- Função pura `smoothPath(points: {x,y}[]): string` em `src/lib/evolution.ts`, com teste.
- Vale no histórico e no relatório.

### 8. Relatório na tela com o padrão das outras páginas

- O PDF é gerado só no fim do evento. A versão de tela serve para **revisar e ajustar** antes de imprimir.
- A página passa a ser renderizada **dentro do layout do app** (barra lateral, cabeçalho e cards do padrão). A barra de ferramentas atual (seções ocultáveis, gerar pareceres, imprimir) vira um card no topo.
- Na **impressão**, tudo do app fica escondido (`print:hidden` em barra lateral, cabeçalho e navegação do celular) e o resultado em A4 continua igual ao de hoje: capa e uma página por equipe.
- A rota `/admin/eventos/[id]/relatorio` não muda.

### 9. Painel no celular (decisão: faixa compacta que rola para o lado)

- Os 7 cartões de resumo viram, **só no celular**, uma faixa de chips numa linha que rola para o lado ("3 equipes · 0 Emergência · 0 Atenção · 1 No caminho · …"), com as cores e os ícones de status.
- No computador, o resumo continua como hoje.

### 10. Abas do evento no admin

- No celular, a faixa de abas rola para o lado com um degradê na borda, indicando que há mais. A aba ativa é rolada para ficar visível ao abrir a página.

### 11. Card da equipe no painel

- "Última mentoria · Nome" sai do lado do nome da equipe e vai para uma linha própria abaixo dele, cortada com reticências se for longa. O selo de status fica à direita do nome da equipe.

### 12. Pendências menores de interface (do backlog)

- Ao fechar o perfil de um mentor, o foco volta ao nome que foi clicado.
- "ver mais" só aparece quando a experiência passa de 3 linhas.
- O erro do painel de sugestão passa a usar `role="alert"`.
- O controle de bloco mostra a mensagem de sucesso por 3 s, e "Encerrar bloco" mostra "Encerrando…" enquanto salva.
- Um pedido grande demais para a IA (HTTP 413 ou erro de tamanho do Groq) mostra "A sugestão ficou grande demais para a IA. Tente de novo mais tarde." em vez de "A IA não respondeu agora".

### 13. Acessibilidade básica

- Foco visível (anel laranja) em todos os botões, links e campos (`focus-visible`).
- Contraste: textos de apoio `text-slate-400` sobre fundo claro passam para `text-slate-500` quando forem informação e não decoração.

## Não-objetivos

- Mudar fluxos, regras ou dados. É só interface, salvo o roteiro do áudio, que é texto.
- Tema escuro, redesenho da identidade visual, troca de fontes ou cores da marca.
- As pendências do backlog que não são de interface: deduplicação "Nome (Bloco)", revalidação do admin no Acompanhamento, `activateBlock` com bloco de outro evento, lista de pessoas sem polling, nome no cabeçalho após renomear. Elas continuam no backlog.

## Verificação (critério de pronto)

- A auditoria é refeita na cópia do banco, em celular (390px) e computador (1280px), nas mesmas telas: login, painel (mentor e admin), mentoria (mentor e especialista), Acompanhamento (facilitador), configurações, admin (eventos, evento, etapas, equipes, blocos, participantes, mentores) e relatório (tela e impressão em PDF).
- A varredura automática não pode encontrar:
  - campo com letra abaixo de 16px no celular;
  - elemento passando da borda;
  - altura de campo ou botão fora de {44, 36} nos formulários. Exceções: chips e botões de texto, como "ver mais" e "Histórico".
- As capturas de antes e depois vão para o dono comparar.
- Antes do deploy, o PDF do relatório é gerado e comparado ao de hoje.

## Fica para o implementador

- Nomes exatos de classes e a divisão de componentes, desde que o tamanho venha das classes compartilhadas.
- O visual do roteiro do áudio e dos chips do painel, dentro da identidade Liinc.
