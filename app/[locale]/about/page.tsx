import { Link } from '@/i18n/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('about')
  const tc = await getTranslations('common')

  const offerings = [
    { title: t('what1Title'), desc: t('what1Desc'), icon: '🧮' },
    { title: t('what2Title'), desc: t('what2Desc'), icon: '👨‍👩‍👧‍👦' },
    { title: t('what3Title'), desc: t('what3Desc'), icon: '🎁' },
    { title: t('what4Title'), desc: t('what4Desc'), icon: '📊' },
  ]

  const values = [
    { title: t('value1Title'), desc: t('value1Desc'), color: 'primary' },
    { title: t('value2Title'), desc: t('value2Desc'), color: 'secondary' },
    { title: t('value3Title'), desc: t('value3Desc'), color: 'info' },
    { title: t('value4Title'), desc: t('value4Desc'), color: 'success' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors duration-normal"
          >
            {tc('backToHome')}
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t('heroDesc')}
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8 mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('missionTitle')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {t('missionDesc')}
          </p>
        </div>

        {/* What We Offer */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
            {t('whatTitle')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {offerings.map((item) => (
              <div
                key={item.title}
                className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-6"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
            {t('valuesTitle')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="border-l-4 border-primary-500 bg-white dark:bg-neutral-800 rounded-r-2xl shadow-card p-6"
              >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {v.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Based in Germany */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8 mb-12 text-center">
          <div className="text-4xl mb-3">🇩🇪</div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            {t('basedIn')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto">
            {t('basedInDesc')}
          </p>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-3">{t('ctaTitle')}</h2>
          <p className="text-white/90 mb-6">{t('ctaDesc')}</p>
          <Link
            href="/register"
            className="inline-block rounded-xl bg-white px-8 py-3 font-semibold text-primary-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            {t('signUpFree')}
          </Link>
        </div>
      </div>
    </div>
  )
}
