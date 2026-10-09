'use client'

import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import {
  DJI_ALLOWANCE_TABLE,
  DJI_SOURCE_URL,
  convertRange,
  getAllowanceForAge,
  type AllowanceEntry,
  type AllowancePeriod,
} from '@/lib/tools/allowance-table'

const MIN_AGE = 4
const MAX_AGE = 18

export function AllowanceCalculatorClient() {
  const t = useTranslations('tools')
  const format = useFormatter()
  const [age, setAge] = useState(10)
  const entry = getAllowanceForAge(age)

  // The currency symbol sits in the translated message ("15–25 €" / "€15–25"); both ends
  // share one precision so a range never mixes "3,50" with "6".
  const range = (min: number, max: number, period: AllowancePeriod) => {
    const digits = Number.isInteger(min) && Number.isInteger(max) ? 0 : 2
    const num = (v: number) =>
      format.number(v, { minimumFractionDigits: digits, maximumFractionDigits: digits })
    return t(period === 'week' ? 'allowanceRangePerWeek' : 'allowanceRangePerMonth', {
      min: num(min),
      max: num(max),
    })
  }
  const ageGroup = (row: AllowanceEntry) =>
    row.ageMin === 0
      ? t('allowanceAgeUnder', { age: row.ageMax! + 1 })
      : row.ageMax === null
        ? t('allowanceAgeFrom', { age: row.ageMin })
        : `${row.ageMin}–${row.ageMax}`
  const ageLabel = age === MAX_AGE ? t('allowanceAgeFrom', { age }) : String(age)

  const converted = entry ? convertRange(entry) : null

  return (
    <div className="space-y-8">
      {/* Age slider */}
      <div>
        <label
          htmlFor="allowance-age"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4"
        >
          {t('allowanceAgeLabel')}: <span className="text-primary-600 font-bold">{ageLabel}</span>
        </label>
        <input
          id="allowance-age"
          type="range"
          min={MIN_AGE}
          max={MAX_AGE}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-neutral-400 mt-1">
          <span>{MIN_AGE}</span>
          <span>{t('allowanceAgeFrom', { age: MAX_AGE })}</span>
        </div>
      </div>

      {/* Result */}
      {entry && converted && (
        <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            {t('allowanceResultLabel', { age: ageLabel })}
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">
            {range(entry.minEur, entry.maxEur, entry.period)}
            {entry.dependentOnly && '*'}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            {t('allowanceEquivalent', {
              range: range(converted.minEur, converted.maxEur, converted.period),
            })}
          </p>
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
                {t('allowanceTableRange')}
              </th>
            </tr>
          </thead>
          <tbody>
            {DJI_ALLOWANCE_TABLE.map((row) => {
              const isActive = row === entry
              return (
                <tr
                  key={row.ageMin}
                  className={`border-t border-neutral-100 dark:border-neutral-700 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/10 font-semibold text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <td className="px-4 py-2">{ageGroup(row)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {range(row.minEur, row.maxEur, row.period)}
                    {row.dependentOnly && '*'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
        <p>{t('allowanceDependentNote')}</p>
        <p>{t('allowanceKeepSeparate')}</p>
        <p>
          <a
            href={DJI_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-600"
          >
            {t('allowanceSource')}
          </a>
        </p>
      </div>
    </div>
  )
}
