'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParentData } from '@/hooks/useParentData'
import { resolveLocalized } from '@/lib/i18n'
import { formatDate } from '@/lib/utils/grade-helpers'
import { BonusIcon } from '@/components/ui'

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

type UnsettledGrade = {
  id: string
  source: 'quick' | 'term'
  subjectId: string | null
  subjectName: string | Record<string, string> | null
  gradeValue: string | null
  bonusPoints: number | null
  note: string | null
  gradedAt: string | null
  createdAt: string | null
  settlementStatus: string
  context: string | null
}

type ChildUnsettled = {
  childId: string
  childName: string
  grades: UnsettledGrade[]
}

const POINT_VALUE_OPTIONS = [1, 2, 5, 10]
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']
const STORAGE_KEY_POINT_VALUE = 'bonifatus_point_value'
const STORAGE_KEY_CURRENCY = 'bonifatus_currency'

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

function methodLabel(method: string) {
  switch (method) {
    case 'cash':
      return 'Bargeld'
    case 'bank':
      return 'Banküberweisung'
    case 'voucher':
      return 'Gutschein'
    case 'savings':
      return 'Sparkonto'
    case 'invest':
      return 'Investment'
    default:
      return method
  }
}

export default function ParentRewardsPage() {
  const t = useTranslations('parent')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { connections, loading: parentLoading } = useParentData()

  const [pointValue, setPointValue] = useState(1)
  const [customValue, setCustomValue] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [settlementsLoaded, setSettlementsLoaded] = useState(false)
  const [unsettledChildren, setUnsettledChildren] = useState<ChildUnsettled[]>([])
  const [unsettledLoading, setUnsettledLoading] = useState(true)
  const [activeChildId, setActiveChildId] = useState<string | null>(null)
  const [activeMethod, setActiveMethod] = useState<string | null>(null)
  const [settleNote, setSettleNote] = useState('')
  const [selectedGradeIds, setSelectedGradeIds] = useState<Set<string>>(new Set())
  const [settling, setSettling] = useState(false)
  const [settleMessage, setSettleMessage] = useState<string | null>(null)
  const [settleError, setSettleError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmChildId, setConfirmChildId] = useState<string | null>(null)

  // Load point value and currency from localStorage
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

  // Load unsettled grades (both quick grades and term subject grades)
  const loadUnsettled = useCallback(async () => {
    setUnsettledLoading(true)
    try {
      const res = await fetch('/api/parent/children/unsettled-grades')
      const data = await res.json()
      if (data.success) {
        setUnsettledChildren(data.children || [])
      }
    } catch {
      /* ignore */
    } finally {
      setUnsettledLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUnsettled()
  }, [loadUnsettled])

  // Load settlements
  const loadSettlements = useCallback(async () => {
    try {
      const res = await fetch('/api/settlements/list')
      const data = await res.json()
      if (data.success) setSettlements(data.settlements || [])
    } catch {
      /* ignore */
    } finally {
      setSettlementsLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadSettlements()
  }, [loadSettlements])

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
  const sym = currencySymbol(currency)

  const getChildUnsettled = useCallback(
    (childId: string) => {
      return unsettledChildren.find((c) => c.childId === childId)?.grades || []
    },
    [unsettledChildren]
  )

  const toggleGradeSelection = useCallback((id: string) => {
    setSelectedGradeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  // Compute settlement amount from selected grades
  const getSelectedAmount = useCallback(
    (childId: string) => {
      const unsettled = getChildUnsettled(childId)
      const selected = unsettled.filter((g) => selectedGradeIds.has(g.id))
      const totalBonus = selected.reduce((sum, g) => sum + Number(g.bonusPoints ?? 0), 0)
      return totalBonus * effectivePointValue
    },
    [getChildUnsettled, selectedGradeIds, effectivePointValue]
  )

  const handleSettleConfirm = useCallback(
    async (childId: string) => {
      if (selectedGradeIds.size === 0 || activeMethod !== 'cash') return
      setSettling(true)
      setSettleMessage(null)
      setSettleError(null)

      const unsettled = getChildUnsettled(childId)
      const selected = unsettled.filter((g) => selectedGradeIds.has(g.id))
      const totalBonus = selected.reduce((sum, g) => sum + Number(g.bonusPoints ?? 0), 0)
      const amount = totalBonus * effectivePointValue

      // Separate by source
      const quickGradeIds = selected.filter((g) => g.source === 'quick').map((g) => g.id)
      const subjectGradeIds = selected.filter((g) => g.source === 'term').map((g) => g.id)

      try {
        const res = await fetch('/api/settlements/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId,
            amount,
            currency,
            method: 'cash',
            notes: settleNote || undefined,
            quickGradeIds: quickGradeIds.length > 0 ? quickGradeIds : undefined,
            subjectGradeIds: subjectGradeIds.length > 0 ? subjectGradeIds : undefined,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSettleMessage(t('settlementCreated'))
          setActiveChildId(null)
          setActiveMethod(null)
          setSettleNote('')
          setSelectedGradeIds(new Set())
          setConfirmOpen(false)
          setConfirmChildId(null)
          // Reload data
          loadUnsettled()
          loadSettlements()
        } else {
          setSettleError(data.error || 'Settlement failed')
        }
      } catch {
        setSettleError('Settlement failed')
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
      t,
      loadUnsettled,
      loadSettlements,
    ]
  )

  // Settlement stats
  const settlementStats = useMemo(() => {
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0)
    const methodCounts: Record<string, number> = {}
    settlements.forEach((s) => {
      methodCounts[s.method] = (methodCounts[s.method] || 0) + 1
    })
    const childCounts: Record<string, { name: string; amount: number; count: number }> = {}
    settlements.forEach((s) => {
      if (!childCounts[s.childId]) {
        childCounts[s.childId] = { name: s.childName || 'Child', amount: 0, count: 0 }
      }
      childCounts[s.childId].amount += s.amount
      childCounts[s.childId].count += 1
    })
    return { totalSettled, methodCounts, childCounts, total: settlements.length }
  }, [settlements])

  // Build merged child list from connections + unsettled data
  const childList = useMemo(() => {
    const unsettledMap = new Map(unsettledChildren.map((c) => [c.childId, c]))
    return connections.map((conn) => ({
      id: conn.id,
      childId: conn.childId,
      childName: conn.child?.fullName || t('child'),
      unsettled: unsettledMap.get(conn.childId)?.grades || [],
    }))
  }, [connections, unsettledChildren, t])

  const loading = parentLoading || unsettledLoading

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('rewardsTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('rewardsDesc')}</p>
      </header>

      {settleMessage && (
        <div className="rounded-xl border border-success-200 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300 dark:border-success-800 px-4 py-3 text-sm flex items-center gap-2">
          <span className="text-lg">{'\u2705'}</span> {settleMessage}
        </div>
      )}
      {settleError && (
        <div className="rounded-xl border border-error-200 bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-300 dark:border-error-800 px-4 py-3 text-sm">
          {settleError}
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

      {/* Children with Unsettled Grades */}
      {loading ? (
        <p className="text-neutral-500 text-sm">{tc('loading')}</p>
      ) : (
        <div className="space-y-4">
          {childList.map((child) => {
            const unsettled = child.unsettled
            const unsettledBonus = unsettled.reduce((sum, g) => sum + Number(g.bonusPoints ?? 0), 0)
            const unsettledMoney = unsettledBonus * effectivePointValue

            return (
              <div
                key={child.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {child.childName[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {child.childName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {unsettled.length > 0 ? (
                          <>
                            <span className="inline-flex items-center gap-0.5">
                              <BonusIcon className="w-3 h-3 text-primary-500" />
                              {unsettledBonus.toFixed(1)} {tc('pts')}
                            </span>
                            {' \u2022 '}
                            <span className="font-semibold text-primary-600 dark:text-primary-300">
                              {sym}
                              {unsettledMoney.toFixed(2)}
                            </span>{' '}
                            {t('unsettled')}
                          </>
                        ) : (
                          t('noUnsettledNotes')
                        )}
                      </p>
                    </div>
                  </div>
                  {unsettled.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveChildId(activeChildId === child.childId ? null : child.childId)
                        setSelectedGradeIds(new Set())
                        setActiveMethod(null)
                        setConfirmOpen(false)
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition"
                    >
                      {activeChildId === child.childId ? t('close') : t('settleNow')}
                    </button>
                  )}
                </div>

                {/* Expanded Settlement Panel */}
                {activeChildId === child.childId && unsettled.length > 0 && (
                  <div className="space-y-5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Grade Selection */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {t('notesForChild', { name: child.childName })}
                      </p>
                      <button
                        onClick={() => selectAllForChild(child.childId)}
                        className="text-xs font-semibold text-primary-600 dark:text-primary-300 hover:underline"
                      >
                        {t('settleAll')}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500">
                            <th className="py-2 px-3 text-left w-8"></th>
                            <th className="py-2 px-3 text-left">{tc('date')}</th>
                            <th className="py-2 px-3 text-left">{t('subjectLabel')}</th>
                            <th className="py-2 px-3 text-center">{t('gradeLabel')}</th>
                            <th className="py-2 px-3 text-right">
                              <span className="inline-flex items-center gap-0.5">
                                <BonusIcon className="w-3 h-3" />
                                Bonus
                              </span>
                            </th>
                            <th className="py-2 px-3 text-right">{sym}</th>
                            <th className="py-2 px-3 text-left">Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unsettled.map((g) => {
                            const bonus = Number(g.bonusPoints ?? 0)
                            const money = bonus * effectivePointValue
                            return (
                              <tr
                                key={g.id}
                                className={`border-b border-neutral-100 dark:border-neutral-800 transition ${
                                  selectedGradeIds.has(g.id)
                                    ? 'bg-primary-50/50 dark:bg-primary-900/10'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                                }`}
                              >
                                <td className="py-2 px-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedGradeIds.has(g.id)}
                                    onChange={() => toggleGradeSelection(g.id)}
                                    className="accent-primary-600 w-4 h-4"
                                  />
                                </td>
                                <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
                                  {formatDate(g.gradedAt || g.createdAt || '')}
                                </td>
                                <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">
                                  {resolveLocalized(g.subjectName, locale)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className="inline-block rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-semibold text-neutral-900 dark:text-white">
                                    {g.gradeValue}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-semibold">
                                  <span
                                    className={
                                      bonus >= 0
                                        ? 'text-primary-600 dark:text-primary-300'
                                        : 'text-error-600 dark:text-error-400'
                                    }
                                  >
                                    {bonus >= 0 ? '+' : ''}
                                    {bonus.toFixed(1)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-semibold text-neutral-700 dark:text-neutral-200">
                                  {sym}
                                  {money.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-neutral-400 max-w-[120px] truncate">
                                  {g.context || g.note || '\u2014'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Selection Summary */}
                    {selectedGradeIds.size > 0 && (
                      <div className="rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-200 dark:border-primary-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {selectedGradeIds.size} Noten ausgew\u00e4hlt
                          </p>
                          <p className="text-2xl font-bold text-primary-600 dark:text-primary-300 flex items-center gap-1">
                            <BonusIcon className="w-5 h-5 text-primary-500" />
                            {sym}
                            {getSelectedAmount(child.childId).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500">
                          W\u00e4hle eine Auszahlungsmethode unten
                        </p>
                      </div>
                    )}

                    {/* Payout Methods */}
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                        Auszahlungsmethode
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {(
                          [
                            { key: 'cash', available: true },
                            { key: 'bank', available: false },
                            { key: 'voucher', available: false },
                            { key: 'savings', available: false },
                            { key: 'invest', available: false },
                          ] as const
                        ).map(({ key, available }) => (
                          <button
                            key={key}
                            onClick={() => available && setActiveMethod(key)}
                            disabled={!available}
                            className={`rounded-xl border p-4 text-left transition relative overflow-hidden ${
                              activeMethod === key
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
                                : available
                                  ? 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 hover:shadow-sm'
                                  : 'border-neutral-100 dark:border-neutral-800 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className="text-2xl mb-1">{METHOD_ICONS[key]}</div>
                            <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                              {t(
                                `payout${key.charAt(0).toUpperCase() + key.slice(1)}` as Parameters<
                                  typeof t
                                >[0]
                              )}
                            </p>
                            {!available && (
                              <span className="absolute top-2 right-2 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                                Coming soon
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cash Settlement Confirm */}
                    {activeMethod === 'cash' && selectedGradeIds.size > 0 && (
                      <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 text-xl">
                            {'\u{1F4B5}'}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">
                              Bargeld-Auszahlung
                            </p>
                            <p className="text-xs text-neutral-500">
                              Belohnung direkt als Bargeld an {child.childName} auszahlen
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              Betrag
                            </span>
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-300">
                              {sym}
                              {getSelectedAmount(child.childId).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-neutral-500">
                              {selectedGradeIds.size} Noten &times; {sym}
                              {effectivePointValue}/Punkt
                            </span>
                            <span className="text-xs text-neutral-500">Methode: Bargeld</span>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Optionale Notiz..."
                          value={settleNote}
                          onChange={(e) => setSettleNote(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
                        />

                        {!confirmOpen || confirmChildId !== child.childId ? (
                          <button
                            onClick={() => {
                              setConfirmOpen(true)
                              setConfirmChildId(child.childId)
                            }}
                            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
                          >
                            Auszahlung best\u00e4tigen
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                              Bist du sicher? {sym}
                              {getSelectedAmount(child.childId).toFixed(2)} werden als Bargeld an{' '}
                              {child.childName} verbucht.
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleSettleConfirm(child.childId)}
                                disabled={settling}
                                className="flex-1 px-5 py-3 rounded-xl bg-success-600 text-white text-sm font-semibold shadow-md hover:bg-success-700 disabled:opacity-60 transition"
                              >
                                {settling ? tc('saving') : 'Ja, auszahlen'}
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmOpen(false)
                                  setConfirmChildId(null)
                                }}
                                className="px-5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {childList.length === 0 && !loading && (
            <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 px-6 py-10 text-center">
              <p className="text-neutral-600 dark:text-neutral-300">
                Noch keine Kinder verbunden. Lade dein Kind ein, um Belohnungen auszuzahlen.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Settlement History */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('settlementHistory')}
        </h2>

        {/* Stats Overview */}
        {settlements.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-100 dark:border-primary-800 p-3">
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                Gesamt ausgezahlt
              </p>
              <p className="text-xl font-bold text-primary-700 dark:text-primary-200">
                {sym}
                {settlementStats.totalSettled.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 p-3">
              <p className="text-xs text-neutral-500 font-medium">Auszahlungen</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {settlementStats.total}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 p-3">
              <p className="text-xs text-neutral-500 font-medium">{'\u00d8'} pro Auszahlung</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {sym}
                {settlementStats.total > 0
                  ? (settlementStats.totalSettled / settlementStats.total).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 p-3">
              <p className="text-xs text-success-600 dark:text-success-400 font-medium">
                Belohnte Kinder
              </p>
              <p className="text-xl font-bold text-success-700 dark:text-success-200">
                {Object.keys(settlementStats.childCounts).length}
              </p>
            </div>
          </div>
        )}

        {/* History List */}
        {!settlementsLoaded ? (
          <p className="text-sm text-neutral-500">{tc('loading')}</p>
        ) : settlements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-8 text-center">
            <p className="text-2xl mb-2">{'\u{1F3C6}'}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Noch keine Auszahlungen. Belohne dein Kind f\u00fcr seine Leistungen!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-100 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-lg flex-shrink-0">
                  {METHOD_ICONS[s.method] || '\u{1F4B0}'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                      {s.childName || t('child')}
                    </p>
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                      {methodLabel(s.method)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate">
                    {formatDate(s.createdAt)}
                    {s.notes ? ` \u2014 ${s.notes}` : ''}
                  </p>
                </div>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-300 flex-shrink-0">
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
