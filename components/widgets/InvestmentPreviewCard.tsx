'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

function projectGrowth(annualPMT: number, years: number, rate = 0.085): number {
  // Future value of annuity (end-of-period): PMT × ((1+r)^n − 1) / r
  return annualPMT * ((Math.pow(1 + rate, years) - 1) / rate)
}

type Props = {
  totalPts: number
  childCount: number
}

export function InvestmentPreviewCard({ totalPts, childCount }: Props) {
  const t = useTranslations('parent')

  if (totalPts <= 0) return null

  const annualAmount = Math.round(totalPts) // €1 per point
  const milestones = [
    { key: 'investPreviewYear5', years: 5 },
    { key: 'investPreviewYear10', years: 10 },
    { key: 'investPreviewYear18', years: 18 },
  ] as const

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">📈</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('investPreviewTitle')}
        </h3>
      </div>

      {/* Total pts pill */}
      <div className="bg-white/70 dark:bg-neutral-900/50 rounded-xl px-4 py-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
          {childCount > 1
            ? `${childCount} children · ${t('investPreviewEarned')}`
            : t('investPreviewEarned')}
        </p>
        <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
          {Math.round(totalPts).toLocaleString()} pts
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {t('investPreviewRate')} →{' '}
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">
            €{annualAmount.toLocaleString()}/yr
          </span>
        </p>
      </div>

      {/* Milestone table */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
          {t('investPreviewMsci')}
        </p>
        {milestones.map(({ key, years }) => {
          const value = projectGrowth(annualAmount, years)
          return (
            <div key={years} className="flex items-center justify-between">
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{t(key)}</span>
              <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                €{Math.round(value).toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] leading-snug text-neutral-400 dark:text-neutral-500">
        {t('investPreviewDisclaimer')}
      </p>

      {/* CTA */}
      <Link
        href="/parent/investments"
        className="block text-xs font-semibold text-violet-600 dark:text-violet-300 hover:underline"
      >
        {t('investPreviewCta')} →
      </Link>
    </div>
  )
}
