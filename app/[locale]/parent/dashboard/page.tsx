'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useParentData } from '@/hooks/useParentData'
import { formatDate } from '@/lib/utils/grade-helpers'
import { GradeTrendChart } from '@/components/charts'
import { StockTickerWidget } from '@/components/widgets/StockTickerWidget'
import { BonusIcon } from '@/components/ui'

export default function ParentDashboardPage() {
  const t = useTranslations('parent')
  const tc = useTranslations('common')
  const {
    connections,
    loading,
    error,
    gradeSummaries,
    gradesLoaded,
    hasConnections,
    recentActivity,
    combinedBonus,
    handleCreateInvite,
  } = useParentData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-secondary-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{t('welcomeBack')}</h1>
            <p className="mt-1 text-white/80 text-sm sm:text-base">
              {t('childrenConnected', { count: connections.length })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/parent/rewards"
              className="rounded-xl bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition text-center"
            >
              {t('settleNow')}
            </Link>
            <Link
              href="/parent/insights"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-white/90 transition text-center"
            >
              {t('viewDetails')}
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 text-error-700 px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Children Summary Cards */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('connectedChildren')}
            </h2>
            {loading ? (
              <p className="text-sm text-neutral-500">{tc('loading')}</p>
            ) : !hasConnections ? (
              <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-6 text-center space-y-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('noChildren')}</p>
                <button
                  onClick={() => handleCreateInvite()}
                  className="inline-flex justify-center rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-sm font-semibold text-white shadow-button"
                >
                  {t('generateInvite')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn) => {
                  const summary = gradeSummaries[conn.childId]
                  const trendData = summary ? [{ label: 'Total', value: summary.totalBonus }] : []

                  return (
                    <div
                      key={conn.id}
                      className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-200 text-sm font-bold">
                              {(conn.child?.fullName || 'C')[0].toUpperCase()}
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                              {conn.child?.fullName || t('child')}
                            </p>
                            {conn.child?.schoolName && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {conn.child.schoolName}
                              </span>
                            )}
                            <span className="text-xs rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 px-2 py-0.5">
                              {tc('active')}
                            </span>
                          </div>
                          {gradesLoaded && summary && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 px-2 py-1">
                                {t('savedResultsCount', { count: summary.savedTerms })}
                              </span>
                              <span className="rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-1 inline-flex items-center gap-1">
                                <BonusIcon className="w-3.5 h-3.5" />
                                {t('bonusLabel', { value: summary.totalBonus.toFixed(2) })}
                              </span>
                              {summary.lastUpdated && (
                                <span className="rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 px-2 py-1">
                                  {t('updated', { date: formatDate(summary.lastUpdated) })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Link
                          href="/parent/rewards"
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition text-center"
                        >
                          {t('settleNow')}
                        </Link>
                      </div>
                      {trendData.length >= 2 && (
                        <div className="mt-3">
                          <GradeTrendChart data={trendData} height={80} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCreateInvite()}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-white hover:border-primary-400 shadow-sm"
            >
              {t('inviteChild')}
            </button>
            <Link
              href="/parent/insights"
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-white hover:border-primary-400 shadow-sm"
            >
              {t('insightsTitle')}
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('recentActivity')}
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-neutral-500">{t('noRecentActivity')}</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((item) => (
                  <div
                    key={item.term.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {item.childName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.term.school_year} &middot; {item.term.term_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600 dark:text-primary-300">
                        {Number(item.term.total_bonus_points ?? 0).toFixed(2)} {tc('pts')}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDate(item.term.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('overviewStats')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{t('totalChildren')}</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {connections.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{t('combinedBonus')}</span>
                <span className="font-semibold text-primary-600 dark:text-primary-300">
                  {combinedBonus.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Stock Ticker */}
          <StockTickerWidget />
        </div>
      </div>
    </div>
  )
}
