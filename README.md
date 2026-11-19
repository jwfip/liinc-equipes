# Liinc Mentorias

Painel de acompanhamento de mentorias em tempo real — Plataforma Liinc. Multi-evento: cada evento tem suas etapas, equipes, blocos e participantes.

## Stack

- **Next.js 14** (App Router + Server Actions)
- **Neon** — Postgres serverless (`neon-http`)
- **Drizzle ORM**
- **NextAuth.js v5** — Credentials (usuário + senha individual, bcrypt)
- **Tailwind CSS**
- **Vitest** — testes de regras de negócio
- **Vercel** — deploy automático

## Setup

### 1. Variáveis de ambiente

Crie `.env.local`:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...              # openssl rand -hex 32
AUTH_URL=http://localhost:3000
```

### 2. Banco

Banco novo:

```bash
npx drizzle-kit push
```

Banco existente (anterior à v2) — aplicar a migração de dados antes:

```bash
psql "$DATABASE_URL" -f drizzle/0001_v2_fase1_eventos.sql   # idempotente
psql "$DATABASE_URL" -f drizzle/0002_v2_fase2_senha.sql      # idempotente
npx drizzle-kit push                                         # deve reportar nada pendente
```

A migração move tudo o que existia para o evento encerrado **"Arquivo (antes da v2)"**.

### 3. Primeiro acesso do admin

Crie o usuário no Neon SQL Editor:

```sql
INSERT INTO users (id, name, email, role)
VALUES (gen_random_uuid(), 'Seu Nome', 'seu.usuario', 'admin');
```

Gere a senha temporária (usa o `DATABASE_URL` do `.env.local`):

```bash
npm run set-password -- seu.usuario
```

No primeiro login a plataforma pede para trocar a senha. Depois, as senhas dos mentores são geradas em **Admin → Mentores** (cadastro ou "Redefinir senha"). O mesmo script serve para recuperar o acesso do admin.

Para o admin registrar mentorias, cadastre-o também em **Admin → Mentores** e adicione-o como participante do evento.

### 4. Dev local e testes

```bash
npm run dev
npm test
```

### 5. Deploy na Vercel

Conecte o repositório na Vercel e configure as variáveis em Settings → Environment Variables.
