import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Liinc Mentorias',
  description: 'Painel de acompanhamento de mentorias em tempo real — Plataforma Liinc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Work+Sans:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-navy text-white antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  )
}
