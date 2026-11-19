import { CalendarX2 } from 'lucide-react'
export default function NoEventNotice() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card text-center py-12">
        <CalendarX2 aria-hidden="true" size={40} className="mx-auto mb-3 text-slate-400" />
        <h2 className="font-display font-bold text-lg mb-1">Você não está escalado em nenhum evento ativo.</h2>
        <p className="text-slate-500 text-sm">Fale com a organização para ser incluído em um evento.</p>
      </div>
    </div>
  )
}
