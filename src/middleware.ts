import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn   = !!req.auth

  const isProtected = pathname.startsWith('/mentoria') || pathname.startsWith('/painel') || pathname.startsWith('/admin')

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/admin') && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/painel', req.url))
  }
})

export const config = {
  matcher: ['/mentoria/:path*', '/admin/:path*', '/painel/:path*'],
}
