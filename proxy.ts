import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { isAuthPage, isProtectedPath } from '@/lib/seo/routes'
import { dbg, dbgWarn } from '@/lib/debug'

const MOBILE_APP_SECRET = process.env.MOBILE_APP_SECRET ?? 'dev-secret-replace-in-prod'
const TOKEN_MAX_AGE_MS = 5 * 60 * 1000

// Validates X-Mobile-Client-Token using Web Crypto (Edge-compatible HMAC-SHA256).
// Format: <hmac_hex>:<timestamp_ms>:<deviceId>  payload: <deviceId>:<timestamp_ms>:<path>
async function validateMobileTokenEdge(token: string, path: string): Promise<boolean> {
  const firstColon = token.indexOf(':')
  const secondColon = token.indexOf(':', firstColon + 1)
  if (firstColon === -1 || secondColon === -1) return false

  const providedHmac = token.slice(0, firstColon)
  const timestamp = token.slice(firstColon + 1, secondColon)
  const deviceId = token.slice(secondColon + 1)
  if (!providedHmac || !timestamp || !deviceId) return false

  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() - ts) > TOKEN_MAX_AGE_MS) return false

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(MOBILE_APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${deviceId}:${timestamp}:${path}`))
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (computed.length !== providedHmac.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++)
    diff |= computed.charCodeAt(i) ^ providedHmac.charCodeAt(i)
  return diff === 0
}

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

const publicApiPrefixes = ['/api/health', '/api/auth', '/api/config', '/api/contact', '/api/mobile']

// Locale routing (always-prefixed URLs, unprefixed → redirect to the visitor's locale).
const handleI18nRouting = createIntlMiddleware(routing)

const localePattern = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`)

// Any path whose last segment has a file extension is a static/metadata file
// (sitemap.xml, robots.txt, sw.js, manifest.json, images, …) and is never localized.
const FILE_PATTERN = /\/[^/]+\.[a-z0-9]+$/i

// Next.js 16 proxy (formerly middleware): runs before every matched request.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next') || FILE_PATTERN.test(pathname)) {
    return NextResponse.next()
  }

  // API routes - no locale prefix, no intl middleware
  if (pathname.startsWith('/api/')) {
    if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      dbg('mw', `public API pass-through: ${pathname}`)
      return NextResponse.next()
    }
    // Mobile clients send a signed X-Mobile-Client-Token — validate HMAC before granting pass-through
    const mobileToken = req.headers.get('x-mobile-client-token')
    if (mobileToken) {
      const valid = await validateMobileTokenEdge(mobileToken, pathname)
      if (valid) {
        dbg('mw', `mobile API pass-through (token verified): ${pathname}`)
        return NextResponse.next()
      }
      dbgWarn('mw', `mobile token invalid/expired — falling through to bearer check: ${pathname}`)
      // Don't reject here: debug builds use a placeholder MOBILE_APP_SECRET.
      // Route handlers validate the Bearer JWT via requireAuthApi() anyway.
    }
    // Bearer JWT is sufficient auth for mobile clients (debug builds or release).
    // The route handler's requireAuthApi() verifies the JWT server-side.
    if (req.headers.get('authorization')?.startsWith('Bearer ')) {
      dbg('mw', `mobile bearer API pass-through: ${pathname}`)
      return NextResponse.next()
    }
    if (!hasSessionCookie(req)) {
      dbgWarn('mw', `protected API 401: ${pathname}`)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    dbg('mw', `authed API pass-through: ${pathname}`)
    return NextResponse.next()
  }

  const intlResponse = handleI18nRouting(req)

  // Unprefixed URL (/, /faq, …): next-intl redirects to the visitor's locale. The target
  // depends on the cookie and Accept-Language, so caches must key on both.
  if (intlResponse.headers.has('location')) {
    intlResponse.headers.append('Vary', 'Accept-Language, Cookie')
    dbg('mw', `locale redirect: ${pathname} → ${intlResponse.headers.get('location')}`)
    return intlResponse
  }

  // From here on the path carries a valid locale prefix (next-intl only passes a request
  // through without one for undecodable URLs, which Next.js rejects with a 400).
  const locale = pathname.match(localePattern)?.[1]
  if (!locale) return intlResponse
  const barePath = pathname.slice(locale.length + 1) || '/'
  const isLoggedIn = hasSessionCookie(req)

  if (!isLoggedIn && isProtectedPath(barePath)) {
    const loginUrl = new URL(`/${locale}/login`, req.url)
    loginUrl.searchParams.set('redirectTo', barePath)
    dbg('mw', `unauthed → redirect to login`, { pathname })
    return NextResponse.redirect(loginUrl)
  }

  if (isLoggedIn && isAuthPage(barePath)) {
    dbg('mw', `logged-in user on auth page → redirect to dashboard`)
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url))
  }

  // Everything else — public pages, and unknown paths, which Next.js answers with a 404.
  return intlResponse
}

export const config = {
  // `social` is excluded so /social/index.html stays publicly reachable — Pinterest's
  // Save-from-URL scraper and Instagram's media cURL must fetch it without a login redirect.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|social).*)'],
}
