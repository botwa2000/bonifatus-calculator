import type { MetadataRoute } from 'next'
import { hasLocale } from 'next-intl'
import { routing, type Locale } from '@/i18n/routing'
import { RATGEBER_INDEX } from '@/content/ratgeber/index'

// Registry of every indexable page. The sitemap, hreflang/canonical tags and robots.txt
// are all derived from this file, so a page is either listed here (and fully wired for
// search) or it is not indexable at all. Blog posts are registered in content/blog;
// Ratgeber articles in content/ratgeber/index.ts (added below automatically).
//
// When you add or materially change a page, add/update its entry and bump `lastModified`.

export interface PublicPage {
  /** Locale-less path, e.g. '/tools/grade-reward-calculator'. */
  path: string
  /** Date the page content last changed (YYYY-MM-DD). Drives sitemap <lastmod>. */
  lastModified: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
  /** Locales the page is actually written in. Omit when it exists in every locale. */
  locales?: readonly Locale[]
}

function ratgeberLocalesOf(locales: string[]): Locale[] {
  return [...new Set(locales)].filter((l): l is Locale => hasLocale(routing.locales, l))
}

// The hub exists in every locale that has articles; each article in its own locale only.
const RATGEBER_PAGES: PublicPage[] = RATGEBER_INDEX.length
  ? [
      {
        path: '/ratgeber',
        lastModified: RATGEBER_INDEX.map((a) => a.updatedAt)
          .sort()
          .at(-1)!,
        changeFrequency: 'weekly',
        priority: 0.8,
        locales: ratgeberLocalesOf(RATGEBER_INDEX.map((a) => a.locale)),
      },
      ...RATGEBER_INDEX.map((a): PublicPage => ({
        path: `/ratgeber/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
        locales: ratgeberLocalesOf([a.locale]),
      })),
    ]
  : []

const STATIC_PAGES: readonly PublicPage[] = [
  { path: '/', lastModified: '2026-08-01', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/about', lastModified: '2026-08-01', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', lastModified: '2026-08-01', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', lastModified: '2026-08-01', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/privacy', lastModified: '2026-08-01', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', lastModified: '2026-08-01', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/cookies', lastModified: '2026-08-01', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/tools', lastModified: '2026-08-01', changeFrequency: 'monthly', priority: 0.9 },
  {
    path: '/tools/grade-reward-calculator',
    lastModified: '2026-08-01',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  {
    path: '/tools/allowance-calculator',
    lastModified: '2026-10-09',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: '/tools/investment-calculator',
    lastModified: '2026-08-01',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  { path: '/blog', lastModified: '2026-08-01', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/compare', lastModified: '2026-08-01', changeFrequency: 'monthly', priority: 0.7 },
  {
    path: '/compare/apps-that-reward-good-grades',
    lastModified: '2026-08-01',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
]

export const PUBLIC_PAGES: readonly PublicPage[] = [...STATIC_PAGES, ...RATGEBER_PAGES]

/** Signed-in areas. Anonymous requests are sent to login; crawlers are kept out. */
export const PROTECTED_PREFIXES = [
  '/dashboard',
  '/student',
  '/parent',
  '/profile',
  '/settings',
  '/admin',
  '/auth',
] as const

/** Sign-in pages: public but noindex; signed-in users are sent on to the dashboard. */
export const AUTH_PAGES = ['/login', '/register', '/forgot-password'] as const

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/')
}

export function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(path, prefix))
}

export function isAuthPage(path: string): boolean {
  return (AUTH_PAGES as readonly string[]).includes(path)
}

export function getPublicPage(path: string): PublicPage | undefined {
  return PUBLIC_PAGES.find((page) => page.path === path)
}

export function pageLocales(page: Pick<PublicPage, 'locales'>): readonly Locale[] {
  return page.locales ?? routing.locales
}
