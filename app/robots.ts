import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { SITE_URL, IS_INDEXABLE_DEPLOYMENT } from '@/lib/site'
import { PROTECTED_PREFIXES } from '@/lib/seo/routes'

export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE_DEPLOYMENT) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  // Signed-in areas in every locale. Sign-in pages (/login, /register, …) are deliberately
  // NOT disallowed: they carry `noindex`, and crawlers must be able to fetch them to see it.
  const disallow = [
    '/api/',
    ...routing.locales.flatMap((locale) =>
      PROTECTED_PREFIXES.map((prefix) => `/${locale}${prefix}`)
    ),
  ]

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
