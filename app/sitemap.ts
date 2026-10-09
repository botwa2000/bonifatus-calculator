import type { MetadataRoute } from 'next'
import { PUBLIC_PAGES, pageLocales } from '@/lib/seo/routes'
import { localizedUrl, buildLanguages } from '@/lib/seo/alternates'
import { getAllSlugs, getLocalesForSlug, getPost } from '@/content/blog/registry'

// One <url> per page per locale it exists in, each carrying the full hreflang set.
// Generated from the page registry (lib/seo/routes.ts) and the blog registry — never
// hand-maintained.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  for (const page of PUBLIC_PAGES) {
    const locales = pageLocales(page)
    const languages = buildLanguages(page.path, locales)
    for (const locale of locales) {
      entries.push({
        url: localizedUrl(locale, page.path),
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages },
      })
    }
  }

  for (const slug of getAllSlugs()) {
    const path = `/blog/${slug}`
    const locales = await getLocalesForSlug(slug)
    const languages = buildLanguages(path, locales)
    for (const locale of locales) {
      const post = await getPost(locale, slug)
      if (!post) continue
      entries.push({
        url: localizedUrl(locale, path),
        lastModified: post.updatedAt ?? post.publishedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: { languages },
      })
    }
  }

  return entries
}
