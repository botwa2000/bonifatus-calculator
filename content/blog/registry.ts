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
  const post = await loadPost(locale, slug)
  if (post) return post
  return loadPost('en', slug)
}

export async function getAllPosts(locale: string): Promise<BlogPost[]> {
  const results = await Promise.all(
    ALL_SLUGS.map(async (slug) => {
      const post = await loadPost(locale, slug)
      return post ?? loadPost('en', slug)
    })
  )
  return results.filter((p): p is BlogPost => p !== null)
}

export function getAllSlugs(): string[] {
  return [...ALL_SLUGS]
}

export function getSupportedLocales(): string[] {
  return [...SUPPORTED_LOCALES]
}
