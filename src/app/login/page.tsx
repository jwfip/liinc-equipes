import { redirect } from 'next/navigation'
import { CredentialsSignin } from 'next-auth'
import { signIn } from '@/auth'
import { loginMessage } from '@/lib/login'

function messageFor(error?: string, code?: string) {
  if (!error) return null
  if (error === 'CredentialsSignin') return loginMessage(code)
  return 'Ocorreu um erro ao fazer login. Tente de novo.'
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string; code?: string } }) {
  const errorMsg = messageFor(searchParams.error, searchParams.code)

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/liinc-logo-dark-bg.svg" alt="Liinc" width={180} height={42} className="mx-auto mb-4 h-auto" />
          <h1 className="font-display font-bold text-xl text-white">Mentorias</h1>
          <p className="text-slate-400 text-sm mt-1">Acesso à plataforma</p>
        </div>

        <div className="card">
          <form
            action={async (formData: FormData) => {
              'use server'
              try {
                await signIn('credentials', {
                  username:   formData.get('username'),
                  password:   formData.get('password'),
                  redirectTo: '/painel',
                })
              } catch (error) {
                if (error instanceof CredentialsSignin) {
                  redirect(`/login?error=CredentialsSignin&code=${encodeURIComponent(error.code)}`)
                }
                throw error // inclui o redirect de sucesso do NextAuth
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="label" htmlFor="username">Nome de usuário</label>
              <input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                required
                placeholder="Ex: joao.silva"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="Sua senha"
                className="input"
              />
            </div>
            
            {errorMsg && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2">
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
