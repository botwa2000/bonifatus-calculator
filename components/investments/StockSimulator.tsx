'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const ETF_DATA = [
  { symbol: 'MSCI World', avgReturn: 8.5, description: 'Global diversified equity' },
  { symbol: 'S&P 500', avgReturn: 10.2, description: 'US large-cap equity' },
  { symbol: 'STOXX Europe 600', avgReturn: 6.8, description: 'European equity' },
  { symbol: 'MSCI EM', avgReturn: 7.1, description: 'Emerging markets equity' },
  { symbol: 'DAX', avgReturn: 7.5, description: 'German blue-chip equity' },
]

function computeEtfGrowth(initialAmount: number, annualReturnPercent: number, years: number) {
  const rate = annualReturnPercent / 100
  const data: { year: number; invested: number; value: number }[] = []

  let balance = initialAmount
  const invested = initialAmount

  for (let y = 0; y <= years; y++) {
    data.push({
      year: y,
      invested: Math.round(invested * 100) / 100,
      value: Math.round(balance * 100) / 100,
    })
    balance *= 1 + rate
  }

  return data
}

function formatCurrency(value: number) {
  if (value >= 10000) {
    return `\u20ac${Math.round(value).toLocaleString()}`
  }
  return `\u20ac${value.toFixed(0)}`
}

export default function StockSimulator() {
  const t = useTranslations('parent')

  const [selectedEtfIndex, setSelectedEtfIndex] = useState(0)
  const [investmentAmount, setInvestmentAmount] = useState(1000)
  const [holdingPeriod, setHoldingPeriod] = useState(10)

  const selectedEtf = ETF_DATA[selectedEtfIndex]

  const growthData = useMemo(
    () => computeEtfGrowth(investmentAmount, selectedEtf.avgReturn, holdingPeriod),
    [investmentAmount, selectedEtf.avgReturn, holdingPeriod]
  )

  const finalEntry = growthData[growthData.length - 1]
  const totalValue = finalEntry?.value ?? 0
  const totalReturns = totalValue - investmentAmount

  return (
    <div className="space-y-6">
      {/* ETF Selection */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('selectEtf')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {ETF_DATA.map((etf, idx) => (
            <button
              key={etf.symbol}
              onClick={() => setSelectedEtfIndex(idx)}
              className={`rounded-xl border p-3 text-left transition ${
                selectedEtfIndex === idx
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{etf.symbol}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">{etf.description}</p>
              <p className="text-xs font-semibold text-success-600 dark:text-success-400 mt-1">
                ~{etf.avgReturn}% p.a.
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('investmentAmount')} (&euro;)
          </label>
          <input
            type="number"
            min={1}
            step={100}
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('holdingPeriod')}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            step={1}
            value={holdingPeriod}
            onChange={(e) => setHoldingPeriod(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <p className="text-xs text-neutral-500">{t('totalInvested')}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(investmentAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <p className="text-xs text-neutral-500">{t('simulatedValue')}</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <p className="text-xs text-neutral-500">{t('totalReturns')}</p>
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">
            +{formatCurrency(totalReturns)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          {selectedEtf.symbol} &mdash; {t('historicalReturn')}: {selectedEtf.avgReturn}% p.a.
        </h3>
        <p className="text-xs text-neutral-400 mb-4">
          &euro;{investmentAmount.toLocaleString()} &middot; {holdingPeriod} years
        </p>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="etfValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="etfInvestedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}y`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'value' ? t('simulatedValue') : t('totalInvested'),
                ]}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#etfInvestedGradient)"
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#etfValueGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 rounded-full inline-block" />
            {t('simulatedValue')}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 bg-neutral-400 rounded-full inline-block"
              style={{ borderTop: '1.5px dashed #9ca3af', height: 0 }}
            />
            {t('totalInvested')}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-neutral-400 italic text-center">{t('educationalDisclaimer')}</p>
    </div>
  )
}
