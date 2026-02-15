import { Link } from '@/i18n/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('cookiePolicy')
  const tc = await getTranslations('common')

  const cookies = [
    {
      name: 'authjs.session-token',
      purpose: t('cookieAuthPurpose'),
      duration: t('cookieAuthDuration'),
      type: t('typeEssential'),
    },
    {
      name: '__Secure-authjs.session-token',
      purpose: t('cookieAuthSecurePurpose'),
      duration: t('cookieAuthDuration'),
      type: t('typeEssential'),
    },
    {
      name: 'NEXT_LOCALE',
      purpose: t('cookieLocalePurpose'),
      duration: t('cookieLocaleDuration'),
      type: t('typeEssential'),
    },
    {
      name: 'bonifatus-cookie-consent',
      purpose: t('cookieConsentPurpose'),
      duration: t('cookieConsentDuration'),
      type: t('typeEssential'),
      storage: 'localStorage',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

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

          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            <strong>{t('lastUpdated')}</strong> {t('lastUpdatedDate')}
          </p>

          <div className="prose dark:prose-invert max-w-none space-y-8">
            {/* What Are Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                {t('whatAreCookiesTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300">{t('whatAreCookiesDesc')}</p>
            </section>

            {/* Cookies We Use */}
            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                {t('cookiesWeUseTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-4">{t('cookiesWeUseDesc')}</p>

              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800/80">
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-white">
                        {t('tableName')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-white">
                        {t('tablePurpose')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-white">
                        {t('tableDuration')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-white">
                        {t('tableType')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {cookies.map((c) => (
                      <tr key={c.name}>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                          {c.name}
                          {c.storage && (
                            <span className="ml-1 text-[10px] text-neutral-400">({c.storage})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                          {c.purpose}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                          {c.duration}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-success-100 dark:bg-success-900/30 px-2 py-0.5 text-xs font-semibold text-success-700 dark:text-success-300">
                            {c.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                {t('thirdPartyTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300">{t('thirdPartyDesc')}</p>
            </section>

            {/* How to Control */}
            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                {t('controlTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-3">{t('controlDesc')}</p>
              <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-1">
                <li>{t('controlBrowser')}</li>
                <li>{t('controlWidget')}</li>
                <li>{t('controlNote')}</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                {t('rightsTitle')}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
                    {t('rightsGdprTitle')}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">{t('rightsGdprDesc')}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
                    {t('rightsUkTitle')}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">{t('rightsUkDesc')}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
                    {t('rightsSwissTitle')}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">{t('rightsSwissDesc')}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
                    {t('rightsCcpaTitle')}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">{t('rightsCcpaDesc')}</p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                {t('contactTitle')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300">
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
