import { describe, expect, it } from 'vitest'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'
import { buildAlternates, buildLanguages, localizedUrl } from '@/lib/seo/alternates'
import { PUBLIC_PAGES, isAuthPage, isProtectedPath, pageLocales } from '@/lib/seo/routes'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'

describe('localizedUrl', () => {
  it('always carries the locale prefix and never a trailing slash', () => {
    expect(localizedUrl('en', '/')).toBe(`${SITE_URL}/en`)
    expect(localizedUrl('de', '/')).toBe(`${SITE_URL}/de`)
    expect(localizedUrl('de', '/faq')).toBe(`${SITE_URL}/de/faq`)
  })
})

describe('buildAlternates', () => {
  it('emits a self-referencing canonical', () => {
    expect(buildAlternates('de', '/faq').canonical).toBe(`${SITE_URL}/de/faq`)
  })

  it('lists every locale of an all-locale page plus x-default → default locale', () => {
    const languages = buildAlternates('fr', '/tools').languages as Record<string, string>
    expect(Object.keys(languages).sort()).toEqual([...routing.locales, 'x-default'].sort())
    expect(languages['x-default']).toBe(`${SITE_URL}/en/tools`)
  })

  it('is identical on every language version (reciprocal hreflang)', () => {
    const sets = routing.locales.map((l) => JSON.stringify(buildAlternates(l, '/faq').languages))
    expect(new Set(sets).size).toBe(1)
  })

  it('only lists locales a page really exists in; x-default falls back to the first', () => {
    const languages = buildLanguages('/de-only', ['de'])
    expect(languages).toEqual({
      de: `${SITE_URL}/de/de-only`,
      'x-default': `${SITE_URL}/de/de-only`,
    })
  })
})

describe('page registry', () => {
  it('has unique paths', () => {
    const paths = PUBLIC_PAGES.map((p) => p.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('uses valid dates and only supported locales', () => {
    for (const page of PUBLIC_PAGES) {
      expect(page.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(page.lastModified))).toBe(false)
      for (const l of pageLocales(page)) expect(routing.locales).toContain(l)
    }
  })

  it('never lists a protected or sign-in page as indexable', () => {
    for (const page of PUBLIC_PAGES) {
      expect(isProtectedPath(page.path)).toBe(false)
      expect(isAuthPage(page.path)).toBe(false)
    }
  })

  it('matches protected prefixes on segment boundaries only', () => {
    expect(isProtectedPath('/parent')).toBe(true)
    expect(isProtectedPath('/parent/children')).toBe(true)
    expect(isProtectedPath('/parenting-guide')).toBe(false)
    expect(isProtectedPath('/tools')).toBe(false)
  })
})

describe('sitemap', () => {
  it('contains every registered page in each of its locales, all prefixed', async () => {
    const entries = await sitemap()
    const urls = new Set(entries.map((e) => e.url))
    for (const page of PUBLIC_PAGES) {
      for (const l of pageLocales(page)) expect(urls).toContain(localizedUrl(l, page.path))
    }
    for (const url of urls)
      expect(url).toMatch(new RegExp(`^${SITE_URL}/(${routing.locales.join('|')})(/|$)`))
  })

  it('contains no protected or sign-in URLs', async () => {
    for (const { url } of await sitemap()) {
      const path = url.slice(SITE_URL.length).replace(/^\/[a-z]{2}/, '') || '/'
      expect(isProtectedPath(path)).toBe(false)
      expect(isAuthPage(path)).toBe(false)
    }
  })

  it('uses real content dates, not the request time', async () => {
    for (const { lastModified } of await sitemap()) {
      expect(String(lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('only lists blog posts in locales that exist', async () => {
    const blogUrls = (await sitemap()).filter((e) => e.url.includes('/blog/')).map((e) => e.url)
    expect(blogUrls.length).toBeGreaterThan(0)
    expect(blogUrls.some((u) => u.includes('/fr/blog/'))).toBe(false)
  })
})

describe('robots', () => {
  it('disallows signed-in areas in every locale and points at the sitemap', () => {
    const result = robots()
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rule.disallow).toContain('/api/')
    for (const l of routing.locales) expect(rule.disallow).toContain(`/${l}/dashboard`)
    expect(rule.disallow).not.toContain('/en/login')
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })
})
