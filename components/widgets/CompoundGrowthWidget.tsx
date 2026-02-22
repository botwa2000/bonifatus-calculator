'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const POINT_VALUES = [1, 2, 5, 10]
const DEFAULT_ANNUAL_POINTS = 50
const DEFAULT_RETURN_RATE = 7
const DEFAULT_YEARS = 15

function formatCurrency(value: number, currency: string) {
  const symbol = currency === 'EUR' ? '\u20ac' : '$'
  if (value >= 10000) {
    return `${symbol}${Math.round(value).toLocaleString()}`
  }
  return `${symbol}${value.toFixed(0)}`
}

function computeGrowth(annualContribution: number, ratePercent: number, years: number) {
  const r = ratePercent / 100
  const data: { year: number; invested: number; value: number }[] = []
  let balance = 0
  let totalInvested = 0

  for (let y = 0; y <= years; y++) {
    data.push({
      year: y,
      invested: Math.round(totalInvested),
      value: Math.round(balance),
    })
    balance = (balance + annualContribution) * (1 + r)
    totalInvested += annualContribution
  }

  return data
}

export function CompoundGrowthWidget() {
  const t = useTranslations('home')

  const [pointValue, setPointValue] = useState(5)
  const [annualPoints, setAnnualPoints] = useState(DEFAULT_ANNUAL_POINTS)
  const [years, setYears] = useState(DEFAULT_YEARS)
  const [returnRate] = useState(DEFAULT_RETURN_RATE)
  const currency = 'EUR'

  const annualContribution = annualPoints * pointValue

  const growthData = useMemo(
    () => computeGrowth(annualContribution, returnRate, years),
    [annualContribution, returnRate, years]
  )

  const finalValue = growthData[growthData.length - 1]?.value ?? 0
  const totalInvested = growthData[growthData.length - 1]?.invested ?? 0
  const growthGain = finalValue - totalInvested

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="rounded-3xl bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-card overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: Controls */}
          <div className="p-8 sm:p-10 space-y-6">
            <div>
              <div className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <span className="text-primary-700 dark:text-primary-300 text-xs font-semibold tracking-wide uppercase">
                  {t('growthBadge')}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                {t('growthTitle')}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base">
                {t('growthSubtitle')}
              </p>
            </div>

            {/* Point Value Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('growthPointValue')}
              </label>
              <div className="flex gap-2">
                {POINT_VALUES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setPointValue(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      pointValue === v
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-primary-400'
                    }`}
                  >
                    {currency === 'EUR' ? '\u20ac' : '$'}
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Annual Bonus Points Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('growthAnnualPoints')}
                </label>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-300">
                  {annualPoints} {t('growthPtsPerYear')}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={annualPoints}
                onChange={(e) => setAnnualPoints(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>10</span>
                <span>200</span>
              </div>
            </div>

            {/* Years Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('growthYears')}
                </label>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-300">
                  {years} {t('growthYearsLabel')}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={25}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>5</span>
                <span>25</span>
              </div>
            </div>

            {/* Result Summary */}
            <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-5 space-y-3">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  {formatCurrency(finalValue, currency)}
                </p>
                <p className="text-sm text-neutral-500">{t('growthAfterYears', { years })}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-neutral-500">{t('growthTotalInvested')}</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(totalInvested, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">{t('growthReturns')}</p>
                  <p className="font-semibold text-success-600 dark:text-success-400">
                    +{formatCurrency(growthGain, currency)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                {t('growthAssumption', { rate: returnRate })}
              </p>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {t('growthCta')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>

          {/* Right: Chart */}
          <div className="flex flex-col justify-center bg-white/50 dark:bg-neutral-800/30 p-6 sm:p-10">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                {t('growthChartTitle')}
              </h4>
              <p className="text-xs text-neutral-400">
                {formatCurrency(annualContribution, currency)}/{t('growthPerYear')} &middot;{' '}
                {returnRate}% {t('growthAnnualReturn')}
              </p>
            </div>
            <div className="w-full h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b7280" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6b7280" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                    width={40}
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
                      formatCurrency(Number(value), currency),
                      name === 'value' ? t('growthPortfolioValue') : t('growthTotalInvested'),
                    ]}
                    labelFormatter={(label) => `${t('growthYear')} ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stroke="#9ca3af"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#investedGradient)"
                    animationDuration={1200}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    fill="url(#growthGradient)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-violet-600 rounded-full inline-block" />
                {t('growthPortfolioValue')}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 bg-neutral-400 rounded-full inline-block border-dashed"
                  style={{ borderTop: '1.5px dashed #9ca3af', height: 0 }}
                />
                {t('growthTotalInvested')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
