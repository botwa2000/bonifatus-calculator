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

function computeMonthlyCompoundGrowth(
  monthlyContribution: number,
  annualRatePercent: number,
  years: number
) {
  const monthlyRate = annualRatePercent / 100 / 12
  const data: { year: number; invested: number; value: number }[] = []

  let balance = 0
  let totalInvested = 0

  data.push({ year: 0, invested: 0, value: 0 })

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance += monthlyContribution
      totalInvested += monthlyContribution
      balance *= 1 + monthlyRate
    }
    data.push({
      year: y,
      invested: Math.round(totalInvested * 100) / 100,
      value: Math.round(balance * 100) / 100,
    })
  }

  return data
}

function formatCurrency(value: number) {
  if (value >= 10000) {
    return `\u20ac${Math.round(value).toLocaleString()}`
  }
  return `\u20ac${value.toFixed(0)}`
}

export default function SavingsSimulator() {
  const t = useTranslations('parent')

  const [monthlyContribution, setMonthlyContribution] = useState(10)
  const [interestRate, setInterestRate] = useState(7)
  const [duration, setDuration] = useState(18)

  const growthData = useMemo(
    () => computeMonthlyCompoundGrowth(monthlyContribution, interestRate, duration),
    [monthlyContribution, interestRate, duration]
  )

  const finalEntry = growthData[growthData.length - 1]
  const totalInvested = finalEntry?.invested ?? 0
  const totalValue = finalEntry?.value ?? 0
  const totalReturns = totalValue - totalInvested

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('monthlyContribution')} (&euro;)
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('interestRate')} (%)
          </label>
          <input
            type="number"
            min={0}
            max={30}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Math.max(0, Math.min(30, Number(e.target.value))))}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('duration')}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <p className="text-xs text-neutral-500">{t('totalInvested')}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(totalInvested)}
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
          {t('compoundGrowthChart')}
        </h3>
        <p className="text-xs text-neutral-400 mb-4">
          &euro;{monthlyContribution}/mo &middot; {interestRate}% &middot; {duration} years
        </p>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="savingsValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="savingsInvestedGradient" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
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
                fill="url(#savingsInvestedGradient)"
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#7c3aed"
                strokeWidth={2.5}
                fill="url(#savingsValueGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-violet-600 rounded-full inline-block" />
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
    </div>
  )
}
