'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useStudentData } from '@/hooks/useStudentData'
import { QuickGradeForm } from '@/components/quick-grade-form'
import { GradeTrendChart } from '@/components/charts'
import { formatDate } from '@/lib/utils/grade-helpers'

export default function StudentDashboardPage() {
  const t = useTranslations('student')
  const tc = useTranslations('common')
  const { terms, loading, stats, profile, profileLoading } = useStudentData()

  const recentTerms = terms
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-secondary-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {t('welcomeBack')}
              {!profileLoading && profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="mt-1 text-white/80 text-sm sm:text-base">
              {stats ? t('savedTermsCount', { count: stats.count }) : t('noRecentTerms')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/student/calculator"
              className="rounded-xl bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition text-center"
            >
              {t('newCalculation')}
            </Link>
            <Link
              href="/student/insights"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-white/90 transition text-center"
            >
              {t('viewInsights')}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-primary-500 text-lg">&#9733;</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('totalBonusPoints')}
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.total.toFixed(2)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('savedTermsCount', { count: stats.count })}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-secondary-500 text-lg">&#9679;</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('avgScoreNormalized')}
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.overallAvg.toFixed(1)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('weightedAcrossTerms')}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-success-500 text-lg">&#10003;</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('termsSaved', { count: '' })}
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.count}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('termsAnalyzed')}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-500 text-lg">&#9830;</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('bestTerm')}</p>
            </div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">
              {Number(stats.best.total_bonus_points ?? 0).toFixed(2)} {tc('pts')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {stats.best.school_year} &middot; {stats.best.term_type}
            </p>
          </div>
        </div>
      )}

      {/* Note Tracker */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('noteTrackerTitle')}
        </h2>
        <QuickGradeForm />
      </div>

      {/* Recent Terms */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('recentTerms')}
          </h2>
          {terms.length > 0 && (
            <Link
              href="/student/saved"
              className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
            >
              {t('viewAll')} &rarr;
            </Link>
          )}
        </div>
        {loading ? (
          <p className="text-sm text-neutral-500">{tc('loading')}</p>
        ) : recentTerms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('noRecentTerms')}</p>
            <Link
              href="/student/calculator"
              className="mt-2 inline-block text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
            >
              {t('newCalculation')} &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentTerms.map((term) => (
              <div
                key={term.id}
                className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4"
              >
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {term.school_year} &middot; {term.term_type}
                </p>
                <p className="text-xs text-neutral-500">{term.subject_grades.length} subjects</p>
                <p className="mt-2 text-lg font-bold text-primary-600 dark:text-primary-300">
                  {Number(term.total_bonus_points ?? 0).toFixed(2)} {tc('pts')}
                </p>
                <p className="text-xs text-neutral-400">{formatDate(term.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mini Trend Chart */}
      {stats && stats.trend.length >= 2 && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('bonusTrend')}
          </h2>
          <GradeTrendChart data={stats.trend} height={200} />
        </div>
      )}

      {/* My Rewards Card */}
      {stats && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            {t('myRewards')}
          </h2>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-300">
              {stats.total.toFixed(2)}
            </p>
            <p className="text-sm text-neutral-500">{t('totalEarned')}</p>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {t('recentSettlements')}
          </p>
        </div>
      )}
    </div>
  )
}
