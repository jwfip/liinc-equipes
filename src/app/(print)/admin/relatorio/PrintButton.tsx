'use client'

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary bg-orange hover:bg-orange-dark">
      📄 Baixar PDF
    </button>
  )
}
