'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type StockData = {
  ticker: string
  name: string
  price: number
  return30d: number
  currency: string
}

export function StockTickerWidget() {
  const t = useTranslations('parent')
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStocks() {
      try {
        const res = await fetch('/api/market/top-performers')
        const data = await res.json()
        if (res.ok && data.success) {
          setStocks(data.stocks || [])
        }
      } catch {
        // fallback to empty
      } finally {
        setLoading(false)
      }
    }
    loadStocks()
  }, [])

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-neutral-400">&#9650;</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('marketWatch')}
        </h3>
      </div>

      {loading ? (
        <p className="text-xs text-neutral-500">Loading market data...</p>
      ) : stocks.length === 0 ? (
        <p className="text-xs text-neutral-500">No data available</p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {stocks.slice(0, 10).map((stock) => (
            <div
              key={stock.ticker}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                  {stock.ticker}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">{stock.name}</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  {stock.currency === 'EUR' ? '\u20ac' : '$'}
                  {stock.price.toFixed(1)}
                </p>
                <span className="inline-block text-[10px] font-semibold rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 px-1.5 py-0.5">
                  +{stock.return30d.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-neutral-400">{t('marketDisclaimer')}</p>

      <Link
        href="/parent/rewards"
        className="block text-xs font-semibold text-primary-600 dark:text-primary-300 hover:underline"
      >
        {t('investCta')} &rarr;
      </Link>
    </div>
  )
}
