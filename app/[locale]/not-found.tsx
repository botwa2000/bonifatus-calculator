import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { auth } from '@/auth'

export default async function NotFoundPage() {
  const t = await getTranslations('notFound')
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={Boolean(session?.user)} />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-6">
          404
        </p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">{t('title')}</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-10">{t('description')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {t('backHome')}
          </Link>
          <Link
            href="/tools"
            className="px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100 rounded-lg font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
          >
            {t('browseTools')}
          </Link>
        </div>
      </main>
    </div>
  )
}
