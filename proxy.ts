import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'fleetops_session'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value

  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/')
  const isDriverArea = pathname === '/driver' || pathname.startsWith('/driver/')

  if ((isAdminArea || isDriverArea) && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*'],
}
