'use client'

import { useTransition } from 'react'
import { setCurrentEvent } from '@/actions/events'
import type { EventOption } from '@/lib/event-pick'

interface Props {
  options: EventOption[]
  current: { id: number; name: string } | null
  isAdmin: boolean
}

export default function EventSwitcher({ options, current, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition()
  // Admin pode alternar também para eventos encerrados; demais usuários só veem ativos.
  const selectable = isAdmin ? options : options.filter(o => o.active)

  if (!current) {
    return <p className="text-xs text-slate-400">Nenhum evento ativo</p>
  }
  if (selectable.length <= 1) {
    return <p className="font-display font-bold text-sm text-white truncate" title={current.name}>{current.name}</p>
  }
  return (
    <select
      aria-label="Evento"
      value={current.id}
      disabled={isPending}
      onChange={e => {
        const id = Number(e.target.value)
        startTransition(() => setCurrentEvent(id))
      }}
      className="w-full bg-white/10 text-white text-sm font-display font-bold rounded-lg px-3 py-2 border border-white/15 focus:outline-none focus:ring-2 focus:ring-orange"
    >
      {selectable.map(o => (
        <option key={o.id} value={o.id} className="text-navy">
          {o.name}{o.active ? '' : ' (encerrado)'}
        </option>
      ))}
    </select>
  )
}
