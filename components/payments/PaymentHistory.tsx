'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type Transaction = {
  id: string
  parentId: string
  childId: string
  settlementId: string | null
  amount: number
  currency: string
  method: string
  status: string
  providerReference: string | null
  notes: string | null
  createdAt: string
  completedAt: string | null
  childName: string | null
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'failed'

const CARD_CLASS =
  'rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm'
const BTN_PRIMARY =
  'bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
}

function StatusBadge({ status }: { status: string }) {
  const classes = STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES.cancelled
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}
    >
      {status}
    </span>
  )
}

function MethodIcon({ method }: { method: string }) {
  switch (method) {
    case 'bank':
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
          />
        </svg>
      )
    case 'paypal':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.22A.956.956 0 015.886 1.5h5.888c3.498 0 5.604 1.867 5.258 5.192-.44 4.237-3.19 6.013-6.506 6.013H8.78a.58.58 0 00-.573.487L7.076 21.337z" />
        </svg>
      )
    case 'cash':
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
          />
        </svg>
      )
    default:
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
  }
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function PaymentHistory() {
  const t = useTranslations('parent')

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const url =
        statusFilter === 'all'
          ? '/api/payments/transactions'
          : `/api/payments/transactions?status=${statusFilter}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions)
      } else {
        setError(data.error || 'Failed to load transactions')
      }
    } catch {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleMarkCompleted = async (transactionId: string) => {
    setUpdatingId(transactionId)
    setError(null)

    try {
      const res = await fetch('/api/payments/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          status: 'completed',
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId
              ? { ...tx, status: 'completed', completedAt: new Date().toISOString() }
              : tx
          )
        )
      } else {
        setError(data.error || 'Failed to update transaction')
      }
    } catch {
      setError('Failed to update transaction')
    } finally {
      setUpdatingId(null)
    }
  }

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'pending', label: t('filterPending') },
    { key: 'completed', label: t('filterCompleted') },
    { key: 'failed', label: t('filterFailed') },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('paymentHistory')}
        </h3>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 w-fit">
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatusFilter(filter.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === filter.key
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            {t('dismiss')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className={CARD_CLASS}>
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-5 w-5 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('loading')}
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && transactions.length === 0 && (
        <div className={CARD_CLASS}>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            {t('noTransactions')}
          </p>
        </div>
      )}

      {/* Transaction list */}
      {!loading && transactions.length > 0 && (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className={CARD_CLASS}>
              <div className="flex items-center gap-4">
                {/* Method icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center">
                  <MethodIcon method={tx.method} />
                </div>

                {/* Transaction details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                      {tx.childName || t('unknownChild')}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="capitalize">{tx.method}</span>
                    <span>{'\u00b7'}</span>
                    <span>{formatDate(tx.createdAt)}</span>
                    {tx.notes && (
                      <>
                        <span>{'\u00b7'}</span>
                        <span className="truncate max-w-[200px]">{tx.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount & action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-neutral-900 dark:text-white text-sm whitespace-nowrap">
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>

                  {tx.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleMarkCompleted(tx.id)}
                      disabled={updatingId === tx.id}
                      className={BTN_PRIMARY}
                    >
                      {updatingId === tx.id ? (
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        t('markCompleted')
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
