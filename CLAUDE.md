# CLAUDE.md — Painel de Acompanhamento de Mentorias
## Plataforma Liinc

---

## Visão geral

Sistema web multi-evento onde mentores e especialistas registram, direto na plataforma, cada sessão com as equipes. O painel atualiza sozinho (polling de 5s).

- **Evento** é a entidade principal: cada evento tem suas **etapas**, **equipes**, **blocos** e **participantes**.
- **Mentores** (pessoas que fazem login) são cadastrados uma vez e escalados por evento com um papel: **Mentor** (registra **Mentorias**: status, etapa e textos) ou **Especialista** (registra **Atendimentos**: tema/dúvida, orientação, observações — sem status nem etapa).
- Design da v2: `docs/superpowers/specs/2026-11-18-plataforma-v2-design.md`. Planos por fase: `docs/superpowers/plans/`.

**Deploy:** `git push` → Vercel publica.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend + Backend | Next.js 14 (App Router, Server Actions) |
| Banco de dados | Neon (Postgres serverless) via driver `neon-http` |
| ORM | Drizzle ORM |
| Autenticação | NextAuth.js v5 (Credentials com senha individual bcrypt, JWT) |
| Estilo | Tailwind CSS |
| Testes | Vitest (`npm test`) — regras de negócio puras em `src/lib/*.test.ts` |
| Deploy | Vercel |

> `neon-http` **não tem transações interativas**. Para várias escritas atômicas use `db.batch([...])` (ver `activateBlock`).

---

## Estrutura de rotas

```
/                                   → redireciona para /painel
/login                              → login (usuário + senha)
/conta/senha                        → trocar a própria senha (obrigatório enquanto a senha for temporária)
/painel                             → dashboard do evento selecionado (requer login)
/mentoria                           → Nova mentoria (Mentor) ou Novo atendimento (Especialista)
/mentoria/edit/[id]                 → edição do próprio registro
/admin/eventos                      → lista e criação de eventos
/admin/eventos/[id]                 → dados do evento, encerrar/reativar
/admin/eventos/[id]/etapas          → etapas do evento (ordem, renomear, remover se não usada)
/admin/eventos/[id]/equipes         → equipes do evento
/admin/eventos/[id]/blocos          → blocos do evento (1 ativo por evento)
/admin/eventos/[id]/participantes   → escalar mentores (papel Mentor/Especialista), copiar de outro evento
/admin/mentores                     → cadastro global de pessoas
/admin/relatorio                    → relatório imprimível do evento selecionado
/api/records                        → endpoint do polling (registros do evento selecionado)
```

---

## Modelo de dados

Fonte da verdade: `src/schema.ts`.

| Tabela | Papel |
|--------|-------|
| `events` | nome, empresa, datas, `active` (vários podem estar ativos) |
| `event_steps` | etapas do evento, ordenadas por `position` |
| `event_members` | (evento, mentor) → `role` `'mentor' \| 'specialist'` |
| `teams`, `blocks` | pertencem a um evento (`event_id`) |
| `mentoring_records` | `event_id`, `kind` (`'mentoring' \| 'specialist'`), `team_id`, `mentor_id`, `block_id` (nulo em atendimento fora de bloco), `status` (nulo em atendimento), `step_id`, `topic` (atendimento), textos |
| `team_step_changes` | ajustes de etapa feitos pela organização (admin) |
| `mentors` | pessoas que mentoram; `email` guarda o nome de usuário; `active` = pode usar a plataforma |
| `users`, `accounts`, `sessions`, `verificationTokens` | NextAuth; `users.role` `'mentor' \| 'admin'`; `password_hash`, `must_change_password`; liga-se a `mentors` por `email` |
| `login_attempts` | falhas de login por usuário (bloqueio) |

### Migrações

Mudanças com dados vão em SQL idempotente em `drizzle/NNNN_*.sql`, aplicado com `psql "$DATABASE_URL" -f ...`. Depois, `npx drizzle-kit push` deve reportar nada pendente. Nomeie FKs/PKs no SQL como o Drizzle nomeia (`<tabela>_<coluna>_<tabela-ref>_<coluna-ref>_fk`).

---

## Evento selecionado

`src/lib/event-context.ts` → `getEventContext()` devolve `{ event, role, options, isAdmin, mentorId }`.

- Não-admin vê só eventos em que é participante; admin vê todos (inclusive encerrados).
- Escolha guardada no cookie `liinc_event` (`setCurrentEvent` em `src/actions/events.ts`); regra pura em `src/lib/event-pick.ts`.
- Sem evento → páginas mostram `NoEventNotice`.

---

## Autenticação

- Login por usuário + senha (`src/auth.ts`, regras puras em `src/lib/login.ts`, `src/lib/lockout.ts`, `src/lib/password.ts`).
- Senha: mínimo 8 caracteres, diferente do usuário; hash bcrypt custo 10.
- Admin gera **senha temporária** (10 caracteres, mostrada uma vez) ao cadastrar ou em "Redefinir senha"; `must_change_password = true` faz o middleware levar a pessoa a `/conta/senha` (`src/lib/auth-routes.ts`).
- Bloqueio: 5 falhas em 15 minutos para o mesmo usuário. Mensagem genérica para usuário inexistente e senha errada.
- Bootstrap/recuperação do admin: `npm run set-password -- <usuario>`.
- Sem recuperação por e-mail.

---

## Server Actions

Acesso ao banco via Server Actions (`src/actions/`). Única API route de dados: `/api/records` (polling).

- Ações de admin retornam `ActionResult` (`src/lib/action-result.ts`) em vez de lançar; a UI usa `AdminForm` (limpa os campos no sucesso, mostra erro legível) e `ActionButton`.
- `requireAdmin()` em `src/lib/guards.ts`.
- `submitMentoria`/`updateMentoria` em `src/actions/mentoria.ts` validam participação, bloco ativo do evento, equipe do evento (`assertTeamInEvent`) e etapa do evento.

---

## Identidade visual (Liinc)

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      orange: { DEFAULT: '#FF7F00', dark: '#C25E00', pale: '#FFF2E5' }, // laranja da logo Liinc
      navy:   { DEFAULT: '#000222', light: '#0B1036', muted: '#3A3F66' }, // azul da logo Liinc
    },
    fontFamily: {
      sans:    ['Lato', 'sans-serif'],
      display: ['Work Sans', 'sans-serif'],
    }
  }
}
```

| Status | Cor | Ícone (lucide) |
|--------|-----|----------------|
| ok — No caminho | `#16A34A` | `Route` |
| attention — Atenção | `#CA8A04` | `TriangleAlert` |
| emergency — Emergência | `#DC2626` | `Siren` |
| flying — Voando | `#2563EB` | `Rocket` |

- **Logo**: `public/brand/liinc-logo.svg` (fundo claro) e `public/brand/liinc-logo-dark-bg.svg` (fundo escuro); favicon `src/app/icon.svg` (anéis). Origem: `liinc-logo.svg` no Google Drive do dono.
- **Ícones**: `lucide-react` (não usar emoji na interface). Status via `StatusIcon`/`StatusLabel` em `src/components/ui/StatusIcon.tsx`.
- **Navegação**: itens em `src/components/layout/nav-items.ts`; desktop = sidebar (`SidebarNav`), celular = barra inferior fixa (`MobileNav`) com menu "Mais".
- **Gráfico de evolução**: `src/lib/evolution.ts` (`evolutionPoints`, pura) + `src/components/painel/EvolutionChart.tsx` (SVG sem hooks; `fit` no relatório impresso). Aparece no histórico (aba Mentorias) e no relatório.

---

---

## Variáveis de ambiente

```env
# .env.local
DATABASE_URL=postgresql://...          # connection string do Neon
AUTH_SECRET=...                        # openssl rand -hex 32
AUTH_URL=https://seudominio.vercel.app
```

Configurar também na Vercel em **Settings → Environment Variables**.

---

## Regras de negócio

- **Status do card** = mentoria mais recente da equipe no evento (maior `blockId`, depois maior `createdAt`); só `kind = 'mentoring'` conta.
- **Etapa do card** = a mais recente entre a etapa da última mentoria e o último ajuste da organização (`currentStepFor`). Só admin ajusta.
- **Atendimentos** não alteram status, etapa nem a "Distribuição por Mentor"; aparecem na aba própria do histórico e em seção própria do painel e do relatório. Não exigem bloco ativo.
- **Papel decide o tipo**: Mentor só registra mentoria; Especialista só registra atendimento (`registrationError(ctx, kind)`).
- **Bloco ativo** = no máximo um por evento (índice único parcial); sem bloco ativo, o formulário avisa.
- **Etapas** são do evento e valem para todas as equipes dele; etapa usada em registros não pode ser removida.
- **Registros** são editáveis apenas pelo autor; cada envio cria um novo registro.
- **Equipes inativas** não aparecem no painel nem no formulário.
- **Ordenação dos cards** = numérica dentro de cada grupo de status.
- **Grupos de status** = Emergência → Atenção → No caminho → Voando → Sem mentoria ainda.
- Para registrar, a pessoa precisa ser participante do evento (inclusive admins).

---

## O que NÃO fazer

- Não usar Supabase, Firebase ou qualquer BaaS
- Não criar API routes para cada operação — usar Server Actions
- Não implementar WebSocket — polling de 5s é suficiente
- Não fazer seed de dados — eventos, equipes e mentores são cadastrados via `/admin`
- Não usar transações interativas (`db.transaction`) — o driver é `neon-http`; use `db.batch`
