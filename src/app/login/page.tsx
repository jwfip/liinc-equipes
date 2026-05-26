import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const errorMsg = searchParams.error === 'CredentialsSignin' 
    ? 'Usuário ou código incorretos.' 
    : searchParams.error ? 'Ocorreu um erro ao fazer login.' : null

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange/20 border border-orange/30 mb-4">
            <span className="text-3xl">🧭</span>
          </div>
          <h1 className="font-display font-bold text-2xl">Liinc Mentorias</h1>
          <p className="text-slate-400 text-sm mt-1">Acesso à plataforma</p>
        </div>

        <div className="card">
          <form
            action={async (formData: FormData) => {
              'use server'
              try {
                await signIn('credentials', {
                  username: formData.get('username'),
                  code:     formData.get('code'),
                  redirectTo: '/painel',
                })
              } catch (error) {
                if (error instanceof AuthError) {
                  // NextAuth redirects to /login?error=CredentialsSignin on failure
                  throw error
                }
                throw error
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Nome de Usuário</label>
              <input
                type="text"
                name="username"
                required
                placeholder="Ex: joao.silva"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Código do Evento</label>
              <input
                type="password"
                name="code"
                required
                placeholder="Senha de acesso"
                className="input"
              />
            </div>
            
            {errorMsg && (
              <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2">
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
