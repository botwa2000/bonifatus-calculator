'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParentData, type ChildQuickGradeGroup } from '@/hooks/useParentData'
import { resolveLocalized } from '@/lib/i18n'
import { formatDate } from '@/lib/utils/grade-helpers'

type Settlement = {
  id: string
  childId: string
  childName: string | null
  amount: number
  currency: string
  method: string
  notes: string | null
  createdAt: string
}

type PayoutSplit = {
  cash: number
  bank: number
  voucher: number
  savings: number
  invest: number
}

const POINT_VALUE_OPTIONS = [1, 2, 5, 10]
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']
const STORAGE_KEY_POINT_VALUE = 'bonifatus_point_value'
const STORAGE_KEY_CURRENCY = 'bonifatus_currency'

const VOUCHER_PROVIDERS = [
  { name: 'Amazon', url: 'https://www.amazon.com/gift-cards' },
  { name: 'Apple / iTunes', url: 'https://www.apple.com/shop/gift-cards' },
  { name: 'Google Play', url: 'https://play.google.com/store/games?hl=en&gl=US' },
  { name: 'PlayStation', url: 'https://store.playstation.com' },
  { name: 'Xbox', url: 'https://www.xbox.com/en-US/gifts/gift-cards' },
  { name: 'Nintendo eShop', url: 'https://www.nintendo.com/store/' },
  { name: 'Steam', url: 'https://store.steampowered.com/digitalgiftcards/' },
  { name: 'Spotify', url: 'https://www.spotify.com/gift-card/' },
  { name: 'Netflix', url: 'https://www.netflix.com/gift-cards' },
  { name: 'Zalando', url: 'https://www.zalando.com/gift-card/' },
  { name: 'IKEA', url: 'https://www.ikea.com/us/en/customer-service/gift-cards/' },
  { name: 'Decathlon', url: 'https://www.decathlon.com/collections/gift-cards' },
]

const SAVINGS_PROVIDERS = [
  { name: 'ING', region: 'EU', url: 'https://www.ing.com' },
  { name: 'DKB', region: 'EU', url: 'https://www.dkb.de' },
  { name: 'Commerzbank Junior', region: 'EU', url: 'https://www.commerzbank.de' },
  { name: 'Greenlight', region: 'US', url: 'https://www.greenlight.com' },
  { name: 'GoHenry', region: 'US', url: 'https://www.gohenry.com' },
  { name: 'Capital One Kids', region: 'US', url: 'https://www.capitalone.com' },
  { name: 'NatWest', region: 'UK', url: 'https://www.natwest.com' },
  { name: 'Barclays', region: 'UK', url: 'https://www.barclays.co.uk' },
]

const INVEST_PROVIDERS = [
  { name: 'Trade Republic', url: 'https://traderepublic.com' },
  { name: 'Scalable Capital', url: 'https://www.scalable.capital' },
  { name: 'Flatex', url: 'https://www.flatex.de' },
  { name: 'Interactive Brokers', url: 'https://www.interactivebrokers.com' },
  { name: 'Fidelity Youth', url: 'https://www.fidelity.com/go/youth-account/overview' },
  { name: 'Schwab', url: 'https://www.schwab.com' },
  { name: 'Acorns Early', url: 'https://www.acorns.com/early/' },
]

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

export default function ParentRewardsPage() {
  const t = useTranslations('parent')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { connections, childQuickGrades, loading, loadConnections } = useParentData()

  const [pointValue, setPointValue] = useState(1)
  const [customValue, setCustomValue] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [settlementsLoaded, setSettlementsLoaded] = useState(false)
  const [activeChildId, setActiveChildId] = useState<string | null>(null)
  const [activeMethod, setActiveMethod] = useState<string | null>(null)
  const [settleNote, setSettleNote] = useState('')
  const [selectedGradeIds, setSelectedGradeIds] = useState<Set<string>>(new Set())
  const [settling, setSettling] = useState(false)
  const [settleMessage, setSettleMessage] = useState<string | null>(null)
  const [splitMode, setSplitMode] = useState(false)
  const [split, setSplit] = useState<PayoutSplit>({
    cash: 100,
    bank: 0,
    voucher: 0,
    savings: 0,
    invest: 0,
  })

  // Load point value and currency from localStorage (lightweight preferences)
  useEffect(() => {
    try {
      const pv = localStorage.getItem(STORAGE_KEY_POINT_VALUE)
      if (pv) setPointValue(Number(pv))
      const cur = localStorage.getItem(STORAGE_KEY_CURRENCY)
      if (cur) setCurrency(cur)
    } catch {
      /* ignore */
    }
  }, [])

  // Load settlements from DB
  useEffect(() => {
    async function loadSettlements() {
      try {
        const res = await fetch('/api/settlements/list')
        const data = await res.json()
        if (data.success) {
          setSettlements(data.settlements || [])
        }
      } catch {
        /* ignore */
      } finally {
        setSettlementsLoaded(true)
      }
    }
    loadSettlements()
  }, [])

  const savePointValue = useCallback((val: number) => {
    setPointValue(val)
    try {
      localStorage.setItem(STORAGE_KEY_POINT_VALUE, String(val))
    } catch {
      /* ignore */
    }
  }, [])

  const saveCurrency = useCallback((val: string) => {
    setCurrency(val)
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, val)
    } catch {
      /* ignore */
    }
  }, [])

  const effectivePointValue = customValue ? Number(customValue) || pointValue : pointValue

  // Get unsettled grades for a child
  const getChildUnsettled = useCallback(
    (childId: string) => {
      const group = childQuickGrades.find((g: ChildQuickGradeGroup) => g.childId === childId)
      if (!group) return []
      return group.grades.filter((g) => g.settlementStatus === 'unsettled')
    },
    [childQuickGrades]
  )

  const toggleGradeSelection = useCallback((id: string) => {
    setSelectedGradeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAllForChild = useCallback(
    (childId: string) => {
      const unsettled = getChildUnsettled(childId)
      setSelectedGradeIds(new Set(unsettled.map((g) => g.id)))
    },
    [getChildUnsettled]
  )

  const handleSettle = useCallback(
    async (childId: string) => {
      if (selectedGradeIds.size === 0) return
      setSettling(true)
      setSettleMessage(null)

      const unsettled = getChildUnsettled(childId)
      const selectedGrades = unsettled.filter((g) => selectedGradeIds.has(g.id))
      const totalBonus = selectedGrades.reduce((sum, g) => sum + Number(g.bonusPoints ?? 0), 0)
      const amount = totalBonus * effectivePointValue

      try {
        const res = await fetch('/api/settlements/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId,
            amount,
            currency,
            method: activeMethod || 'cash',
            notes: settleNote || undefined,
            splitConfig: splitMode ? split : undefined,
            quickGradeIds: [...selectedGradeIds],
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSettleMessage(t('settlementCreated'))
          setActiveChildId(null)
          setActiveMethod(null)
          setSettleNote('')
          setSelectedGradeIds(new Set())
          // Reload data
          loadConnections()
          const settleRes = await fetch('/api/settlements/list')
          const settleData = await settleRes.json()
          if (settleData.success) setSettlements(settleData.settlements || [])
        } else {
          setSettleMessage(data.error || 'Settlement failed')
        }
      } catch {
        setSettleMessage('Settlement failed')
      } finally {
        setSettling(false)
      }
    },
    [
      selectedGradeIds,
      getChildUnsettled,
      effectivePointValue,
      currency,
      activeMethod,
      settleNote,
      splitMode,
      split,
      t,
      loadConnections,
    ]
  )

  const sym = currencySymbol(currency)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('rewardsTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('rewardsDesc')}</p>
      </header>

      {settleMessage && (
        <div className="rounded-xl border border-success-200 bg-success-50 text-success-700 px-4 py-3 text-sm">
          {settleMessage}
        </div>
      )}

      {/* Point Value Configuration */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('pointValue')}
        </h2>
        <p className="text-sm text-neutral-500">{t('pointValueDesc')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {POINT_VALUE_OPTIONS.map((val) => (
              <button
                key={val}
                onClick={() => {
                  savePointValue(val)
                  setCustomValue('')
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  pointValue === val && !customValue
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200 dark:border-primary-400'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                }`}
              >
                {sym}
                {val}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Custom"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-24 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          />
          <select
            value={currency}
            onChange={(e) => saveCurrency(e.target.value)}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Children with Unsettled Notes */}
      {loading ? (
        <p className="text-neutral-500 text-sm">{tc('loading')}</p>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => {
            const unsettled = getChildUnsettled(conn.childId)
            const unsettledBonus = unsettled.reduce((sum, g) => sum + Number(g.bonusPoints ?? 0), 0)
            const unsettledMoney = unsettledBonus * effectivePointValue

            return (
              <div
                key={conn.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold">
                      {(conn.child?.fullName || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {conn.child?.fullName || t('child')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {unsettled.length} {t('childNotes')} &middot; {sym}
                        {unsettledMoney.toFixed(2)} {t('unsettled')}
                      </p>
                    </div>
                  </div>
                  {unsettled.length > 0 && (
                    <button
                      onClick={() =>
                        setActiveChildId(activeChildId === conn.childId ? null : conn.childId)
                      }
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition"
                    >
                      {t('settleNow')}
                    </button>
                  )}
                </div>

                {/* Unsettled Notes Table */}
                {activeChildId === conn.childId && unsettled.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {t('notesForChild', { name: conn.child?.fullName || t('child') })}
                      </p>
                      <button
                        onClick={() => selectAllForChild(conn.childId)}
                        className="text-xs font-semibold text-primary-600 dark:text-primary-300 hover:underline"
                      >
                        {t('settleAll')}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-500">
                            <th className="py-1 px-2 text-left w-8"></th>
                            <th className="py-1 px-2 text-left">{tc('date')}</th>
                            <th className="py-1 px-2 text-left">{t('subjectLabel')}</th>
                            <th className="py-1 px-2 text-center">{t('gradeLabel')}</th>
                            <th className="py-1 px-2 text-right">
                              {t('bonusLabel', { value: '' })}
                            </th>
                            <th className="py-1 px-2 text-left">{t('noteLabel')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unsettled.map((g) => (
                            <tr
                              key={g.id}
                              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                            >
                              <td className="py-1.5 px-2">
                                <input
                                  type="checkbox"
                                  checked={selectedGradeIds.has(g.id)}
                                  onChange={() => toggleGradeSelection(g.id)}
                                  className="accent-primary-600"
                                />
                              </td>
                              <td className="py-1.5 px-2 text-neutral-600 dark:text-neutral-400">
                                {formatDate(g.gradedAt || g.createdAt || '')}
                              </td>
                              <td className="py-1.5 px-2 font-semibold text-neutral-900 dark:text-white">
                                {resolveLocalized(g.subjectName, locale)}
                              </td>
                              <td className="py-1.5 px-2 text-center text-neutral-900 dark:text-white">
                                {g.gradeValue}
                              </td>
                              <td className="py-1.5 px-2 text-right text-primary-600 dark:text-primary-300 font-semibold">
                                {Number(g.bonusPoints ?? 0) >= 0 ? '+' : ''}
                                {Number(g.bonusPoints ?? 0).toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2 text-neutral-500 max-w-[120px] truncate">
                                {g.note || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedGradeIds.size > 0 && (
                      <p className="text-sm text-neutral-700 dark:text-neutral-200">
                        {t('settleSelected')}: {selectedGradeIds.size} notes &middot;{' '}
                        <span className="font-semibold text-primary-600 dark:text-primary-300">
                          {sym}
                          {(
                            unsettled
                              .filter((g) => selectedGradeIds.has(g.id))
                              .reduce((s, g) => s + Number(g.bonusPoints ?? 0), 0) *
                            effectivePointValue
                          ).toFixed(2)}
                        </span>
                      </p>
                    )}

                    {/* Payout Methods */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(['cash', 'bank', 'voucher', 'savings', 'invest'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setActiveMethod(method)}
                          className={`rounded-xl border p-4 text-left transition ${
                            activeMethod === method
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {t(
                              `payout${method.charAt(0).toUpperCase() + method.slice(1)}` as Parameters<
                                typeof t
                              >[0]
                            )}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {t(
                              `payout${method.charAt(0).toUpperCase() + method.slice(1)}Desc` as Parameters<
                                typeof t
                              >[0]
                            )}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Method Details */}
                    {activeMethod === 'voucher' && (
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 p-4">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                          {t('payoutVoucher')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {VOUCHER_PROVIDERS.map((p) => (
                            <a
                              key={p.name}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-white hover:border-primary-400 transition text-center"
                            >
                              {p.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeMethod === 'savings' && (
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 p-4 space-y-2">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {t('payoutSavings')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {SAVINGS_PROVIDERS.map((p) => (
                            <a
                              key={p.name}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-center"
                            >
                              <span className="font-semibold text-neutral-800 dark:text-white">
                                {p.name}
                              </span>
                              <span className="block text-neutral-400 text-[10px]">{p.region}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeMethod === 'invest' && (
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 p-4 space-y-3">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {t('payoutInvest')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {INVEST_PROVIDERS.map((p) => (
                            <a
                              key={p.name}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-white hover:border-primary-400 transition text-center"
                            >
                              {p.name}
                            </a>
                          ))}
                        </div>
                        <p className="text-xs text-neutral-500">
                          Popular ETFs: MSCI World, S&P 500, STOXX Europe 600
                        </p>
                        <p className="text-xs text-neutral-400 italic">{t('payoutInvestDesc')}</p>
                      </div>
                    )}

                    {/* Split Payout */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                        <input
                          type="checkbox"
                          checked={splitMode}
                          onChange={(e) => setSplitMode(e.target.checked)}
                          className="accent-primary-600"
                        />
                        {t('splitPayout')}
                      </label>
                      {splitMode && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          {(Object.keys(split) as Array<keyof PayoutSplit>).map((key) => (
                            <div key={key}>
                              <label className="text-xs text-neutral-500 capitalize">{key}</label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={split[key]}
                                onChange={(e) =>
                                  setSplit((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                                }
                                className="w-full accent-primary-600"
                              />
                              <span className="text-xs text-neutral-700 dark:text-neutral-300">
                                {split[key]}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes + Confirm */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                      <input
                        type="text"
                        placeholder="Optional note..."
                        value={settleNote}
                        onChange={(e) => setSettleNote(e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSettle(conn.childId)}
                        disabled={settling || selectedGradeIds.size === 0}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-sm disabled:opacity-60"
                      >
                        {settling ? tc('saving') : t('confirmSettlement')}
                      </button>
                    </div>
                  </div>
                )}

                {unsettled.length === 0 && (
                  <p className="text-sm text-neutral-500">{t('noUnsettledNotes')}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Settlement History from DB */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('settlementHistory')}
        </h2>
        {!settlementsLoaded ? (
          <p className="text-sm text-neutral-500">{tc('loading')}</p>
        ) : settlements.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('noSettlements')}</p>
        ) : (
          <div className="space-y-2">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {s.childName || t('child')}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(s.createdAt)} &middot; {s.method}
                    {s.notes ? ` \u2014 ${s.notes}` : ''}
                  </p>
                </div>
                <p className="font-semibold text-primary-600 dark:text-primary-300">
                  {currencySymbol(s.currency)}
                  {s.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Literacy Corner */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('financialTips')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('compoundInterest')}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Investing {sym}10/month at 7% annual return grows to ~{sym}4,800 over 18 years. The
              earlier you start, the more time compound returns have to work.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('startEarly')}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Starting with {sym}10/month at birth vs. age 10 can mean a 2-3x difference in the
              final amount by age 18, thanks to compound growth.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('teachingKids')}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Give children hands-on money experience early. Let them see savings grow, discuss
              spending choices, and understand earning through effort.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t('whyEtfs')}</p>
            <p className="text-xs text-neutral-500 mt-1">
              ETFs (Exchange-Traded Funds) provide instant diversification across hundreds of
              companies, reducing risk while capturing broad market growth.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
