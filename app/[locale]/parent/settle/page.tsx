'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { SettlementPackage } from '@/lib/db/queries/settlements'

type PeriodUnit = 'weekly' | 'monthly' | 'quarterly'
type PackageTypeFilter = 'all' | 'report_card' | 'grade_period'
type Settlement = {
  id: string
  childId: string
  childName: string | null
  amount: number
  currency: string
  method: string
  notes: string | null
  packageType: string | null
  packageLabel: string | null
  createdAt: string
}

type ConfirmState = {
  pkg: SettlementPackage
  method: string
  amount: string
  currency: string
  notes: string
}

const METHODS = [
  { key: 'cash', labelKey: 'payoutCash' },
  { key: 'bank', labelKey: 'payoutBank' },
  { key: 'voucher', labelKey: 'payoutVoucher' },
  { key: 'savings', labelKey: 'payoutSavings' },
  { key: 'invest', labelKey: 'payoutInvest' },
] as const

export default function SettlePage() {
  const t = useTranslations('parent')

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [packages, setPackages] = useState<SettlementPackage[]>([])
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>('monthly')
  const [history, setHistory] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [childFilter, setChildFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<PackageTypeFilter>('all')

  const [expandedPackage, setExpandedPackage] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [settling, setSettling] = useState(false)

  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [savingPeriod, setSavingPeriod] = useState(false)

  const loadPackages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/parent/settlement/packages')
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setPackages(data.packages)
      setPeriodUnit(data.periodUnit)
    } catch {
      setError('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/settlements/list')
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setHistory(data.settlements)
      setHistoryLoaded(true)
    } catch {
      setError('Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }, [historyLoaded])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  useEffect(() => {
    if (activeTab === 'history') loadHistory()
  }, [activeTab, loadHistory])

  const uniqueChildren = useMemo(() => {
    const seen = new Map<string, string>()
    packages.forEach((p) => seen.set(p.childId, p.childName))
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [packages])

  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      if (childFilter !== 'all' && p.childId !== childFilter) return false
      if (typeFilter !== 'all' && p.type !== typeFilter) return false
      return true
    })
  }, [packages, childFilter, typeFilter])

  const openConfirm = (pkg: SettlementPackage) => {
    setConfirm({
      pkg,
      method: 'cash',
      amount: String(pkg.totalPoints),
      currency: 'EUR',
      notes: '',
    })
  }

  const handleSettle = async () => {
    if (!confirm) return
    setSettling(true)
    setError('')
    try {
      const { pkg } = confirm
      const gradeIds =
        pkg.type === 'report_card'
          ? { subjectGradeIds: pkg.items.map((i) => i.id) }
          : { quickGradeIds: pkg.items.map((i) => i.id) }

      const res = await fetch('/api/settlements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: pkg.childId,
          amount: parseFloat(confirm.amount) || pkg.totalPoints,
          currency: confirm.currency,
          method: confirm.method,
          notes: confirm.notes || undefined,
          packageType: pkg.type,
          packageLabel: pkg.label,
          ...gradeIds,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setConfirm(null)
      setSuccessMsg(t('settlementCreated'))
      setHistoryLoaded(false)
      await loadPackages()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create settlement')
    } finally {
      setSettling(false)
    }
  }

  const savePeriodPreference = async (unit: PeriodUnit) => {
    setSavingPeriod(true)
    try {
      await fetch('/api/parent/settlement/preference', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodUnit: unit }),
      })
      setPeriodUnit(unit)
      setShowPeriodModal(false)
      setHistoryLoaded(false)
      await loadPackages()
    } finally {
      setSavingPeriod(false)
    }
  }

  const tierColor = (tier: string | null) => {
    if (tier === 'best') return 'text-success-600 dark:text-success-400'
    if (tier === 'second') return 'text-primary-600 dark:text-primary-400'
    if (tier === 'third') return 'text-amber-600 dark:text-amber-400'
    return 'text-neutral-500'
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            {t('settleTitle')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('settleDesc')}</p>
        </div>
        <button
          onClick={() => setShowPeriodModal(true)}
          title={t('periodPreference')}
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-400 transition-colors flex-shrink-0"
        >
          <svg
            className="w-5 h-5 text-neutral-600 dark:text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </button>
      </header>

      {/* Success / Error banners */}
      {successMsg && (
        <div className="rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 px-4 py-3 text-sm text-success-700 dark:text-success-300">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
        {(['pending', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tab === 'pending' ? t('pendingTab') : t('historyTab')}
          </button>
        ))}
      </div>

      {/* ── PENDING TAB ─────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Filters */}
          {!loading && packages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {/* Child filter */}
              {uniqueChildren.length > 1 && (
                <>
                  <button
                    onClick={() => setChildFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      childFilter === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {t('allChildren')}
                  </button>
                  {uniqueChildren.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setChildFilter(c.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        childFilter === c.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </>
              )}

              {/* Type filter */}
              {(['all', 'report_card', 'grade_period'] as const).map((f) => {
                const label =
                  f === 'all'
                    ? t('filterAllTypes')
                    : f === 'report_card'
                      ? t('filterReportCards')
                      : t('filterGradePeriods')
                return (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      typeFilter === f
                        ? 'bg-secondary-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} padding="md">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredPackages.length === 0 && (
            <Card padding="lg">
              <CardContent className="text-center py-6 space-y-2">
                <div className="text-4xl">🎉</div>
                <p className="text-neutral-600 dark:text-neutral-300 font-medium">
                  {t('noPackagesPending')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Package cards */}
          {!loading &&
            filteredPackages.map((pkg) => {
              const isExpanded = expandedPackage === pkg.id
              const isRc = pkg.type === 'report_card'
              return (
                <Card key={pkg.id} padding="sm" className="overflow-hidden !p-0">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={isRc ? 'info' : 'warning'}>
                            {isRc ? t('packageTypeReportCard') : t('packageTypeGradePeriod')}
                          </Badge>
                          {pkg.isOngoing && <Badge variant="success">{t('ongoingBadge')}</Badge>}
                        </div>
                        <p className="font-semibold text-neutral-900 dark:text-white text-base">
                          {pkg.childName} &mdash; {pkg.label}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>{t('gradeCount', { count: pkg.itemCount })}</span>
                          <span className="font-semibold text-primary-600 dark:text-primary-300">
                            {t('totalPts', { pts: pkg.totalPoints })}
                          </span>
                          {pkg.periodStart && (
                            <span>
                              {formatDate(pkg.periodStart)} – {formatDate(pkg.periodEnd!)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpandedPackage(isExpanded ? null : pkg.id)}
                          className="text-xs text-primary-600 dark:text-primary-300 hover:underline"
                        >
                          {isExpanded ? '▲ Hide' : '▼ Show'} grades
                        </button>
                        <button
                          onClick={() => openConfirm(pkg)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition whitespace-nowrap"
                        >
                          {t('settlePackage')}
                        </button>
                      </div>
                    </div>

                    {/* Expandable grade list */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2">
                        {pkg.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm rounded-lg bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <span className="font-medium text-neutral-900 dark:text-white">
                                {item.subjectName ?? '—'}
                              </span>
                              {item.gradeValue && (
                                <span
                                  className={`ml-2 font-semibold ${tierColor(item.gradeQualityTier)}`}
                                >
                                  {item.gradeValue}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-300 shrink-0">
                              +{item.bonusPoints} pts
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-end pt-1 text-sm font-bold text-neutral-900 dark:text-white">
                          {t('totalLabel')}: {t('totalPts', { pts: pkg.totalPoints })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {historyLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} padding="md">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <Card padding="lg">
              <CardContent className="text-center py-6">
                <p className="text-neutral-500 font-medium">{t('settleHistoryEmpty')}</p>
              </CardContent>
            </Card>
          )}

          {!historyLoading &&
            history.map((s) => (
              <Card key={s.id} padding="sm">
                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {s.childName ?? t('unknownChild')}
                        {s.packageLabel && (
                          <span className="ml-2 text-neutral-500 font-normal">
                            {s.packageLabel}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                        {s.packageType && (
                          <Badge variant="neutral" className="text-xs">
                            {s.packageType === 'report_card'
                              ? t('packageTypeReportCard')
                              : t('packageTypeGradePeriod')}
                          </Badge>
                        )}
                        <span className="capitalize">{s.method}</span>
                        <span>{formatDate(s.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary-600 dark:text-primary-300 text-sm">
                        {s.amount} {s.currency}
                      </p>
                      <Badge variant="success" className="text-xs">
                        {t('settled')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* ── CONFIRM DIALOG ─────────────────────────────────── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !settling && setConfirm(null)}
          />
          <div className="relative w-full sm:max-w-md mx-4 sm:mx-auto bg-white dark:bg-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {t('confirmSettlementTitle')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                {t('confirmSettlementBody', {
                  pts: confirm.pkg.totalPoints,
                  childName: confirm.pkg.childName,
                })}
              </p>
            </div>

            {/* Method selector */}
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                {t('payoutCash').split(' ')[0]}…
              </p>
              <div className="grid grid-cols-1 gap-2">
                {METHODS.map(({ key, labelKey }) => (
                  <button
                    key={key}
                    onClick={() => setConfirm((c) => c && { ...c, method: key })}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-medium transition-all ${
                      confirm.method === key
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-primary-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        confirm.method === key
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    />
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <textarea
                rows={2}
                value={confirm.notes}
                onChange={(e) => setConfirm((c) => c && { ...c, notes: e.target.value })}
                placeholder={t('notePlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-neutral-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={settling}
                className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSettle}
                disabled={settling}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {settling ? t('saving') : t('settlePackage')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERIOD PREFERENCE MODAL ────────────────────────── */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !savingPeriod && setShowPeriodModal(false)}
          />
          <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t('periodPreference')}
            </h2>
            <div className="space-y-2">
              {(['weekly', 'monthly', 'quarterly'] as const).map((unit) => {
                const label =
                  unit === 'weekly'
                    ? t('periodWeekly')
                    : unit === 'monthly'
                      ? t('periodMonthly')
                      : t('periodQuarterly')
                return (
                  <button
                    key={unit}
                    onClick={() => savePeriodPreference(unit)}
                    disabled={savingPeriod}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-medium transition-all ${
                      periodUnit === unit
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-primary-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        periodUnit === unit
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    />
                    {label}
                    {periodUnit === unit && savingPeriod && (
                      <svg
                        className="w-4 h-4 animate-spin ml-auto text-primary-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowPeriodModal(false)}
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
