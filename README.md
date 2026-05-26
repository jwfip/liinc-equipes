# Liinc Mentorias

Painel de acompanhamento de mentorias em tempo real — Plataforma Liinc.

## Stack

- **Next.js 14** (App Router + Server Actions)
- **Neon** — Postgres serverless
- **Drizzle ORM**
- **NextAuth.js v5** — magic link via Resend
- **Tailwind CSS**
- **Vercel** — deploy automático

## Setup

### 1. Variáveis de ambiente

Crie `.env.local`:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...            # openssl rand -hex 32
EVENT_ACCESS_CODE=liinc2026 # Senha global do evento para os mentores logarem
AUTH_URL=http://localhost:3000
```

### 2. Migrations

```bash
npx drizzle-kit push
```

### 3. Criar admin no Neon SQL Editor

```sql
INSERT INTO users (id, name, email, role)
VALUES (gen_random_uuid(), 'Seu Nome', 'seu@email.com', 'admin');
```

### 4. Dev local

```bash
npm run dev
```

### 5. Deploy na Vercel

Conecte o repositório GitHub na Vercel e configure as variáveis de ambiente em Settings → Environment Variables.
