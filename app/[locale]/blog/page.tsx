import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { JsonLd, webSiteJsonLd } from '@/components/seo/JsonLd'
import { getAllPosts } from '@/content/blog/registry'
import { auth } from '@/auth'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })
  return {
    title: t('blogTitle'),
    description: t('blogDescription'),
    alternates: { canonical: '/blog' },
  }
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('blog')
  const posts = await getAllPosts(locale)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <JsonLd data={webSiteJsonLd()} />
      <AppHeader variant="public" isAuthed={isAuthed} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('indexTitle')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t('indexSubtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-white dark:bg-neutral-800/50 rounded-2xl p-8 shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                <time dateTime={post.publishedAt}>
                  {t('publishedOn')}{' '}
                  {new Date(post.publishedAt).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span>·</span>
                <span>
                  {post.readingTimeMinutes} {t('minuteRead')}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                {post.title}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
              >
                {t('readMore')} →
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
