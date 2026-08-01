import { headers } from 'next/headers'
import { routing } from '@/i18n/routing'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bonifatus.com'
const { locales, defaultLocale } = routing

export function buildUrl(locale: string, path: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  const normalized = path === '/' ? '' : path
  return `${BASE_URL}${prefix}${normalized || '/'}`
}

export function buildLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of locales) {
    languages[locale] = buildUrl(locale, path)
  }
  languages['x-default'] = buildUrl(defaultLocale, path)
  return languages
}

export function buildLanguagesFor(
  path: string,
  availableLocales: readonly string[]
): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of availableLocales) {
    languages[locale] = buildUrl(locale, path)
  }
  if (availableLocales.includes(defaultLocale)) {
    languages['x-default'] = buildUrl(defaultLocale, path)
  }
  return languages
}

// When the middleware rewrites a non-prefixed URL (e.g. /about) to a locale path
// (e.g. /de/about) it forwards `x-original-pathname` so we can emit a canonical
// that matches the actual URL the browser and crawler see.
export async function buildAlternates(locale: string, path: string) {
  const h = await headers()
  const originalPath = h.get('x-original-pathname')
  const canonical = originalPath ? `${BASE_URL}${originalPath}` : buildUrl(locale, path)
  return {
    canonical,
    languages: buildLanguages(path),
  }
}

export async function buildAlternatesFor(
  locale: string,
  path: string,
  availableLocales: readonly string[]
) {
  const h = await headers()
  const originalPath = h.get('x-original-pathname')
  const canonical = originalPath ? `${BASE_URL}${originalPath}` : buildUrl(locale, path)
  return {
    canonical,
    languages: buildLanguagesFor(path, availableLocales),
  }
}
