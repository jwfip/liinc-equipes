# CLAUDE.md — Painel de Acompanhamento de Mentorias
## Plataforma Liinc

---

## Visão geral

Sistema web onde mentores preenchem relatórios diretamente na plataforma após cada sessão. O painel atualiza automaticamente. Nenhum CSV, nenhum servidor para configurar, SSL automático.

**Deploy:** `git push` → Vercel publica. Pronto.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend + Backend | Next.js 14 (App Router) |
| Banco de dados | Neon (Postgres serverless, free tier) |
| ORM | Drizzle ORM |
| Autenticação | NextAuth.js v5 (magic link por e-mail) |
| E-mail | Resend (free tier, 3k e-mails/mês) |
| Estilo | Tailwind CSS |
| Deploy | Vercel |

> Neon e Vercel têm free tier suficiente para o volume de um evento. SSL é automático nos dois.

---

## Estrutura de rotas

```
/                     → redireciona para /painel
/painel               → dashboard público, atualiza a cada 5s
/mentoria             → formulário de registro (requer login)
/login                → página de login com magic link
/admin                → área administrativa (requer role admin)
/admin/equipes        → cadastrar e ativar/desativar equipes
/admin/mentores       → cadastrar e ativar/desativar mentores
/admin/blocos         → criar blocos e ativar qual está em curso
```

---

## Modelo de dados (Drizzle + Neon)

```ts
// schema.ts

export const teams = pgTable('teams', {
  id:        uuid('id').primaryKey().defaultRandom(),
  number:    integer('number').notNull(),
  name:      text('name').notNull(),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const mentors = pgTable('mentors', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  email:     text('email').notNull().unique(),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const blocks = pgTable('blocks', {
  id:        serial('id').primaryKey(),
  label:     text('label').notNull(),        // "Bloco 1"
  date:      date('date').notNull(),
  active:    boolean('active').notNull().default(false), // só 1 ativo por vez
  createdAt: timestamp('created_at').defaultNow(),
})

export const mentoringRecords = pgTable('mentoring_records', {
  id:        uuid('id').primaryKey().defaultRandom(),
  teamId:    uuid('team_id').notNull().references(() => teams.id),
  mentorId:  uuid('mentor_id').notNull().references(() => mentors.id),
  blockId:   integer('block_id').notNull().references(() => blocks.id),
  status:    text('status').notNull(), // 'ok' | 'attention' | 'emergency' | 'flying'
  working:   text('working'),
  advice:    text('advice'),
  pros:      text('pros'),
  cons:      text('cons'),
  obs:       text('obs'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Tabela para NextAuth (sessões e magic links)
export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name'),
  email:     text('email').notNull().unique(),
  role:      text('role').notNull().default('mentor'), // 'mentor' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
})
```

---

## Autenticação (NextAuth.js v5)

Magic link por e-mail — sem senha. O mentor recebe um link, clica e está dentro.

```ts
// auth.ts
import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Resend({
      from: 'mentoria@seudominio.com',
      // subject e body do e-mail de magic link customizáveis aqui
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.role = user.role  // injeta role na sessão
      return session
    },
  },
})
```

### Proteção de rotas

```ts
// middleware.ts
import { auth } from './auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  if (pathname.startsWith('/mentoria') && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/admin') && req.auth?.user?.role !== 'admin') {
    return Response.redirect(new URL('/painel', req.url))
  }
})

export const config = {
  matcher: ['/mentoria/:path*', '/admin/:path*'],
}
```

---

## Server Actions (Next.js)

Todo acesso ao banco é feito via Server Actions — sem API routes separadas.

```ts
// actions/mentoria.ts
'use server'
import { auth } from '@/auth'
import { db } from '@/db'
import { mentoringRecords, mentors, blocks } from '@/schema'
import { eq } from 'drizzle-orm'

export async function submitMentoria(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('Não autenticado')

  // Buscar mentor pelo e-mail da sessão
  const mentor = await db.query.mentors.findFirst({
    where: eq(mentors.email, session.user.email),
  })
  if (!mentor) throw new Error('Mentor não encontrado')

  // Buscar bloco ativo
  const block = await db.query.blocks.findFirst({
    where: eq(blocks.active, true),
  })
  if (!block) throw new Error('Nenhum bloco ativo no momento')

  await db.insert(mentoringRecords).values({
    teamId:   formData.get('teamId') as string,
    mentorId: mentor.id,
    blockId:  block.id,
    status:   formData.get('status') as string,
    working:  formData.get('working') as string,
    advice:   formData.get('advice') as string,
    pros:     formData.get('pros') as string,
    cons:     formData.get('cons') as string,
    obs:      formData.get('obs') as string,
  })
}
```

```ts
// actions/admin.ts
'use server'
import { auth } from '@/auth'
import { db } from '@/db'
import { teams, mentors, blocks, users } from '@/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Acesso negado')
}

export async function createTeam(number: number, name: string) {
  await requireAdmin()
  await db.insert(teams).values({ number, name })
}

export async function toggleTeam(id: string, active: boolean) {
  await requireAdmin()
  await db.update(teams).set({ active }).where(eq(teams.id, id))
}

export async function createMentor(name: string, email: string) {
  await requireAdmin()
  // Cria o mentor na tabela de mentores
  await db.insert(mentors).values({ name, email })
  // Cria o usuário correspondente para login (role mentor)
  await db.insert(users).values({ name, email, role: 'mentor' })
}

export async function toggleMentor(id: string, active: boolean) {
  await requireAdmin()
  await db.update(mentors).set({ active }).where(eq(mentors.id, id))
}

export async function createBlock(label: string, date: string) {
  await requireAdmin()
  await db.insert(blocks).values({ label, date, active: false })
}

export async function activateBlock(id: number) {
  await requireAdmin()
  await db.update(blocks).set({ active: false })         // desativa todos
  await db.update(blocks).set({ active: true }).where(eq(blocks.id, id))
}
```

---

## Painel (`/painel`)

Componente de servidor que busca os dados, com revalidação a cada 5 segundos via `fetch` no cliente.

```tsx
// app/painel/page.tsx — Server Component busca dados iniciais
import { db } from '@/db'
import { PainelClient } from './PainelClient'

export default async function PainelPage() {
  const records = await db.query.mentoringRecords.findMany({
    with: { team: true, mentor: true, block: true },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  })
  const teams = await db.query.teams.findMany({
    where: (t, { eq }) => eq(t.active, true),
    orderBy: (t, { asc }) => [asc(t.number)],
  })
  return <PainelClient initialRecords={records} teams={teams} />
}
```

```tsx
// app/painel/PainelClient.tsx — Client Component faz polling
'use client'
import { useEffect, useState } from 'react'

export function PainelClient({ initialRecords, teams }) {
  const [records, setRecords] = useState(initialRecords)

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/records')
      const data = await res.json()
      setRecords(data)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // renderiza cards, summary, filtros...
}
```

```ts
// app/api/records/route.ts — endpoint leve para o polling
import { db } from '@/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const records = await db.query.mentoringRecords.findMany({
    with: { team: true, mentor: true, block: true },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  })
  return NextResponse.json(records)
}
```

---

## Componentes

```
src/
├── app/
│   ├── layout.tsx
│   ├── painel/
│   │   ├── page.tsx             # Server Component
│   │   └── PainelClient.tsx     # Client Component com polling
│   ├── mentoria/
│   │   └── page.tsx             # formulário (Server Component + action)
│   ├── login/
│   │   └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx           # verifica role admin
│   │   ├── equipes/page.tsx
│   │   ├── mentores/page.tsx
│   │   └── blocos/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── records/route.ts
├── actions/
│   ├── mentoria.ts
│   └── admin.ts
├── components/
│   ├── painel/
│   │   ├── TeamCard.tsx
│   │   ├── SummaryStrip.tsx
│   │   ├── FilterBar.tsx
│   │   ├── HistoryModal.tsx
│   │   └── MentorGrid.tsx
│   └── mentoria/
│       └── MentoriaForm.tsx
├── db.ts                        # instância do Drizzle + Neon
├── schema.ts                    # tabelas
└── auth.ts                      # config NextAuth
```

---

## Identidade visual (Liinc)

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      orange: { DEFAULT: '#F47B20', dark: '#D4660F', pale: '#FFF3E8' },
      navy:   { DEFAULT: '#1A2744', light: '#253459', muted: '#3D4F7A' },
    },
    fontFamily: {
      sans:    ['Lato', 'sans-serif'],
      display: ['Work Sans', 'sans-serif'],
    }
  }
}
```

| Status | Cor |
|--------|-----|
| ok — 🛣️ No caminho | `#16A34A` |
| attention — ⚠️ Atenção | `#CA8A04` |
| emergency — 🚨 Emergência | `#DC2626` |
| flying — 🚀 Voando | `#2563EB` |

---

## Variáveis de ambiente

```env
# .env.local
DATABASE_URL=postgresql://...          # connection string do Neon
AUTH_SECRET=...                        # string aleatória (openssl rand -hex 32)
AUTH_RESEND_KEY=re_...                 # API key do Resend
AUTH_URL=https://seudominio.vercel.app # URL pública da aplicação
```

Configurar também no painel da Vercel em **Settings → Environment Variables**.

---

## Setup inicial

```bash
# 1. Criar projeto
npx create-next-app@latest liinc-mentorias --typescript --tailwind --app
cd liinc-mentorias

# 2. Dependências
npm install drizzle-orm @neondatabase/serverless
npm install next-auth@beta @auth/drizzle-adapter
npm install resend
npm install -D drizzle-kit

# 3. Criar projeto no Neon → neon.tech → copiar DATABASE_URL

# 4. Criar conta no Resend → resend.com → copiar API key

# 5. Rodar migration
npx drizzle-kit push

# 6. Criar primeiro usuário admin direto no Neon (SQL Editor)
INSERT INTO users (name, email, role) VALUES ('Seu Nome', 'seu@email.com', 'admin');

# 7. Dev local
npm run dev

# 8. Deploy
vercel
# ou: conectar repositório no GitHub → Vercel deploya automaticamente
```

---

## Regras de negócio

- **Status do card** = registro mais recente da equipe (maior `blockId`, depois maior `createdAt`)
- **Última mentoria** no card = mentor do registro mais recente — não é vínculo fixo
- **Bloco ativo** = único com `active = true`; se nenhum ativo, formulário exibe aviso
- **Registros imutáveis** — sem edição; cada submit cria novo registro
- **Equipes inativas** não aparecem no painel nem no formulário do mentor
- **Ordenação dos cards** = numérica pela equipe dentro de cada grupo de status
- **Grupos de status** = Emergência → Atenção → No caminho → Voando

---

## O que NÃO fazer

- Não usar Supabase, Firebase ou qualquer BaaS que exija configuração de servidor
- Não criar API routes para cada operação — usar Server Actions
- Não implementar WebSocket — polling de 5s é suficiente para o volume do evento
- Não fazer seed de dados — equipes e mentores são cadastrados via `/admin`
- Não implementar edição de registros — cada mentoria é imutável