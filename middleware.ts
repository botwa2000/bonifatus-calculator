import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/privacy', '/terms']
const publicApiPrefixes = ['/api/health', '/api/auth', '/api/config']

function stripLocalePrefix(pathname: string): string {
  const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/|$)`)
  const match = pathname.match(localePattern)
  if (match) {
    const rest = pathname.slice(match[1].length + 1)
    return rest || '/'
  }
  return pathname
}

function getLocaleFromPath(pathname: string): string {
  const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/|$)`)
  const match = pathname.match(localePattern)
  return match ? match[1] : routing.defaultLocale
}

function localePath(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return path
  return `/${locale}${path}`
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // API routes - no locale prefix, no intl middleware
  if (pathname.startsWith('/api/')) {
    if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next()
    }
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // For page routes, strip locale prefix to determine the "bare" path
  const barePath = stripLocalePrefix(pathname)
  const locale = getLocaleFromPath(pathname)
  const token = await getToken({ req })
  const isLoggedIn = !!token

  // Public pages
  if (publicRoutes.includes(barePath)) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && ['/login', '/register', '/forgot-password'].includes(barePath)) {
      return NextResponse.redirect(new URL(localePath('/dashboard', locale), req.url))
    }
    return intlMiddleware(req)
  }

  // Protected pages - redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL(localePath('/login', locale), req.url)
    loginUrl.searchParams.set('redirectTo', barePath)
    return NextResponse.redirect(loginUrl)
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
