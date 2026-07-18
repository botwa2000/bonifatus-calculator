import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
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
    title: t('toolsTitle'),
    description: t('toolsDescription'),
    alternates: { canonical: '/tools' },
  }
}

const TOOLS = [
  {
    href: '/tools/grade-reward-calculator' as const,
    nameKey: 'gradeCalculatorName' as const,
    descKey: 'gradeCalculatorDesc' as const,
    emoji: '🎓',
    color: 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20',
    badge: 'bg-primary-600',
  },
  {
    href: '/tools/allowance-calculator' as const,
    nameKey: 'allowanceCalculatorName' as const,
    descKey: 'allowanceCalculatorDesc' as const,
    emoji: '💰',
    color: 'from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20',
    badge: 'bg-success-600',
  },
  {
    href: '/tools/investment-calculator' as const,
    nameKey: 'investmentCalculatorName' as const,
    descKey: 'investmentCalculatorDesc' as const,
    emoji: '📈',
    color: 'from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20',
    badge: 'bg-info-600',
  },
]

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('tools')
  const tSeo = await getTranslations('seo')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('indexTitle')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t('indexSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`block p-8 rounded-2xl bg-gradient-to-br ${tool.color} hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
            >
              <div
                className={`w-14 h-14 ${tool.badge} rounded-xl flex items-center justify-center mb-6 text-2xl`}
              >
                {tool.emoji}
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {t(tool.nameKey)}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t(tool.descKey)}</p>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-12 text-white">
          <h2 className="text-2xl font-bold mb-3">{tSeo('gradeCalculatorTitle')}</h2>
          <p className="opacity-90 mb-6">{tSeo('gradeCalculatorDescription')}</p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:shadow-xl transition-all"
          >
            {t('calcCtaButton')}
          </Link>
        </div>
      </main>
    </div>
  )
}
