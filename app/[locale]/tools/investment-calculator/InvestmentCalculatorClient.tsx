'use client'

import { useState, useCallback } from 'react'
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

interface DataPoint {
  year: number
  value: number
  contributed: number
}

function computeGrowth(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number
): DataPoint[] {
  const monthlyRate = annualRate / 100 / 12
  const points: DataPoint[] = []

  for (let y = 0; y <= years; y++) {
    const months = y * 12
    const contributed = initial + monthly * months
    let value = initial
    for (let m = 0; m < months; m++) {
      value = value * (1 + monthlyRate) + monthly
    }
    points.push({ year: y, value: Math.round(value), contributed: Math.round(contributed) })
  }

  return points
}

export function InvestmentCalculatorClient() {
  const t = useTranslations('tools')
  const [initial, setInitial] = useState(500)
  const [monthly, setMonthly] = useState(50)
  const [rate, setRate] = useState(7)
  const [years, setYears] = useState(10)
  const [data, setData] = useState<DataPoint[]>([])
  const [calculated, setCalculated] = useState(false)

  const calculate = useCallback(() => {
    setData(computeGrowth(initial, monthly, rate, years))
    setCalculated(true)
  }, [initial, monthly, rate, years])

  const last = data[data.length - 1]

  const formatEur = (n: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="grid sm:grid-cols-2 gap-6">
        {[
          {
            label: t('investInitial'),
            value: initial,
            setter: setInitial,
            min: 0,
            max: 100000,
            step: 100,
          },
          {
            label: t('investMonthly'),
            value: monthly,
            setter: setMonthly,
            min: 0,
            max: 5000,
            step: 10,
          },
          { label: t('investReturn'), value: rate, setter: setRate, min: 0, max: 20, step: 0.5 },
          { label: t('investYears'), value: years, setter: setYears, min: 1, max: 50, step: 1 },
        ].map(({ label, value, setter, min, max, step }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {label}:{' '}
              <span className="text-primary-600 font-bold">
                {value}
                {label === t('investReturn') ? '%' : label === t('investYears') ? '' : ''}
              </span>
            </label>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={calculate}
        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow hover:shadow-lg hover:scale-105 transition-all"
      >
        {t('investCalculate')}
      </button>

      {calculated && last && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: t('investFinalValue'),
                value: formatEur(last.value),
                color: 'text-primary-600 dark:text-primary-400',
              },
              {
                label: t('investContributed'),
                value: formatEur(last.contributed),
                color: 'text-neutral-600 dark:text-neutral-300',
              },
              {
                label: t('investGrowth'),
                value: formatEur(last.value - last.contributed),
                color: 'text-success-600 dark:text-success-400',
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center"
              >
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
                <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              {t('investChartTitle')}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => (typeof value === 'number' ? formatEur(value) : '')}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  name={t('investFinalValue')}
                />
                <Area
                  type="monotone"
                  dataKey="contributed"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#colorContrib)"
                  name={t('investContributed')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
