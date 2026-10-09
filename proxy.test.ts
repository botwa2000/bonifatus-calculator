import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import proxy from '@/proxy'

function request(path: string, init: { lang?: string; cookie?: string } = {}) {
  const headers = new Headers()
  if (init.lang) headers.set('accept-language', init.lang)
  if (init.cookie) headers.set('cookie', init.cookie)
  return new NextRequest(new URL(path, 'https://bonifatus.com'), { headers })
}

const SESSION = 'authjs.session-token=x'

function location(res: Response) {
  const loc = res.headers.get('location')
  return loc ? new URL(loc).pathname + new URL(loc).search : null
}

describe('unprefixed URLs redirect to a locale', () => {
  it('uses Accept-Language', async () => {
    const res = await proxy(request('/', { lang: 'de-DE,de;q=0.9' }))
    expect(res.status).toBe(307)
    expect(location(res)).toBe('/de')
    expect(res.headers.get('vary')).toMatch(/Accept-Language/)
    expect(res.headers.get('vary')).toMatch(/Cookie/)
  })

  it('falls back to English with no language signal (crawlers)', async () => {
    expect(location(await proxy(request('/tools/grade-reward-calculator')))).toBe(
      '/en/tools/grade-reward-calculator'
    )
  })

  it('prefers the locale cookie over Accept-Language', async () => {
    const res = await proxy(request('/faq', { lang: 'de', cookie: 'NEXT_LOCALE=fr' }))
    expect(location(res)).toBe('/fr/faq')
  })

  it('keeps the query string', async () => {
    expect(location(await proxy(request('/login?verified=true', { lang: 'de' })))).toBe(
      '/de/login?verified=true'
    )
  })
})

describe('prefixed URLs are served as-is', () => {
  it('serves a public page in the URL language even if the browser prefers another', async () => {
    const res = await proxy(request('/en/faq', { lang: 'de' }))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })

  it('passes unknown paths through so Next.js returns a 404 (no login redirect)', async () => {
    const res = await proxy(request('/de/ratgeber-gibt-es-nicht'))
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('auth gating', () => {
  it('sends anonymous visitors of protected pages to login in the same locale', async () => {
    const res = await proxy(request('/de/parent/children'))
    expect(location(res)).toBe('/de/login?redirectTo=%2Fparent%2Fchildren')
  })

  it('lets signed-in users through to protected pages', async () => {
    const res = await proxy(request('/de/parent/children', { cookie: SESSION }))
    expect(res.headers.get('location')).toBeNull()
  })

  it('sends signed-in users away from sign-in pages', async () => {
    expect(location(await proxy(request('/de/login', { cookie: SESSION })))).toBe('/de/dashboard')
  })
})

describe('invite links from the mobile app QR code', () => {
  it('sends the unprefixed invite URL to the visitor locale, keeping the code', async () => {
    expect(location(await proxy(request('/invite?code=123456', { lang: 'de' })))).toBe(
      '/de/invite?code=123456'
    )
  })

  it('serves the invite page to anonymous visitors (no login redirect)', async () => {
    const res = await proxy(request('/de/invite?code=123456'))
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('non-page requests', () => {
  it.each(['/sitemap.xml', '/robots.txt', '/sw.js', '/manifest.json', '/images/logo-192.png'])(
    'does not localize %s',
    async (path) => {
      const res = await proxy(request(path, { lang: 'de' }))
      expect(res.headers.get('location')).toBeNull()
      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    }
  )

  it('rejects protected API calls without a session', async () => {
    expect((await proxy(request('/api/grades'))).status).toBe(401)
  })

  it('leaves public API routes alone', async () => {
    const res = await proxy(request('/api/health'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })
})
