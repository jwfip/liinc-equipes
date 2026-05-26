import { signIn } from '@/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange/20 border border-orange/30 mb-4">
            <span className="text-3xl">🧭</span>
          </div>
          <h1 className="font-display font-bold text-2xl">Liinc Mentorias</h1>
          <p className="text-slate-400 text-sm mt-1">Acesso de mentores</p>
        </div>

        <div className="card">
          <form
            action={async (formData: FormData) => {
              'use server'
              await signIn('resend', {
                email:       formData.get('email') as string,
                redirectTo:  '/mentoria',
              })
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Seu e-mail</label>
              <input
                type="email"
                name="email"
                required
                placeholder="mentor@exemplo.com"
                className="input"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5">
              ✉️ Enviar magic link
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Sem senha. Apenas um clique no seu e-mail.
        </p>
      </div>
    </div>
  )
}
