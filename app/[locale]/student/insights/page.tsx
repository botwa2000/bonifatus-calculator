'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useStudentData } from '@/hooks/useStudentData'
import {
  GradeTrendChart,
  SubjectPerformanceChart,
  TermComparisonChart,
  GradeDistributionChart,
} from '@/components/charts'

export default function StudentInsightsPage() {
  const t = useTranslations('student')
  const tc = useTranslations('common')
  const { loading, stats, subjectAggregates, tierDistribution, termComparison } = useStudentData()

  const yearOverYearChange = useMemo(() => {
    if (!stats || stats.trend.length < 2) return null
    const recent = stats.trend[stats.trend.length - 1].value
    const previous = stats.trend[stats.trend.length - 2].value
    if (previous === 0) return null
    const pct = ((recent - previous) / previous) * 100
    return pct
  }, [stats])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-neutral-500">{tc('loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('insightsTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('insightsDesc')}</p>
      </header>

      {!stats ? (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
          <p className="text-neutral-500">{t('addResultsForTrends')}</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border-l-4 border-l-primary-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('totalBonusPoints')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.total.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border-l-4 border-l-secondary-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('avgScoreNormalized')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.overallAvg.toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl border-l-4 border-l-amber-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('bestTerm')}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {Number(stats.best.total_bonus_points ?? 0).toFixed(2)} {tc('pts')}
              </p>
              <p className="text-xs text-neutral-500">{stats.best.school_year}</p>
            </div>
            <div className="rounded-2xl border-l-4 border-l-success-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('termsAnalyzed')}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.count}</p>
            </div>
          </div>

          {/* Bonus Trend */}
          {stats.trend.length >= 2 && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                {t('bonusTrend')}
              </h2>
              <GradeTrendChart data={stats.trend} height={300} />
            </div>
          )}

          {/* Subject Performance */}
          {subjectAggregates.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                {t('subjectPerformance')}
              </h2>
              <SubjectPerformanceChart
                data={subjectAggregates}
                height={Math.max(200, subjectAggregates.length * 40)}
              />
            </div>
          )}

          {/* Term Comparison */}
          {termComparison.length > 1 && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                {t('termComparison')}
              </h2>
              <TermComparisonChart data={termComparison} height={300} />
            </div>
          )}

          {/* Distribution + Year-over-Year */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tierDistribution.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  {t('gradeDistribution')}
                </h2>
                <GradeDistributionChart data={tierDistribution} />
              </div>
            )}

            {yearOverYearChange !== null && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  {t('yearOverYear')}
                </h2>
                <p
                  className={`text-4xl font-bold ${
                    yearOverYearChange >= 0 ? 'text-success-600' : 'text-error-600'
                  }`}
                >
                  {yearOverYearChange >= 0 ? '\u2191' : '\u2193'}{' '}
                  {Math.abs(yearOverYearChange).toFixed(1)}%
                </p>
                <p className="text-sm text-neutral-500 mt-2">{t('changeFromLastYear')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
