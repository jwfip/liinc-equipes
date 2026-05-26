'use client'

export default function FilterBar({ search, onSearch, statusFilter, onStatusFilter }: any) {
  const btn = (f: string, lbl: string, activeClass: string) => {
    const active = statusFilter === f
    return (
      <button
        onClick={() => onStatusFilter(f)}
        className={`px-4 py-1.5 rounded-full font-display font-semibold text-[13px] transition-colors border ${
          active ? activeClass : 'bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200'
        }`}
      >
        {lbl}
      </button>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 mb-7">
      <span className="hidden md:inline text-xs font-bold uppercase tracking-wide text-slate-400 ml-2">Filtrar:</span>
      <div className="flex flex-wrap gap-2">
        {btn('all', 'Todas', 'bg-navy text-white border-navy')}
        {btn('emergency', '🚨 Emergência', 'bg-red-600 text-white border-red-600')}
        {btn('attention', '⚠️ Atenção', 'bg-yellow-400 text-navy border-yellow-400')}
        {btn('ok', '🛣️ No caminho', 'bg-green-600 text-white border-green-600')}
        {btn('flying', '🚀 Voando', 'bg-blue-600 text-white border-blue-600')}
        {btn('none', 'Sem registro', 'bg-slate-500 text-white border-slate-500')}
      </div>
      <div className="relative ml-auto w-full md:w-auto">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Buscar equipe..."
          className="w-full md:w-56 bg-slate-100 border border-slate-200 rounded-full py-1.5 pl-8 pr-4 text-[13px] text-navy outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
        />
      </div>
    </div>
  )
}
