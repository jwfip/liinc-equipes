import { Sparkles } from 'lucide-react'

/** Aviso de que a seleção veio do relato por áudio e precisa de confirmação. */
export default function AiHint() {
  return (
    <p className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-dark bg-orange-pale border border-orange/30 rounded-full px-2 py-0.5 mb-2">
      <Sparkles aria-hidden="true" size={12} /> Sugerido pela IA — confirme
    </p>
  )
}
