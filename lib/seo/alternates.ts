import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'
import { getPublicPage, pageLocales } from '@/lib/seo/routes'

/** Absolute URL of a page in one locale: localizedUrl('de', '/faq') → https://bonifatus.com/de/faq */
export function localizedUrl(locale: string, path: string): string {
  return `${SITE_URL}/${locale}${path === '/' ? '' : path}`
}

/**
 * hreflang map for a page that exists in `locales`. Every listed locale points at its own
 * URL, so the set is identical (and therefore reciprocal) on each language version.
 * x-default is the default-locale version when it exists, otherwise the first locale.
 */
export function buildLanguages(path: string, locales: readonly string[]): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of locales) {
    languages[locale] = localizedUrl(locale, path)
  }
  const fallback = locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0]
  if (fallback) languages['x-default'] = localizedUrl(fallback, path)
  return languages
}

/**
 * Self-referencing canonical + hreflang for a page. Locales come from the page registry
 * (lib/seo/routes.ts) unless given explicitly (blog posts, which register their own).
 */
export function buildAlternates(
  locale: string,
  path: string,
  locales?: readonly string[]
): NonNullable<Metadata['alternates']> {
  const available = locales ?? pageLocales(getPublicPage(path) ?? {})
  return {
    canonical: localizedUrl(locale, path),
    languages: buildLanguages(path, available),
  }
}
