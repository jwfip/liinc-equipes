# Fase 2 — Login com senha individual · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o login "usuário + código global do evento" por usuário + senha individual (hash bcrypt), com senha temporária gerada pelo admin, troca obrigatória no primeiro acesso e bloqueio após tentativas erradas.

**Architecture:** Colunas `password_hash` e `must_change_password` em `users`; tabela `login_attempts` para bloqueio. `authorize()` do Credentials valida via funções puras em `src/lib/password.ts` e `src/lib/lockout.ts`. O callback `session` (que já lê `users` a cada request) passa `mustChangePassword` para a sessão; o middleware redireciona para `/conta/senha` enquanto for `true`. Admin gera/redefine senhas temporárias em `/admin/mentores` (mostradas uma única vez).

**Tech Stack:** NextAuth v5 beta.31 (Credentials, JWT), bcryptjs, Drizzle + neon-http, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-plataforma-v2-design.md` (seção 5.4)

## Global Constraints

- Hash: `bcryptjs`, custo **10** em produção. Nunca logar nem retornar `password_hash`.
- Política de senha: mínimo **8** caracteres; diferente do nome de usuário (comparação sem maiúsculas/minúsculas).
- Senha temporária: **10** caracteres do alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789` (sem 0/O/1/l/I), gerada com `crypto.getRandomValues`.
- Bloqueio: **5** falhas para o mesmo usuário em **15 minutos** → recusa até a janela passar. Sucesso apaga as falhas do usuário.
- Mensagens (exatas): erro genérico `Usuário ou senha incorretos.`; bloqueio `Muitas tentativas. Aguarde 15 minutos e tente de novo.`; sem senha `Sua senha ainda não foi definida. Fale com a organização.`
- `EVENT_ACCESS_CODE` deixa de ser usado (remover do código, README e CLAUDE.md).
- Sem e-mail de recuperação: quem esquece pede ao admin, que redefine.
- Driver neon-http: sem transações interativas.

## Review Focus

- **Usuário migrado sem senha** (`password_hash` nulo) tenta entrar → mensagem "Sua senha ainda não foi definida…", nunca erro 500. (teste Task 3)
- **Nome de usuário com maiúsculas/espaços** no login → normalizado (trim + lowercase) como no cadastro. (teste Task 3)
- **Sessão com `mustChangePassword`** tenta abrir `/painel`, `/admin/...` ou chamar uma action → é levada a `/conta/senha`; `/conta/senha` e logout continuam acessíveis (sem loop). (teste Task 4 em `needsPasswordChange`)
- **Admin redefine a senha de quem já está logado** → próxima request dessa pessoa cai em `/conta/senha` (o callback `session` relê o banco). (verificação manual Task 6)
- **Bloqueio por usuário inexistente** não revela se o usuário existe: mesma mensagem genérica, e falhas também contam. (teste Task 3)

---

## File Structure

```
drizzle/0002_v2_fase2_senha.sql      # colunas em users + login_attempts (idempotente)
src/schema.ts                        # users.passwordHash, users.mustChangePassword, loginAttempts
src/lib/password.ts (+ .test.ts)     # validatePassword, generateTempPassword, hashPassword, verifyPassword
src/lib/lockout.ts (+ .test.ts)      # isLockedOut (puro)
src/lib/login.ts (+ .test.ts)        # checkLogin (puro, recebe user + falhas) → resultado
src/lib/auth-routes.ts (+ .test.ts)  # needsPasswordChange(pathname, flag) (puro)
src/auth.ts                          # authorize com senha + lockout; session com mustChangePassword
src/middleware.ts                    # redireciona para /conta/senha
src/types/next-auth.d.ts             # mustChangePassword na Session
src/actions/account.ts               # changePassword
src/actions/admin.ts                 # createMentor gera senha; resetPassword
src/app/(app)/conta/senha/page.tsx   # troca de senha
src/app/login/page.tsx               # campo Senha + mensagens
src/app/(app)/admin/mentores/page.tsx# senha temporária exibida uma vez; botão Redefinir senha
src/components/admin/TempPasswordNotice.tsx
scripts/set-password.mjs             # define senha de um usuário via DATABASE_URL (bootstrap do admin)
README.md, CLAUDE.md
```

---

### Task 1: Schema e migração

**Files:** Create `drizzle/0002_v2_fase2_senha.sql`; Modify `src/schema.ts`

**Interfaces — Produces:**
- `users.passwordHash: text('password_hash')` (nullable), `users.mustChangePassword: boolean('must_change_password').notNull().default(true)`.
- `loginAttempts` (`login_attempts`): `id serial PK`, `username text notNull`, `attemptedAt timestamp('attempted_at').notNull().defaultNow()`; índice `login_attempts_username_idx` em `(username, attempted_at)`.

- [ ] **Step 1:** SQL idempotente: `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`, `... must_change_password boolean NOT NULL DEFAULT true`; `CREATE TABLE IF NOT EXISTS login_attempts (...)`; `CREATE INDEX IF NOT EXISTS login_attempts_username_idx ON login_attempts (username, attempted_at)`.
- [ ] **Step 2:** Atualizar `schema.ts`.
- [ ] **Step 3:** Aplicar na branch Neon de teste (`v2-fase1-teste`, resetada a partir da produção) via MCP, duas vezes; conferir colunas com `describe_table_schema users`. Expected: colunas presentes, 2ª execução sem erro.
- [ ] **Step 4:** `npx tsc --noEmit` sem erros. Commit `feat(db): add password columns and login attempts table`.

---

### Task 2: Senhas (funções puras)

**Files:** Create `src/lib/password.ts`, `src/lib/password.test.ts`; `npm i bcryptjs` (+ `@types/bcryptjs` se necessário)

**Interfaces — Produces:**
- `validatePassword(password: string, username: string): string | null` — `'A senha precisa ter pelo menos 8 caracteres.'` | `'A senha não pode ser igual ao usuário.'` | `null`.
- `generateTempPassword(): string`
- `hashPassword(plain: string, cost = 10): Promise<string>`; `verifyPassword(plain: string, hash: string): Promise<boolean>`

- [ ] **Step 1: Testes:**
  - `validatePassword('1234567', 'ana')` → mensagem de 8 caracteres; `validatePassword('Ana.Silva', 'ana.silva')` → mensagem de igual ao usuário; `validatePassword('boa-senha-1', 'ana')` → `null`.
  - `generateTempPassword()` tem 10 caracteres, todos no alfabeto da Global Constraints; 50 chamadas geram 50 valores distintos.
  - `verifyPassword('x-senha-1', await hashPassword('x-senha-1', 4))` → `true`; com `'outra'` → `false`.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: password policy, temp password generator and bcrypt helpers`.

---

### Task 3: Regras de login e bloqueio (puras) + `authorize`

**Files:** Create `src/lib/lockout.ts`, `src/lib/lockout.test.ts`, `src/lib/login.ts`, `src/lib/login.test.ts`; Modify `src/auth.ts`, `src/app/login/page.tsx`

**Interfaces — Produces:**
- `LOCKOUT_MAX = 5`, `LOCKOUT_WINDOW_MS = 15 * 60 * 1000`
- `isLockedOut(failures: Date[], now: Date): boolean` — conta falhas com `now - t < janela`; `>= 5` → `true`.
- `normalizeUsername(raw: unknown): string` — `String(raw ?? '').trim().toLowerCase()`.
- `type LoginOutcome = { ok: true } | { ok: false; reason: 'invalid' | 'locked' | 'no_password' }`
- `checkLogin(input: { user: { passwordHash: string | null } | undefined; password: string; failures: Date[]; now: Date; verify: (plain: string, hash: string) => Promise<boolean> }): Promise<LoginOutcome>` — ordem: bloqueio → usuário inexistente (`invalid`) → sem hash (`no_password`) → verify falso (`invalid`) → ok.
- `LOGIN_MESSAGES: Record<'invalid' | 'locked' | 'no_password', string>` com as mensagens exatas da Global Constraints.
- Em `src/auth.ts`: `class LoginError extends CredentialsSignin { constructor(code) }` com `code` = reason. `authorize`: normaliza usuário, lê falhas de `login_attempts` (últimos 15 min), chama `checkLogin`; em `invalid`/`no_password` insere falha; em `ok` apaga falhas do usuário e retorna o user; senão lança `LoginError(reason)`. Campo de credencial `password` substitui `code`.
- Login page: input `name="password"` `type="password"` `autoComplete="current-password"`, label "Senha"; lê `searchParams.code` e mostra `LOGIN_MESSAGES[code]` (padrão `invalid`).

- [ ] **Step 1: Testes** `lockout.test.ts`: 4 falhas recentes → `false`; 5 recentes → `true`; 5 falhas, 1 com 16 min → `false`. `login.test.ts`: bloqueado com senha certa → `locked`; usuário `undefined` → `invalid`; `passwordHash: null` → `no_password`; senha errada → `invalid`; senha certa → `ok`; `normalizeUsername('  Ana.Silva ')` → `'ana.silva'`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar (incluindo `auth.ts` e login page). **Step 4:** PASS + `npx tsc --noEmit`.
- [ ] **Step 5:** Commit `feat(auth): individual password login with lockout`.

---

### Task 4: Troca de senha obrigatória

**Files:** Create `src/lib/auth-routes.ts`, `src/lib/auth-routes.test.ts`, `src/actions/account.ts`, `src/app/(app)/conta/senha/page.tsx`, `src/components/account/ChangePasswordForm.tsx`; Modify `src/auth.ts` (session), `src/middleware.ts`, `src/types/next-auth.d.ts`, `src/components/layout/SidebarNav.tsx`

**Interfaces — Produces:**
- `session.user.mustChangePassword: boolean` (callback `session` lê do banco, como já faz com `role`).
- `needsPasswordChange(pathname: string, mustChange: boolean): boolean` — `true` se `mustChange` e o caminho não começa com `/conta/senha`, `/api/auth` ou `/login`.
- Middleware: `matcher` passa a incluir `/conta/:path*`; se logado e `needsPasswordChange` → redirect `/conta/senha`.
- `changePassword(fd: FormData): Promise<ActionResult>` — campos `current`, `next`, `confirm`; erros exatos: `'Senha atual incorreta.'`, `'As senhas não conferem.'`, mensagens de `validatePassword`, `'A nova senha precisa ser diferente da atual.'`; no sucesso grava hash e `mustChangePassword=false`, mensagem `'Senha alterada.'`.
- Página `/conta/senha`: título "Defina sua senha" quando obrigatório (com texto "Por segurança, troque a senha temporária antes de continuar."), senão "Alterar senha"; após sucesso obrigatório, botão "Continuar" para `/painel`. Item "Alterar senha" (🔑) na sidebar para todos.

- [ ] **Step 1: Testes** `needsPasswordChange`: (`/painel`, true) → true; (`/admin/eventos`, true) → true; (`/conta/senha`, true) → false; (`/api/auth/signout`, true) → false; (`/painel`, false) → false.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + tsc.
- [ ] **Step 5:** Commit `feat(auth): force password change on first login`.

---

### Task 5: Admin — senha temporária e redefinição

**Files:** Modify `src/actions/admin.ts`, `src/app/(app)/admin/mentores/page.tsx`; Create `src/components/admin/TempPasswordNotice.tsx`, `src/components/admin/ResetPasswordButton.tsx`

**Interfaces:**
- Consumes: `generateTempPassword`, `hashPassword` (Task 2); `ActionResult`, `AdminForm`.
- Produces:
  - `ActionResult` ganha variante opcional `{ ok: true; message?: string; secret?: string }` (campo `secret` = senha temporária exibida uma vez).
  - `createMentor(fd)`: gera senha temporária; insere `users` com `passwordHash`, `mustChangePassword: true`; se `users` já existir (ex.: admin), **atualiza** hash e flag. Retorna `{ ok:true, message, secret }`.
  - `resetPassword(mentorId: string): Promise<ActionResult>` — gera nova temporária para o `users` com `email = mentors.email`; apaga `login_attempts` do usuário; retorna `secret`.
  - `AdminForm` mostra `<TempPasswordNotice username password />` quando o resultado traz `secret`: caixa destacada com usuário e senha, botão "Copiar", texto "Anote agora: esta senha não será mostrada de novo. A pessoa vai trocá-la no primeiro acesso." Permanece até a próxima ação (não some em 3s).
  - Tabela de mentores: coluna/ação "Redefinir senha" (confirmação `Gerar nova senha temporária para <nome>?`), mostrando o `TempPasswordNotice` ao lado. Remover o texto sobre `EVENT_ACCESS_CODE`.

- [ ] **Step 1:** Implementar. **Step 2:** `npx tsc --noEmit` + `npm test` verdes.
- [ ] **Step 3:** Commit `feat(admin): temporary passwords and password reset for mentors`.

---

### Task 6: Bootstrap do admin, docs e E2E

**Files:** Create `scripts/set-password.mjs`; Modify `README.md`, `CLAUDE.md`, `package.json`

**Interfaces — Produces:**
- `npm run set-password -- <usuario>`: lê `DATABASE_URL` de `.env.local`, gera senha temporária, grava hash (custo 10) e `must_change_password = true` no `users` com aquele `email`, imprime a senha uma vez. Sai com erro legível se o usuário não existir.

- [ ] **Step 1:** Script + script npm. README: seção "Primeiro acesso do admin" (SQL do INSERT existente + `npm run set-password -- seu.usuario`); remover `EVENT_ACCESS_CODE`. CLAUDE.md: autenticação por senha, regras de bloqueio, troca obrigatória, `/conta/senha`, variáveis.
- [ ] **Step 2: E2E (Playwright) contra a branch Neon de teste**, roteiro: (a) usuário sem senha → mensagem "ainda não foi definida"; (b) definir senha do admin com o script; login com temporária → cai em `/conta/senha`; tentar `/painel` → volta para `/conta/senha`; trocar senha (testar "não conferem" e "mínimo 8") → acessa `/painel`; (c) admin cria mentor → vê senha temporária; logout; login como mentor com a temporária → troca obrigatória; (d) admin redefine senha do mentor → login antigo falha, novo funciona; (e) 5 senhas erradas → mensagem de bloqueio, e senha certa também bloqueada.
- [ ] **Step 3:** `npm run build` OK. Commit `docs: password login setup and admin bootstrap`.

---

## Implantação (após aprovação do usuário)

1. Migração `0002` na produção via MCP (aditiva: só adiciona colunas/tabela; o código atual continua funcionando).
2. Merge do PR → Vercel publica. A partir daí **ninguém entra sem senha**.
3. Definir a senha temporária do admin direto no banco (hash gerado aqui, aplicado via MCP); a senha temporária é entregue ao usuário, que troca no primeiro acesso. Depois o admin gera as senhas dos mentores em `/admin/mentores`.
4. Remover `EVENT_ACCESS_CODE` das variáveis da Vercel (opcional; deixa de ser lido).
