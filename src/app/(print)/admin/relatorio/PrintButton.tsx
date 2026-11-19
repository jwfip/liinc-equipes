'use client'

import { FileDown } from 'lucide-react'

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary bg-orange hover:bg-orange-dark inline-flex items-center gap-2">
      <FileDown aria-hidden="true" size={16} /> Baixar PDF
    </button>
  )
}
