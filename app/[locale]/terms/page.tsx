import { Link } from '@/i18n/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('terms')
  const tc = await getTranslations('common')

  const sections = [
    {
      title: t('acceptTitle'),
      paragraphs: [t('acceptP1'), t('acceptP2')],
    },
    {
      title: t('serviceTitle'),
      desc: t('serviceDesc'),
      items: [
        t('serviceL1'),
        t('serviceL2'),
        t('serviceL3'),
        t('serviceL4'),
        t('serviceL5'),
        t('serviceL6'),
      ],
    },
    {
      title: t('accountsTitle'),
      desc: t('accountsDesc'),
      items: [t('accountsL1'), t('accountsL2'), t('accountsL3'), t('accountsL4')],
    },
    {
      title: t('responsibilitiesTitle'),
      desc: t('responsibilitiesDesc'),
      items: [
        t('responsibilitiesL1'),
        t('responsibilitiesL2'),
        t('responsibilitiesL3'),
        t('responsibilitiesL4'),
        t('responsibilitiesL5'),
      ],
    },
    {
      title: t('ipTitle'),
      paragraphs: [t('ipDesc')],
    },
    {
      title: t('privacyTitle'),
      paragraphs: [t('privacyDesc')],
    },
    {
      title: t('thirdPartyTitle'),
      desc: t('thirdPartyDesc'),
      items: [t('thirdPartyL1'), t('thirdPartyL2'), t('thirdPartyL3')],
    },
    {
      title: t('disclaimerTitle'),
      paragraphs: [t('disclaimerP1'), t('disclaimerP2')],
    },
    {
      title: t('liabilityTitle'),
      paragraphs: [t('liabilityDesc')],
    },
    {
      title: t('terminationTitle'),
      paragraphs: [t('terminationDesc')],
    },
    {
      title: t('lawTitle'),
      paragraphs: [t('lawDesc')],
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
                  href="mailto:legal@bonifatus.com"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  legal@bonifatus.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
