# Liinc Mentorias

Painel de acompanhamento de mentorias em tempo real — Plataforma Liinc. Multi-evento: cada evento tem suas etapas, equipes, blocos e participantes.

## Stack

- **Next.js 14** (App Router + Server Actions)
- **Neon** — Postgres serverless (`neon-http`)
- **Drizzle ORM**
- **NextAuth.js v5** — Credentials
- **Tailwind CSS**
- **Vitest** — testes de regras de negócio
- **Vercel** — deploy automático

## Setup

### 1. Variáveis de ambiente

Crie `.env.local`:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...              # openssl rand -hex 32
EVENT_ACCESS_CODE=liinc2026  # senha global do evento (até a fase 2)
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
npx drizzle-kit push                                         # deve reportar nada pendente
```

A migração move tudo o que existia para o evento encerrado **"Arquivo (antes da v2)"**.

### 3. Criar admin no Neon SQL Editor

```sql
INSERT INTO users (id, name, email, role)
VALUES (gen_random_uuid(), 'Seu Nome', 'seu.usuario', 'admin');
```

Para o admin registrar mentorias, cadastre-o também em **Admin → Mentores** e adicione-o como participante do evento.

### 4. Dev local e testes

```bash
npm run dev
npm test
```

### 5. Deploy na Vercel

Conecte o repositório na Vercel e configure as variáveis em Settings → Environment Variables.
