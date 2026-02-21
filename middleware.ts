import { NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { dbg, dbgWarn } from '@/lib/debug'

// Check for session cookie presence (no JWT decoding needed for routing)
// NextAuth v5 uses authjs.* cookie names; secure prefix when NEXTAUTH_URL is https
const SESSION_COOKIE_NAMES = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
]

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => !!req.cookies.get(name)?.value)
}

const locales = routing.locales
const defaultLocale = routing.defaultLocale
const localePattern = new RegExp(`^/(${locales.join('|')})(/|$)`)

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/privacy',
  '/terms',
  '/cookies',
  '/about',
  '/contact',
  '/faq',
]
const publicApiPrefixes = ['/api/health', '/api/auth', '/api/config', '/api/contact']

function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(localePattern)
  if (match) {
    const rest = pathname.slice(match[1].length + 1)
    return rest || '/'
  }
  return pathname
}

function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(localePattern)
  return match ? match[1] : defaultLocale
}

function detectLocale(req: NextRequest): string {
  // 1. Check cookie
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
    return cookieLocale
  }
  // 2. Check Accept-Language header
  const acceptLang = req.headers.get('accept-language')
  if (acceptLang) {
    for (const locale of locales) {
      if (acceptLang.toLowerCase().startsWith(locale)) return locale
    }
  }
  return defaultLocale
}

function localePath(path: string, locale: string): string {
  if (locale === defaultLocale) return path
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
      dbg('mw', `public API pass-through: ${pathname}`)
      return NextResponse.next()
    }
    if (!hasSessionCookie(req)) {
      dbgWarn('mw', `protected API 401: ${pathname}`)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    dbg('mw', `authed API pass-through: ${pathname}`)
    return NextResponse.next()
  }

  // Determine locale from path, cookie, or Accept-Language
  const pathLocale = pathname.match(localePattern)?.[1]
  const barePath = stripLocalePrefix(pathname)
  const locale = pathLocale || detectLocale(req)

  dbg('mw', `route: ${pathname}`, { pathLocale, barePath, locale })

  // If default locale appears in URL, redirect to remove prefix (as-needed strategy)
  if (pathLocale === defaultLocale) {
    dbg('mw', `stripping default locale prefix → ${barePath}`)
    const cleanUrl = new URL(barePath, req.url)
    const res = NextResponse.redirect(cleanUrl)
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' })
    return res
  }

  // Auth check — just check for session cookie presence (no JWT decode needed)
  // Actual JWT validation happens server-side in API routes and auth callbacks
  const isLoggedIn = hasSessionCookie(req)

  dbg('mw', `auth check`, { isLoggedIn, barePath })

  // Public pages
  if (publicRoutes.includes(barePath)) {
    if (isLoggedIn && ['/login', '/register', '/forgot-password'].includes(barePath)) {
      dbg('mw', `logged-in user on auth page → redirect to /dashboard`)
      return NextResponse.redirect(new URL(localePath('/dashboard', locale), req.url))
    }
  } else if (!isLoggedIn) {
    // Protected pages - redirect to login
    const loginUrl = new URL(localePath('/login', locale), req.url)
    loginUrl.searchParams.set('redirectTo', barePath)
    dbg('mw', `unauthed → redirect to login`, { loginUrl: loginUrl.pathname })
    return NextResponse.redirect(loginUrl)
  }

  // Rewrite to locale path for Next.js [locale] segment
  // e.g. / → /en, /dashboard → /en/dashboard, /de/dashboard stays as-is
  const rewritePath = pathLocale ? pathname : `/${locale}${barePath === '/' ? '' : barePath}`
  if (rewritePath !== pathname) {
    const rewriteUrl = new URL(rewritePath, req.url)
    rewriteUrl.search = req.nextUrl.search
    dbg('mw', `rewrite: ${pathname} → ${rewritePath}`)
    const res = NextResponse.rewrite(rewriteUrl)
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' })
    return res
  }

  // Path already has non-default locale prefix, serve as-is
  dbg('mw', `pass-through: ${pathname}`)
  const res = NextResponse.next()
  res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
