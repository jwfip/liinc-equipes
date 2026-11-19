// Define uma senha temporária para um usuário (ex.: o primeiro admin).
// Uso: npm run set-password -- <usuario>
// Lê DATABASE_URL de .env.local. A pessoa troca a senha no primeiro acesso.
import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { webcrypto } from 'node:crypto'

config({ path: '.env.local' })

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
function tempPassword(length = 10) {
  const limit = 256 - (256 % ALPHABET.length)
  let out = ''
  while (out.length < length) {
    for (const b of webcrypto.getRandomValues(new Uint8Array(32))) {
      if (b < limit && out.length < length) out += ALPHABET[b % ALPHABET.length]
    }
  }
  return out
}

const username = String(process.argv[2] ?? '').trim().toLowerCase()
if (!username) { console.error('Uso: npm run set-password -- <usuario>'); process.exit(1) }
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL não definida (.env.local).'); process.exit(1) }

const sql = neon(process.env.DATABASE_URL)
const password = tempPassword()
const hash = await bcrypt.hash(password, 10)
const rows = await sql`UPDATE users SET password_hash = ${hash}, must_change_password = true WHERE email = ${username} RETURNING email`
if (rows.length === 0) { console.error(`Usuário "${username}" não encontrado na tabela users.`); process.exit(1) }
await sql`DELETE FROM login_attempts WHERE username = ${username}`

console.log(`Senha temporária de ${username}: ${password}`)
console.log('Ela será trocada no primeiro acesso.')
