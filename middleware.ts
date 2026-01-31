import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/privacy', '/terms']

const publicApiPrefixes = ['/api/health', '/api/auth']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Public API routes
  if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Protected API routes - return 401 JSON
  if (pathname.startsWith('/api/') && !isLoggedIn) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Public pages
  if (publicRoutes.includes(pathname)) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && ['/login', '/register', '/forgot-password'].includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protected pages - redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
