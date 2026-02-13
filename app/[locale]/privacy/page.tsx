import { Link } from '@/i18n/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('privacy')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors duration-normal"
            >
              {tc('backToHome')}
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-6">{t('title')}</h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              <strong>{t('lastUpdated')}</strong> {t('lastUpdatedDate')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                {t('comingSoonTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">{t('comingSoonDesc')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                {t('commitmentTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('commitmentDesc')}</p>
              <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
                <li>{t('neverSell')}</li>
                <li>{t('encryption')}</li>
                <li>{t('compliance')}</li>
                <li>{t('control')}</li>
                <li>{t('transparent')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                {t('contactTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                {t('contactDesc')}{' '}
                <a
                  href="mailto:privacy@bonifatus.com"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  privacy@bonifatus.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
