'use client'

import { useMemo, useState } from 'react'
import { notendurchschnittCopy } from '@/content/tools/notendurchschnitt'
import {
  BAVARIA_SUBJECTS,
  bavariaEligibility,
  calculateAverage,
  formatGrade,
  type GradeEntry,
} from '@/lib/tools/notendurchschnitt'

const c = notendurchschnittCopy.form
const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6]
const DEFAULT_SUBJECTS = ['Deutsch', 'Mathematik', 'Englisch']
const KM_URL = notendurchschnittCopy.sources[1].url

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'

type Tab = 'all' | 'bavaria'

function GradeSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (g: number | null) => void
}) {
  return (
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={inputClass}
    >
      <option value="">{c.noGrade}</option>
      {GRADE_OPTIONS.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  )
}

export function NotendurchschnittRechner() {
  const [tab, setTab] = useState<Tab>('all')
  const [rows, setRows] = useState<GradeEntry[]>(() =>
    DEFAULT_SUBJECTS.map((name) => ({ name, grade: null, weight: 1 }))
  )
  const [bavaria, setBavaria] = useState<GradeEntry[]>(() =>
    BAVARIA_SUBJECTS.map((name) => ({ name, grade: null, weight: 1 }))
  )

  const all = useMemo(() => calculateAverage(rows), [rows])
  const by = useMemo(() => calculateAverage(bavaria), [bavaria])
  const bavariaComplete = by.counted === BAVARIA_SUBJECTS.length

  const updateRow = (i: number, patch: Partial<GradeEntry>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1"
      >
        {(['all', 'bavaria'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {c.tabs[t]}
          </button>
        ))}
      </div>

      {tab === 'all' ? (
        <div>
          <div className="grid grid-cols-[1fr_5rem_6rem_2rem] gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>{c.subjectHeader}</span>
            <span>{c.gradeHeader}</span>
            <span>{c.weightHeader}</span>
            <span />
          </div>
          <ul className="space-y-2">
            {rows.map((row, i) => (
              <li key={i} className="grid grid-cols-[1fr_5rem_6rem_2rem] gap-2 items-center">
                <input
                  type="text"
                  aria-label={c.subjectHeader}
                  placeholder={c.subjectPlaceholder}
                  value={row.name}
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                  className={inputClass}
                />
                <GradeSelect
                  label={`${c.gradeHeader}: ${row.name}`}
                  value={row.grade}
                  onChange={(grade) => updateRow(i, { grade })}
                />
                <select
                  aria-label={`${c.weightHeader}: ${row.name}`}
                  value={row.weight}
                  onChange={(e) => updateRow(i, { weight: Number(e.target.value) })}
                  className={inputClass}
                >
                  {c.weightOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  aria-label={c.removeSubject(row.name)}
                  className="h-9 w-8 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { name: '', grade: null, weight: 1 }])}
            className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {c.addSubject}
          </button>

          <div
            className="mt-6 rounded-2xl bg-primary-50 dark:bg-primary-900/20 p-6 text-center"
            aria-live="polite"
          >
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{c.resultLabel}</p>
            {all.truncated !== null && all.exact !== null ? (
              <>
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {formatGrade(all.truncated)}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
                  {c.resultDetail(all.counted, formatGrade(all.exact, 4))}
                </p>
              </>
            ) : (
              <p className="text-neutral-600 dark:text-neutral-300">{c.resultEmpty}</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">{c.bavariaIntro}</p>
          <ul className="space-y-2">
            {bavaria.map((row, i) => (
              <li key={row.name} className="grid grid-cols-[1fr_5rem] gap-2 items-center">
                <span className="text-neutral-900 dark:text-white">{row.name}</span>
                <GradeSelect
                  label={`${c.gradeHeader}: ${row.name}`}
                  value={row.grade}
                  onChange={(grade) =>
                    setBavaria((rs) => rs.map((r, j) => (j === i ? { ...r, grade } : r)))
                  }
                />
              </li>
            ))}
          </ul>
          <div
            className="mt-6 rounded-2xl bg-primary-50 dark:bg-primary-900/20 p-6 text-center"
            aria-live="polite"
          >
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{c.resultLabel}</p>
            {bavariaComplete && by.truncated !== null ? (
              <>
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {formatGrade(by.truncated)}
                </p>
                <p className="text-neutral-700 dark:text-neutral-200 mt-3">
                  {c.bavariaResult[bavariaEligibility(by.truncated)]}
                </p>
                {bavariaEligibility(by.truncated) === 'none' && (
                  <a
                    href={KM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary-600 dark:text-primary-400 underline"
                  >
                    km.bayern.de
                  </a>
                )}
              </>
            ) : (
              <p className="text-neutral-600 dark:text-neutral-300">{c.bavariaEmpty}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
