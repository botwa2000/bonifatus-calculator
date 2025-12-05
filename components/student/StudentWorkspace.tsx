'use client'

import { useEffect, useMemo, useState } from 'react'
import { DemoCalculator } from '@/components/demo-calculator'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import type { Tables } from '@/types/database'

type Term = {
  id: string
  school_year: string
  term_type: string
  term_name?: string | null
  class_level: number
  grading_system_id: string
  total_bonus_points: number
  created_at: string
  subject_grades: Array<{
    id: string
    subject_id: string | null
    grade_value: string | null
    grade_normalized_100: number | null
    subject_weight: number | null
    bonus_points: number | null
    grade_quality_tier: string | null
    subjects?: {
      name: string | Record<string, string> | null
    } | null
  }>
  grading_systems?: {
    name: string | Record<string, string> | null
    code?: string | null
    scale_type?: string | null
  } | null
}

type TermPrefill = {
  termId?: string
  gradingSystemId: string
  classLevel: number
  termType: string
  schoolYear: string
  termName?: string
  subjects: Array<{
    id: string
    subjectId?: string
    subjectName: string
    grade: string
    weight: number
  }>
}

function resolveLocalized(value?: string | Record<string, string> | null) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value['en'] || Object.values(value)[0] || ''
}

function formatDate(input: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(input))
  } catch {
    return input
  }
}

function calculateAge(dob?: string | null) {
  if (!dob) return null
  const parsed = new Date(dob)
  if (Number.isNaN(parsed.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const m = today.getMonth() - parsed.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
    age -= 1
  }
  if (age < 0 || age > 150) return null
  return age
}

export function StudentWorkspace() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'saved' | 'insights'>('calculator')
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedTermType, setSelectedTermType] = useState<string>('all')
  const [prefill, setPrefill] = useState<TermPrefill | undefined>(undefined)
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const [profile, setProfile] = useState<Pick<
    Tables<'user_profiles'>,
    'full_name' | 'date_of_birth' | 'role'
  > | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const applyHashTab = () => {
      if (typeof window === 'undefined') return
      const hash = window.location.hash.replace('#', '')
      if (hash === 'saved') setActiveTab('saved')
      if (hash === 'insights') setActiveTab('insights')
      if (hash === 'calculator') setActiveTab('calculator')
    }
    applyHashTab()
    window.addEventListener('hashchange', applyHashTab)
    return () => window.removeEventListener('hashchange', applyHashTab)
  }, [])

  const loadTerms = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/grades/list')
      const data = await res.json()
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setSessionExpired(true)
          setError('Session expired. Please log in again.')
          return
        }
        throw new Error(data.error || 'Failed to load saved grades')
      }
      setTerms(data.terms || [])
      const latestYear = data.terms?.[0]?.school_year
      if (latestYear && selectedYear === 'all') {
        setSelectedYear(latestYear)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved grades')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTerms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createBrowserSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setProfileLoading(false)
          return
        }
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name, date_of_birth, role')
          .eq('id', user.id)
          .single()
        if (data) {
          setProfile(data)
        }
      } catch {
        // ignore profile load failure; calculator still works
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [])

  const years = useMemo(() => {
    const uniq = new Set(terms.map((t) => t.school_year))
    return Array.from(uniq).sort((a, b) => b.localeCompare(a))
  }, [terms])

  const filteredTerms = useMemo(() => {
    return terms.filter((t) => {
      const yearOk = selectedYear === 'all' || t.school_year === selectedYear
      const termOk = selectedTermType === 'all' || t.term_type === selectedTermType
      return yearOk && termOk
    })
  }, [terms, selectedYear, selectedTermType])

  const stats = useMemo(() => {
    if (!terms.length) return null
    const total = terms.reduce((acc, t) => acc + (Number(t.total_bonus_points) || 0), 0)
    const best = terms.reduce((prev, curr) =>
      (curr.total_bonus_points || 0) > (prev.total_bonus_points || 0) ? curr : prev
    )
    const byYear = terms.reduce<Record<string, number>>((acc, t) => {
      acc[t.school_year] = (acc[t.school_year] || 0) + (Number(t.total_bonus_points) || 0)
      return acc
    }, {})
    const trend = Object.entries(byYear)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, value]) => ({ year, value }))
    return { total, best, trend, count: terms.length }
  }, [terms])

  const handleDelete = async (termId: string) => {
    try {
      const res = await fetch('/api/grades/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete term')
      }
      await loadTerms()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete term')
    }
  }

  const handleEdit = (term: Term) => {
    const subjects =
      term.subject_grades?.map((s) => ({
        id: crypto.randomUUID(),
        subjectId: s.subject_id || undefined,
        subjectName: resolveLocalized(s.subjects?.name) || 'Subject',
        grade: s.grade_value || '',
        weight: Number(s.subject_weight ?? 1),
      })) || []

    setPrefill({
      termId: term.id,
      gradingSystemId: term.grading_system_id,
      classLevel: Number(term.class_level),
      termType: term.term_type,
      schoolYear: term.school_year,
      termName: term.term_name || undefined,
      subjects,
    })
    setActiveTab('calculator')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Student workspace</p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Calculator, results, insights
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300">
              Run calculations, save terms, and track your progress over years and terms.
            </p>
            {!profileLoading && profile && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Signed in as{' '}
                <span className="font-semibold text-neutral-800 dark:text-white">
                  {profile.full_name}
                </span>
                {calculateAge(profile.date_of_birth) !== null && (
                  <> - Age {calculateAge(profile.date_of_birth)} yrs</>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={selectedTermType}
              onChange={(e) => setSelectedTermType(e.target.value)}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
            >
              <option value="all">All terms</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="semester">Semester</option>
              <option value="quarterly">Quarter</option>
            </select>
          </div>
        </header>

        <div className="flex gap-2" id="calculator">
          {[
            { key: 'calculator', label: 'Calculator' },
            { key: 'saved', label: 'Saved results' },
            { key: 'insights', label: 'Insights' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-button'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
            {error}{' '}
            {sessionExpired && (
              <button
                onClick={() => (window.location.href = '/login?redirectTo=/dashboard')}
                className="underline font-semibold"
              >
                Sign in
              </button>
            )}
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6">
            <DemoCalculator
              allowSample={false}
              initialData={prefill}
              onSaved={() => {
                setPrefill(undefined)
                loadTerms()
                setActiveTab('saved')
              }}
            />
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6 space-y-4">
            <div id="saved" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  Saved results
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Filter by year and term to review or edit.
                </p>
              </div>
              <button
                onClick={loadTerms}
                className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="text-neutral-600 dark:text-neutral-300 text-sm">Loading...</p>
            ) : filteredTerms.length === 0 ? (
              <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                No saved results for this filter. Run a calculation and save it.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredTerms.map((term) => (
                  <div
                    key={term.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {term.school_year} • {term.term_type}
                          {term.term_name ? ` • ${term.term_name}` : ''}
                        </p>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {resolveLocalized(term.grading_systems?.name) || 'Grading system'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Saved {formatDate(term.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-neutral-500">Bonus points</p>
                          <p className="text-xl font-bold text-primary-600 dark:text-primary-300">
                            {Number(term.total_bonus_points ?? 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(term)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(term.id)}
                            className="px-3 py-1.5 rounded-lg border border-error-200 text-sm font-semibold text-error-600 hover:bg-error-50"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() =>
                              setExpandedTerm((prev) => (prev === term.id ? null : term.id))
                            }
                            className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-800 dark:text-white"
                          >
                            {expandedTerm === term.id ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {expandedTerm === term.id && (
                      <div className="mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {term.subject_grades.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2"
                            >
                              <div>
                                <p className="font-semibold text-neutral-900 dark:text-white">
                                  {resolveLocalized(sub.subjects?.name) || 'Subject'}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Grade: {sub.grade_value ?? '-'} • Weight:{' '}
                                  {Number(sub.subject_weight ?? 1).toFixed(1)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-neutral-500">Bonus</p>
                                <p className="text-primary-600 dark:text-primary-300 font-semibold">
                                  +{Number(sub.bonus_points ?? 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6 space-y-4">
            <div id="insights" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Insights</h2>
            {loading ? (
              <p className="text-neutral-600 dark:text-neutral-300 text-sm">Loading...</p>
            ) : !stats ? (
              <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                Add results to see trends and comparisons.
              </p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 p-4">
                  <p className="text-xs text-neutral-500">Total bonus points</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
                    {stats.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{stats.count} terms saved</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 p-4">
                  <p className="text-xs text-neutral-500">Best term</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {stats.best.school_year} • {stats.best.term_type}
                  </p>
                  <p className="text-primary-600 dark:text-primary-300 font-bold text-xl">
                    {Number(stats.best.total_bonus_points ?? 0).toFixed(2)} pts
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 p-4">
                  <p className="text-xs text-neutral-500">Year trend</p>
                  <div className="space-y-1 text-sm text-neutral-800 dark:text-neutral-200">
                    {stats.trend.map((item) => (
                      <div key={item.year} className="flex justify-between">
                        <span>{item.year}</span>
                        <span className="font-semibold">{item.value.toFixed(2)} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
