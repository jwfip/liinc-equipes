'use client'

interface FilterBarProps {
  search:        string
  onSearch:      (v: string) => void
  statusFilter:  string
  onStatusFilter:(v: string) => void
}

const STATUS_OPTS = [
  { value: '',          label: 'Todos'         },
  { value: 'emergency', label: '🚨 Emergência' },
  { value: 'attention', label: '⚠️ Atenção'    },
  { value: 'ok',        label: '🛣️ No caminho' },
  { value: 'flying',    label: '🚀 Voando'     },
]

export default function FilterBar({ search, onSearch, statusFilter, onStatusFilter }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        type="text"
        placeholder="Buscar equipe..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="input flex-1"
      />
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${statusFilter === opt.value
                ? 'bg-orange text-white'
                : 'bg-navy-light text-slate-300 border border-navy-muted hover:border-orange'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
