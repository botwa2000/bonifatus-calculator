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
    title: t('compareAppsTitle'),
    description: t('compareAppsDescription'),
    alternates: { canonical: '/compare/apps-that-reward-good-grades' },
  }
}

type CellValue = 'yes' | 'no' | 'partial'

interface ComparisonRow {
  featureKey: string
  bonifatus: CellValue
  classDojo: CellValue
  goHenry: CellValue
  bark: CellValue
}

const ROWS: ComparisonRow[] = [
  {
    featureKey: 'appsFeatureGradeCalc',
    bonifatus: 'yes',
    classDojo: 'partial',
    goHenry: 'no',
    bark: 'no',
  },
  {
    featureKey: 'appsFeatureMultiSubject',
    bonifatus: 'yes',
    classDojo: 'no',
    goHenry: 'no',
    bark: 'no',
  },
  {
    featureKey: 'appsFeatureParentControl',
    bonifatus: 'yes',
    classDojo: 'yes',
    goHenry: 'yes',
    bark: 'yes',
  },
  {
    featureKey: 'appsFeatureFree',
    bonifatus: 'yes',
    classDojo: 'yes',
    goHenry: 'no',
    bark: 'no',
  },
  {
    featureKey: 'appsFeatureMultiLocale',
    bonifatus: 'yes',
    classDojo: 'partial',
    goHenry: 'partial',
    bark: 'no',
  },
  {
    featureKey: 'appsFeatureReportCard',
    bonifatus: 'yes',
    classDojo: 'no',
    goHenry: 'no',
    bark: 'no',
  },
  {
    featureKey: 'appsFeatureAllowance',
    bonifatus: 'yes',
    classDojo: 'no',
    goHenry: 'yes',
    bark: 'no',
  },
  {
    featureKey: 'appsFeatureHistory',
    bonifatus: 'yes',
    classDojo: 'partial',
    goHenry: 'yes',
    bark: 'partial',
  },
  {
    featureKey: 'appsFeaturePrivacy',
    bonifatus: 'yes',
    classDojo: 'no',
    goHenry: 'partial',
    bark: 'partial',
  },
]

function Cell({
  value,
  yes,
  no,
  partial,
}: {
  value: 'yes' | 'no' | 'partial'
  yes: string
  no: string
  partial: string
}) {
  if (value === 'yes')
    return <span className="text-success-600 dark:text-success-400 font-semibold">✓ {yes}</span>
  if (value === 'no') return <span className="text-neutral-400 dark:text-neutral-500">✗ {no}</span>
  return <span className="text-warning-600 dark:text-warning-400">~ {partial}</span>
}

export default async function AppsComparisonPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('compare')

  const yes = t('pageYes')
  const no = t('pageNo')
  const partial = t('pagePartial')

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Back */}
        <Link
          href="/compare"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-8 inline-block"
        >
          ← {t('indexTitle')}
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('appsTitle')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">{t('appsSubtitle')}</p>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 mb-12">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-neutral-700 dark:text-neutral-300 min-w-[200px]">
                  {t('pageFeature')}
                </th>
                <th className="px-6 py-4 text-center font-semibold">
                  <span className="text-primary-600 dark:text-primary-400">
                    {t('pageBonifatus')}
                  </span>
                </th>
                <th className="px-6 py-4 text-center font-semibold text-neutral-600 dark:text-neutral-400">
                  ClassDojo
                </th>
                <th className="px-6 py-4 text-center font-semibold text-neutral-600 dark:text-neutral-400">
                  GoHenry
                </th>
                <th className="px-6 py-4 text-center font-semibold text-neutral-600 dark:text-neutral-400">
                  Bark
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, idx) => (
                <tr
                  key={row.featureKey}
                  className={`border-t border-neutral-100 dark:border-neutral-700 ${
                    idx % 2 === 0 ? '' : 'bg-neutral-50/50 dark:bg-neutral-800/30'
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                    {t(row.featureKey as Parameters<typeof t>[0])}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Cell value={row.bonifatus} yes={yes} no={no} partial={partial} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Cell value={row.classDojo} yes={yes} no={no} partial={partial} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Cell value={row.goHenry} yes={yes} no={no} partial={partial} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Cell value={row.bark} yes={yes} no={no} partial={partial} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verdict */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('appsVerdictTitle')}
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300">{t('appsVerdictBonifatus')}</p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-10 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">{t('pageCtaTitle')}</h2>
          <p className="opacity-90 mb-2">{t('pageCtaDesc')}</p>
          <p className="opacity-75 mb-8 text-sm">{t('appsBottomCta')}</p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            {t('pageCtaButton')}
          </Link>
        </div>
      </main>
    </div>
  )
}
