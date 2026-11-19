import bcrypt from 'bcryptjs'

export const MIN_PASSWORD_LENGTH = 8
export const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const TEMP_PASSWORD_LENGTH = 10

export function validatePassword(password: string, username: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  if (password.trim().toLowerCase() === username.trim().toLowerCase()) return 'A senha não pode ser igual ao usuário.'
  return null
}

/** Senha temporária sem caracteres ambíguos (0/O, 1/l/I). Usa rejeição para evitar viés de módulo. */
export function generateTempPassword(): string {
  const n = TEMP_PASSWORD_ALPHABET.length
  const limit = 256 - (256 % n)
  let out = ''
  while (out.length < TEMP_PASSWORD_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    for (const b of bytes) {
      if (b < limit && out.length < TEMP_PASSWORD_LENGTH) out += TEMP_PASSWORD_ALPHABET[b % n]
    }
  }
  return out
}

export function hashPassword(plain: string, cost = 10): Promise<string> {
  return bcrypt.hash(plain, cost)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
