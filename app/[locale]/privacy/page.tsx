import { Link } from '@/i18n/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('privacy')
  const tc = await getTranslations('common')

  const sections = [
    {
      title: t('introTitle'),
      paragraphs: [t('introDesc')],
    },
    {
      title: t('controllerTitle'),
      paragraphs: [t('controllerDesc')],
    },
    {
      title: t('collectTitle'),
      desc: t('collectDesc'),
      items: [
        t('collectL1'),
        t('collectL2'),
        t('collectL3'),
        t('collectL4'),
        t('collectL5'),
        t('collectL6'),
      ],
    },
    {
      title: t('useTitle'),
      desc: t('useDesc'),
      items: [t('useL1'), t('useL2'), t('useL3'), t('useL4'), t('useL5')],
    },
    {
      title: t('basisTitle'),
      desc: t('basisDesc'),
      items: [t('basisL1'), t('basisL2'), t('basisL3')],
    },
    {
      title: t('storageTitle'),
      desc: t('storageDesc'),
      items: [t('storageL1'), t('storageL2'), t('storageL3')],
    },
    {
      title: t('thirdPartyTitle'),
      desc: t('thirdPartyDesc'),
      items: [t('thirdPartyL1'), t('thirdPartyL2'), t('thirdPartyL3')],
    },
    {
      title: t('cookiesTitle'),
      paragraphs: [t('cookiesDesc')],
    },
    {
      title: t('childrenTitle'),
      desc: t('childrenDesc'),
      items: [t('childrenL1'), t('childrenL2'), t('childrenL3')],
    },
    {
      title: t('rightsTitle'),
      desc: t('rightsDesc'),
      items: [
        t('rightsL1'),
        t('rightsL2'),
        t('rightsL3'),
        t('rightsL4'),
        t('rightsL5'),
        t('rightsL6'),
        t('rightsL7'),
        t('rightsL8'),
      ],
    },
    {
      title: t('retentionTitle'),
      paragraphs: [t('retentionDesc')],
    },
    {
      title: t('changesTitle'),
      paragraphs: [t('changesDesc')],
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
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                  {section.title}
                </h2>
                {section.desc && (
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">{section.desc}</p>
                )}
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="text-neutral-600 dark:text-neutral-300 mb-3">
                    {p}
                  </p>
                ))}
                {section.items && (
                  <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

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
