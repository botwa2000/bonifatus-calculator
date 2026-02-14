'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParentData } from '@/hooks/useParentData'
import { formatDate } from '@/lib/utils/grade-helpers'

type Settlement = {
  id: string
  date: string
  childId: string
  childName: string
  amount: number
  method: string
  notes: string
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
const STORAGE_KEY_SETTLEMENTS = 'bonifatus_settlements'

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
  const { connections, gradeSummaries, gradesLoaded, loading } = useParentData()

  const [pointValue, setPointValue] = useState(1)
  const [customValue, setCustomValue] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [activeChildId, setActiveChildId] = useState<string | null>(null)
  const [activeMethod, setActiveMethod] = useState<string | null>(null)
  const [settleNote, setSettleNote] = useState('')
  const [splitMode, setSplitMode] = useState(false)
  const [split, setSplit] = useState<PayoutSplit>({
    cash: 100,
    bank: 0,
    voucher: 0,
    savings: 0,
    invest: 0,
  })

  // Load from localStorage
  useEffect(() => {
    try {
      const pv = localStorage.getItem(STORAGE_KEY_POINT_VALUE)
      if (pv) setPointValue(Number(pv))
      const cur = localStorage.getItem(STORAGE_KEY_CURRENCY)
      if (cur) setCurrency(cur)
      const st = localStorage.getItem(STORAGE_KEY_SETTLEMENTS)
      if (st) setSettlements(JSON.parse(st))
    } catch {
      /* ignore */
    }
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

  const settledByChild = useMemo(() => {
    const map: Record<string, number> = {}
    settlements.forEach((s) => {
      map[s.childId] = (map[s.childId] || 0) + s.amount
    })
    return map
  }, [settlements])

  const effectivePointValue = customValue ? Number(customValue) || pointValue : pointValue

  const handleSettle = useCallback(
    (childId: string, childName: string) => {
      const summary = gradeSummaries[childId]
      if (!summary) return
      const totalMoney = summary.totalBonus * effectivePointValue
      const settled = settledByChild[childId] || 0
      const unsettled = Math.max(0, totalMoney - settled)
      if (unsettled <= 0) return

      const newSettlement: Settlement = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        childId,
        childName,
        amount: unsettled,
        method: activeMethod || 'cash',
        notes: settleNote,
      }
      const updated = [newSettlement, ...settlements]
      setSettlements(updated)
      try {
        localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(updated))
      } catch {
        /* ignore */
      }
      setActiveChildId(null)
      setActiveMethod(null)
      setSettleNote('')
    },
    [gradeSummaries, effectivePointValue, settledByChild, settlements, activeMethod, settleNote]
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

      {/* Children Payout Overview */}
      {loading ? (
        <p className="text-neutral-500 text-sm">{tc('loading')}</p>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => {
            const summary = gradeSummaries[conn.child_id]
            const totalBonus = summary?.totalBonus || 0
            const totalMoney = totalBonus * effectivePointValue
            const settled = settledByChild[conn.child_id] || 0
            const unsettled = Math.max(0, totalMoney - settled)
            const pct = totalMoney > 0 ? (settled / totalMoney) * 100 : 0

            return (
              <div
                key={conn.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold">
                      {(conn.child?.full_name || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {conn.child?.full_name || t('child')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {totalBonus.toFixed(2)} {tc('pts')} &middot; {sym}
                        {totalMoney.toFixed(2)} {t('totalValue')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setActiveChildId(activeChildId === conn.child_id ? null : conn.child_id)
                    }
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition"
                  >
                    {t('settleNow')}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>
                      {t('settled')}: {sym}
                      {settled.toFixed(2)}
                    </span>
                    <span>
                      {t('unsettled')}: {sym}
                      {unsettled.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                {/* Payout Method Selector */}
                {activeChildId === conn.child_id && unsettled > 0 && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {t('settleNow')}: {sym}
                      {unsettled.toFixed(2)}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Cash */}
                      <button
                        onClick={() => setActiveMethod('cash')}
                        className={`rounded-xl border p-4 text-left transition ${
                          activeMethod === 'cash'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {t('payoutCash')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{t('payoutCashDesc')}</p>
                      </button>

                      {/* Bank */}
                      <button
                        onClick={() => setActiveMethod('bank')}
                        className={`rounded-xl border p-4 text-left transition ${
                          activeMethod === 'bank'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {t('payoutBank')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{t('payoutBankDesc')}</p>
                      </button>

                      {/* Gift Vouchers */}
                      <button
                        onClick={() => setActiveMethod('voucher')}
                        className={`rounded-xl border p-4 text-left transition ${
                          activeMethod === 'voucher'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {t('payoutVoucher')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{t('payoutVoucherDesc')}</p>
                      </button>

                      {/* Savings */}
                      <button
                        onClick={() => setActiveMethod('savings')}
                        className={`rounded-xl border p-4 text-left transition ${
                          activeMethod === 'savings'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {t('payoutSavings')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{t('payoutSavingsDesc')}</p>
                      </button>

                      {/* Investment */}
                      <button
                        onClick={() => setActiveMethod('invest')}
                        className={`rounded-xl border p-4 text-left transition ${
                          activeMethod === 'invest'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {t('payoutInvest')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{t('payoutInvestDesc')}</p>
                      </button>
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
                        onClick={() =>
                          handleSettle(conn.child_id, conn.child?.full_name || 'Child')
                        }
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-sm"
                      >
                        {t('confirmSettlement')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Settlement History */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('settlementHistory')}
        </h2>
        {settlements.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('noSettlements')}</p>
        ) : (
          <div className="space-y-2">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{s.childName}</p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(s.date)} &middot; {s.method}
                    {s.notes ? ` \u2014 ${s.notes}` : ''}
                  </p>
                </div>
                <p className="font-semibold text-primary-600 dark:text-primary-300">
                  {sym}
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
