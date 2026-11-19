'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileDown, Sparkles, Loader2 } from 'lucide-react'
import { generateFinal } from '@/actions/report'
import { REPORT_SECTIONS, SECTION_LABEL, hiddenToQuery, teamsToGenerate, type ReportSection } from '@/lib/report/options'

interface Props {
  eventId: number
  hidden:  ReportSection[]
  teams:   { id: string; name: string; number: number }[]
  finals:  { teamId: string; editedByAdmin: boolean }[]
}

/** Barra de ações do relatório (não sai na impressão): seções, geração em lote e PDF. */
export default function ReportToolbar({ eventId, hidden, teams, finals }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  // Estado local para a caixa responder na hora; a URL (e o servidor) acompanham em seguida.
  const [hiddenSet, setHiddenSet] = useState(() => new Set(hidden))
  const hiddenKey = hidden.join(',')
  useEffect(() => { setHiddenSet(new Set(hiddenKey ? hiddenKey.split(',') as ReportSection[] : [])) }, [hiddenKey])
  const [overwrite, setOverwrite] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [failed, setFailed] = useState<{ id: string; name: string; error: string }[]>([])

  function toggle(section: ReportSection) {
    const next = new Set(hiddenSet)
    if (next.has(section)) next.delete(section); else next.add(section)
    setHiddenSet(next)
    router.replace(`${pathname}?${hiddenToQuery(next)}`, { scroll: false })
  }

  async function run(ids: string[], overwriteEdited: boolean) {
    setFailed([])
    setProgress({ done: 0, total: ids.length })
    const errors: { id: string; name: string; error: string }[] = []
    // Uma equipe por vez: cada chamada é curta e uma falha não interrompe as demais.
    for (let i = 0; i < ids.length; i++) {
      const r = await generateFinal(ids[i], { overwriteEdited }).catch(() => ({ ok: false as const, error: 'Erro inesperado.' }))
      if (!r.ok) {
        const t = teams.find(x => x.id === ids[i])
        errors.push({ id: ids[i], name: t ? `${t.number} — ${t.name}` : ids[i], error: r.error })
      }
      setProgress({ done: i + 1, total: ids.length })
    }
    setFailed(errors)
    setProgress(null)
    router.refresh()
  }

  function generateAll() {
    const ids = teamsToGenerate(teams, finals, overwrite)
    if (overwrite && finals.some(f => f.editedByAdmin) && !window.confirm('Substituir também os resumos que você editou?')) return
    run(ids, overwrite)
  }

  return (
    <div className="print:hidden sticky top-0 z-10 bg-navy text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/admin/eventos/${eventId}`} className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white">
            <ChevronLeft aria-hidden="true" size={16} />Voltar
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-300">
              <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} className="accent-orange" />
              Substituir textos editados
            </label>
            <button type="button" onClick={generateAll} disabled={!!progress} className="btn-secondary text-xs py-2">
              {progress ? <Loader2 aria-hidden="true" size={14} className="animate-spin" /> : <Sparkles aria-hidden="true" size={14} />}
              {progress ? `Gerando ${progress.done}/${progress.total}…` : 'Gerar resumos finais'}
            </button>
            <button type="button" onClick={() => window.print()} className="btn-primary bg-orange hover:bg-orange-dark text-xs py-2">
              <FileDown aria-hidden="true" size={14} /> Baixar PDF
            </button>
          </div>
        </div>
        <fieldset className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-300">
          <legend className="sr-only">Seções do relatório</legend>
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] self-center">Mostrar:</span>
          {REPORT_SECTIONS.map(s => (
            <label key={s} className="inline-flex items-center gap-1.5">
              <input type="checkbox" checked={!hiddenSet.has(s)} onChange={() => toggle(s)} className="accent-orange" />
              {SECTION_LABEL[s]}
            </label>
          ))}
        </fieldset>
        {progress && (
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
            <div className="h-full bg-orange transition-all" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
          </div>
        )}
        {failed.length > 0 && (
          <div role="alert" className="text-xs bg-red-500/15 border border-red-400/30 rounded-lg p-2.5">
            <p className="font-bold mb-1">Não foi possível gerar para:</p>
            <ul className="list-disc pl-5">{failed.map(f => <li key={f.id}>{f.name}: {f.error}</li>)}</ul>
            <button type="button" className="mt-2 underline font-bold" onClick={() => run(failed.map(f => f.id), overwrite)}>Tentar de novo</button>
          </div>
        )}
        <p className="text-[11px] text-slate-400">Na janela de impressão, escolha “Salvar como PDF”. O que está visível aqui é o que sai no PDF.</p>
      </div>
    </div>
  )
}
