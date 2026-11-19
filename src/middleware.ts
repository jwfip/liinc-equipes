import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { needsPasswordChange, PASSWORD_PAGE } from '@/lib/auth-routes'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn   = !!req.auth

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (needsPasswordChange(pathname, !!req.auth?.user?.mustChangePassword)) {
    return NextResponse.redirect(new URL(PASSWORD_PAGE, req.url))
  }
  if (pathname.startsWith('/admin') && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/painel', req.url))
  }
})

export const config = {
  matcher: ['/mentoria/:path*', '/admin/:path*', '/painel/:path*', '/conta/:path*'],
}
