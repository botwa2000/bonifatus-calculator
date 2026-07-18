import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { auth } from '@/auth'
import type { Metadata } from 'next'
import { InvestmentCalculatorClient } from './InvestmentCalculatorClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })
  return {
    title: t('investmentCalculatorTitle'),
    description: t('investmentCalculatorDescription'),
    alternates: { canonical: '/tools/investment-calculator' },
  }
}

export default async function InvestmentCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('tools')

  return (
    <div className="min-h-screen bg-gradient-to-br from-info-50 via-white to-primary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <Link
            href="/tools"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6 inline-block"
          >
            ← {t('indexTitle')}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
            {t('investTitle')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">{t('investSubtitle')}</p>
        </div>

        <div className="bg-white dark:bg-neutral-800/50 rounded-2xl p-8 shadow-card">
          <InvestmentCalculatorClient />
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-info-600 to-primary-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">{t('investCtaTitle')}</h2>
          <p className="opacity-90 mb-6">{t('investCtaDesc')}</p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:shadow-xl transition-all"
          >
            {t('investCtaButton')}
          </Link>
        </div>
      </main>
    </div>
  )
}
