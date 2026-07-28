import type { BlogPost } from './types'

async function loadPost(locale: string, slug: string): Promise<BlogPost | null> {
  try {
    const mod = await import(`./posts/${locale}/${slug}`)
    return mod.default as BlogPost
  } catch {
    return null
  }
}

const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'it', 'es', 'ru'] as const
const ALL_SLUGS = ['should-you-pay-kids-for-good-grades'] as const

export type PostSlug = (typeof ALL_SLUGS)[number]

export async function getPost(locale: string, slug: string): Promise<BlogPost | null> {
  return loadPost(locale, slug)
}

export async function getAllPosts(locale: string): Promise<BlogPost[]> {
  const results = await Promise.all(ALL_SLUGS.map((slug) => loadPost(locale, slug)))
  return results.filter((p): p is BlogPost => p !== null)
}

export async function getLocalesForSlug(slug: string): Promise<string[]> {
  const results: (string | null)[] = await Promise.all(
    SUPPORTED_LOCALES.map(async (locale): Promise<string | null> => {
      const post = await loadPost(locale, slug)
      return post ? locale : null
    })
  )
  return results.filter((l): l is string => l !== null)
}

export function getAllSlugs(): string[] {
  return [...ALL_SLUGS]
}

export function getSupportedLocales(): string[] {
  return [...SUPPORTED_LOCALES]
}
