'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  GRADING_SYSTEMS,
  calculateRewards,
  type GradingSystemId,
  type SubjectInput,
  type CalculatorResult,
} from '@/lib/tools/calculator'

const SYSTEM_IDS: GradingSystemId[] = ['german', 'us', 'french', 'percentage', 'swiss', 'austrian']

const SYSTEM_KEY_MAP: Record<GradingSystemId, string> = {
  german: 'calcSystemGerman',
  us: 'calcSystemUs',
  french: 'calcSystemFrench',
  percentage: 'calcSystemPercentage',
  swiss: 'calcSystemSwiss',
  austrian: 'calcSystemAustrian',
}

const TIER_COLOR: Record<string, string> = {
  excellent: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
  good: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
  satisfactory: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  insufficient: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
}

const TIER_KEY_MAP: Record<string, string> = {
  excellent: 'calcTierExcellent',
  good: 'calcTierGood',
  satisfactory: 'calcTierSatisfactory',
  insufficient: 'calcTierInsufficient',
}

function defaultSubject(systemId: GradingSystemId, index: number): SubjectInput {
  const grades = GRADING_SYSTEMS[systemId].grades
  return {
    name: '',
    grade: grades[0],
    systemId,
  }
}

export function GradeRewardCalculatorClient() {
  const t = useTranslations('tools')
  const [systemId, setSystemId] = useState<GradingSystemId>('german')
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    defaultSubject('german', 0),
    defaultSubject('german', 1),
    defaultSubject('german', 2),
  ])
  const [result, setResult] = useState<CalculatorResult | null>(null)

  const changeSystem = (id: GradingSystemId) => {
    setSystemId(id)
    const grades = GRADING_SYSTEMS[id].grades
    setSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        systemId: id,
        grade: grades[0],
      }))
    )
    setResult(null)
  }

  const updateSubject = (idx: number, field: keyof SubjectInput, value: string) => {
    setSubjects((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setResult(null)
  }

  const addSubject = () => {
    setSubjects((prev) => [...prev, defaultSubject(systemId, prev.length)])
    setResult(null)
  }

  const removeSubject = (idx: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== idx))
    setResult(null)
  }

  const calculate = () => {
    const filled = subjects.filter((s) => s.name.trim())
    if (filled.length === 0) return
    setResult(calculateRewards(filled))
  }

  const reset = () => {
    const grades = GRADING_SYSTEMS[systemId].grades
    setSubjects([0, 1, 2].map((i) => ({ name: '', grade: grades[0], systemId })))
    setResult(null)
  }

  const grades = GRADING_SYSTEMS[systemId].grades

  return (
    <div className="space-y-8">
      {/* Grading system selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {t('calcGradingSystem')}
        </label>
        <div className="flex flex-wrap gap-2">
          {SYSTEM_IDS.map((id) => (
            <button
              key={id}
              onClick={() => changeSystem(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                systemId === id
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              }`}
            >
              {t(SYSTEM_KEY_MAP[id] as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>

      {/* Subject rows */}
      <div className="space-y-3">
        {subjects.map((s, idx) => (
          <div key={idx} className="flex gap-3 items-center">
            <input
              type="text"
              placeholder={`${t('calcSubjectName')} ${idx + 1}`}
              value={s.name}
              onChange={(e) => updateSubject(idx, 'name', e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={s.grade}
              onChange={(e) => updateSubject(idx, 'grade', e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {subjects.length > 1 && (
              <button
                onClick={() => removeSubject(idx)}
                className="text-neutral-400 hover:text-error-500 transition-colors text-sm px-2"
              >
                {t('calcRemoveSubject')}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add subject */}
      <button
        onClick={addSubject}
        className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
      >
        + {t('calcAddSubject')}
      </button>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow hover:shadow-lg hover:scale-105 transition-all"
        >
          {t('calcCalculate')}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
        >
          {t('calcReset')}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 bg-white dark:bg-neutral-800/50 space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {t('calcResultTitle')}
          </h2>

          {/* Per subject */}
          <div className="space-y-3">
            {result.subjects.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{s.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('calcGrade')}: {s.grade} — {s.percentage}%
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${TIER_COLOR[s.tier]}`}
                >
                  {t(TIER_KEY_MAP[s.tier] as Parameters<typeof t>[0])}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-neutral-900 dark:text-white">{t('calcTotal')}</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {result.averagePercentage}%
              </span>
              <span
                className={`px-4 py-1 rounded-full text-sm font-semibold ${TIER_COLOR[result.tier]}`}
              >
                {t(TIER_KEY_MAP[result.tier] as Parameters<typeof t>[0])}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
