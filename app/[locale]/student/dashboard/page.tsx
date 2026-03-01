'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useStudentData } from '@/hooks/useStudentData'
import { QuickGradeForm } from '@/components/quick-grade-form'
import { GradeTrendChart } from '@/components/charts'
import { formatDate } from '@/lib/utils/grade-helpers'
import { BonusIcon } from '@/components/ui'

type ChildSettlement = {
  id: string
  amount: number
  currency: string
  method: string
  notes: string | null
  createdAt: string
}

const METHOD_ICONS: Record<string, string> = {
  cash: '\u{1F4B5}',
  bank: '\u{1F3E6}',
  voucher: '\u{1F381}',
  savings: '\u{1F3E0}',
  invest: '\u{1F4C8}',
}

function currencySymbol(c: string) {
  switch (c) {
    case 'EUR':
      return '\u20ac'
    case 'USD':
      return '$'
    case 'GBP':
      return '\u00a3'
    case 'CHF':
      return 'CHF '
    default:
      return c + ' '
  }
}

export default function StudentDashboardPage() {
  const t = useTranslations('student')
  const tc = useTranslations('common')
  const { terms, loading, stats, profile, profileLoading } = useStudentData()

  const [settlements, setSettlements] = useState<ChildSettlement[]>([])
  const [settlementsLoaded, setSettlementsLoaded] = useState(false)

  useEffect(() => {
    async function loadSettlements() {
      try {
        const res = await fetch('/api/settlements/list')
        const data = await res.json()
        if (data.success) setSettlements(data.settlements || [])
      } catch {
        /* ignore */
      } finally {
        setSettlementsLoaded(true)
      }
    }
    loadSettlements()
  }, [])

  const rewardStats = useMemo(() => {
    if (settlements.length === 0) return null
    const totalEarned = settlements.reduce((s, r) => s + r.amount, 0)
    const currency = settlements[0]?.currency || 'EUR'
    return { totalEarned, count: settlements.length, currency }
  }, [settlements])

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
              <BonusIcon className="w-5 h-5 text-primary-500" />
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
                <p className="mt-2 text-lg font-bold text-primary-600 dark:text-primary-300 flex items-center gap-1">
                  <BonusIcon className="w-4 h-4 text-primary-500" />
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
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('myRewards')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-100 dark:border-primary-800 p-3">
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                {t('totalBonusPoints')}
              </p>
              <p className="text-xl font-bold text-primary-700 dark:text-primary-200 flex items-center gap-1">
                <BonusIcon className="w-4 h-4 text-primary-500" />
                {stats.total.toFixed(1)}
              </p>
            </div>
            {rewardStats && (
              <>
                <div className="rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 p-3">
                  <p className="text-xs text-success-600 dark:text-success-400 font-medium">
                    Ausgezahlt
                  </p>
                  <p className="text-xl font-bold text-success-700 dark:text-success-200">
                    {currencySymbol(rewardStats.currency)}
                    {rewardStats.totalEarned.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Auszahlungen
                  </p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-200">
                    {rewardStats.count}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Recent Settlements */}
          {settlementsLoaded && settlements.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                {t('recentSettlements')}
              </p>
              {settlements.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-100 dark:border-neutral-800 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-sm flex-shrink-0">
                    {METHOD_ICONS[s.method] || '\u{1F4B0}'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-success-600 dark:text-success-300">
                      +{currencySymbol(s.currency)}
                      {s.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {formatDate(s.createdAt)}
                      {s.notes ? ` \u2014 ${s.notes}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {settlementsLoaded && settlements.length === 0 && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Noch keine Auszahlungen erhalten. Gib dein Bestes!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
