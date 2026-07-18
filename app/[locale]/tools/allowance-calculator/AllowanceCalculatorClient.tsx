'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { DJI_ALLOWANCE_TABLE, getAllowanceForAge } from '@/lib/tools/allowance-table'

const MIN_AGE = 4
const MAX_AGE = 21

export function AllowanceCalculatorClient() {
  const t = useTranslations('tools')
  const [age, setAge] = useState(10)
  const entry = getAllowanceForAge(age)

  return (
    <div className="space-y-8">
      {/* Age slider */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
          {t('allowanceAgeLabel')}: <span className="text-primary-600 font-bold">{age}</span>
        </label>
        <input
          type="range"
          min={MIN_AGE}
          max={MAX_AGE}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-neutral-400 mt-1">
          <span>{MIN_AGE}</span>
          <span>{MAX_AGE}</span>
        </div>
      </div>

      {/* Result */}
      {entry ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              {t('allowanceResultMonthly')}
            </p>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              €{entry.monthlyEur}
            </p>
          </div>
          <div className="p-6 bg-success-50 dark:bg-success-900/20 rounded-2xl text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              {t('allowanceResultWeekly')}
            </p>
            <p className="text-4xl font-bold text-success-600 dark:text-success-400">
              €{entry.weeklyEur.toFixed(2)}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-center text-neutral-500">
          —
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">
                {t('allowanceAgeLabel')}
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                {t('allowanceResultMonthly')}
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                {t('allowanceResultWeekly')}
              </th>
            </tr>
          </thead>
          <tbody>
            {DJI_ALLOWANCE_TABLE.map((row) => {
              const isActive = age >= row.ageMin && age <= row.ageMax
              return (
                <tr
                  key={row.ageMin}
                  className={`border-t border-neutral-100 dark:border-neutral-700 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/10 font-semibold text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <td className="px-4 py-2">
                    {row.ageMin === row.ageMax ? row.ageMin : `${row.ageMin}–${row.ageMax}`}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">€{row.monthlyEur}</td>
                  <td className="px-4 py-2 text-right tabular-nums">€{row.weeklyEur.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('allowanceSource')}</p>
    </div>
  )
}
