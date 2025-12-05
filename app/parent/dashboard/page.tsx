'use client'

import { useEffect, useMemo, useState } from 'react'

type ChildWithGrades = {
  relationshipId: string
  child?: {
    id: string
    full_name: string
    date_of_birth?: string | null
  }
  terms: Array<{
    id: string
    school_year: string
    term_type: string
    term_name?: string | null
    class_level: number
    total_bonus_points: number
    created_at: string
    grading_systems?: {
      name?: string | Record<string, string> | null
      min_value?: number | null
      max_value?: number | null
      best_is_highest?: boolean | null
    } | null
    subject_grades: Array<{
      id: string
      grade_value: string | null
      grade_normalized_100: number | null
      subject_weight: number | null
      bonus_points: number | null
      subjects?: { name: string | Record<string, string> | null } | null
    }>
  }>
}

function convertNormalizedToScale(
  system: ChildWithGrades['terms'][number]['grading_systems'],
  normalized: number
) {
  if (!system) return normalized
  const min = Number(system.min_value ?? 0)
  const max = Number(system.max_value ?? 100)
  if (max === min) return normalized
  if (system.best_is_highest === false) {
    return max - (normalized / 100) * (max - min)
  }
  return min + (normalized / 100) * (max - min)
}

function resolveLocalized(value?: string | Record<string, string> | null) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value['en'] || Object.values(value)[0] || ''
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<ChildWithGrades[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/parent/children/grades')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load')
      setData(json.children || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = useMemo(() => {
    const totalKids = data.length
    const totalTerms = data.reduce((acc, child) => acc + child.terms.length, 0)
    const totalBonus = data.reduce(
      (acc, child) =>
        acc + child.terms.reduce((s, t) => s + (Number(t.total_bonus_points) || 0), 0),
      0
    )
    return { totalKids, totalTerms, totalBonus }
  }, [data])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Parent dashboard</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Children insights</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          View each child’s saved results and subject-level details. Read-only access.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 text-error-700 px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Linked children</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
            {totals.totalKids}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Saved terms</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
            {totals.totalTerms}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Total bonus points</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
            {totals.totalBonus.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Linked children
          </h2>
          <button
            onClick={load}
            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-neutral-500">No linked children yet.</p>
        ) : (
          <div className="space-y-3">
            {data.map((child) => {
              const bestTerm = child.terms[0]
              const avgNorm = bestTerm
                ? bestTerm.subject_grades.reduce(
                    (acc, sg) => {
                      const w = Number(sg.subject_weight ?? 1)
                      const n = Number(sg.grade_normalized_100 ?? 0)
                      acc.weighted += n * w
                      acc.weight += w
                      return acc
                    },
                    { weighted: 0, weight: 0 }
                  )
                : null
              const avgScore =
                avgNorm && avgNorm.weight > 0
                  ? convertNormalizedToScale(
                      bestTerm?.grading_systems,
                      avgNorm.weighted / avgNorm.weight
                    )
                  : 0

              return (
                <div
                  key={child.relationshipId}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {child.child?.full_name || 'Child'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Terms: {child.terms.length} · Avg score {avgScore.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setExpanded((prev) =>
                          prev === child.relationshipId ? null : child.relationshipId
                        )
                      }
                      className="text-sm font-semibold text-primary-600 dark:text-primary-300"
                    >
                      {expanded === child.relationshipId ? 'Hide' : 'View'}
                    </button>
                  </div>

                  {expanded === child.relationshipId && (
                    <div className="space-y-3 pt-2">
                      {child.terms.length === 0 ? (
                        <p className="text-sm text-neutral-500">No saved results yet.</p>
                      ) : (
                        child.terms.map((term) => (
                          <div
                            key={term.id}
                            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                  {term.school_year} • {term.term_type}
                                  {term.term_name ? ` • ${term.term_name}` : ''}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {term.subject_grades.length} subjects
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-neutral-500">Bonus</p>
                                <p className="text-xl font-bold text-primary-600 dark:text-primary-300">
                                  {Number(term.total_bonus_points ?? 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2">
                              {term.subject_grades.map((sg) => (
                                <div
                                  key={sg.id}
                                  className="rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-sm"
                                >
                                  <div className="font-semibold text-neutral-900 dark:text-white">
                                    {resolveLocalized(sg.subjects?.name) || 'Subject'}
                                  </div>
                                  <div className="text-xs text-neutral-500">
                                    Grade {sg.grade_value ?? '-'} • Weight{' '}
                                    {Number(sg.subject_weight ?? 1).toFixed(1)}
                                  </div>
                                  <div className="text-xs text-primary-600 dark:text-primary-300">
                                    Bonus {Number(sg.bonus_points ?? 0).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
