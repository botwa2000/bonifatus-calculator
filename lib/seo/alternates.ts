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

export function buildAlternates(locale: string, path: string) {
  return {
    canonical: buildUrl(locale, path),
    languages: buildLanguages(path),
  }
}
