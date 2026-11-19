export const PASSWORD_PAGE = '/conta/senha'
const ALLOWED_WHILE_CHANGING = [PASSWORD_PAGE, '/api/auth', '/login']

/** Quem precisa trocar a senha só pode acessar a página de troca, o login e as rotas do NextAuth. */
export function needsPasswordChange(pathname: string, mustChange: boolean): boolean {
  if (!mustChange) return false
  return !ALLOWED_WHILE_CHANGING.some(p => pathname === p || pathname.startsWith(p + '/'))
}
