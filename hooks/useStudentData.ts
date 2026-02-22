'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { resolveLocalized } from '@/lib/i18n'

export type Term = {
  id: string
  school_year: string
  term_type: string
  term_name?: string | null
  class_level: number
  grading_system_id: string
  total_bonus_points: number
  created_at: string
  report_card_image_url?: string | null
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
    min_value?: number | null
    max_value?: number | null
    best_is_highest?: boolean | null
  } | null
}

export type TermPrefill = {
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

export function useStudentData() {
  const locale = useLocale()
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedTermType, setSelectedTermType] = useState<string>('all')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const [profile, setProfile] = useState<{
    full_name?: string | null
    date_of_birth?: string | null
    role?: string | null
  } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  const loadTerms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/grades/list')
      const data = await res.json()
      if (!res.ok || !data.success) {
        if (res.status === 401 || res.status === 403) {
          setSessionExpired(true)
          setError('Session expired. Please log in again.')
          return
        }
        throw new Error(data.error || 'Failed to load saved grades')
      }
      setTerms(data.terms || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved grades')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTerms()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile/update')
        const data = await res.json()
        if (res.ok && data.success && data.profile) {
          setProfile({
            full_name: data.profile.fullName,
            date_of_birth: data.profile.dateOfBirth,
            role: data.profile.role,
          })
        }
      } catch {
        // ignore profile load failure
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
    const overallWeights = terms.reduce(
      (acc, t) => {
        t.subject_grades.forEach((sg) => {
          const weight = Number(sg.subject_weight ?? 1)
          const norm = Number(sg.grade_normalized_100 ?? 0)
          acc.totalWeighted += norm * weight
          acc.totalWeight += weight
        })
        return acc
      },
      { totalWeighted: 0, totalWeight: 0 }
    )
    const overallAvg =
      overallWeights.totalWeight > 0 ? overallWeights.totalWeighted / overallWeights.totalWeight : 0
    const trend = Object.entries(byYear)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, value]) => ({ label: year, value }))
    return { total, best, trend, count: terms.length, overallAvg }
  }, [terms])

  const handleDelete = useCallback(
    async (termId: string) => {
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
    },
    [loadTerms]
  )

  const handleEdit = useCallback(
    (term: Term): TermPrefill => {
      const subjects =
        term.subject_grades?.map((s) => ({
          id: crypto.randomUUID(),
          subjectId: s.subject_id || undefined,
          subjectName: resolveLocalized(s.subjects?.name, locale) || 'Subject',
          grade: s.grade_value || '',
          weight: Number(s.subject_weight ?? 1),
        })) || []

      return {
        termId: term.id,
        gradingSystemId: term.grading_system_id,
        classLevel: Number(term.class_level),
        termType: term.term_type,
        schoolYear: term.school_year,
        termName: term.term_name || undefined,
        subjects,
      }
    },
    [locale]
  )

  const subjectAggregates = useMemo(() => {
    const map: Record<
      string,
      { name: string; totalNorm: number; totalWeight: number; count: number }
    > = {}
    terms.forEach((t) => {
      t.subject_grades.forEach((sg) => {
        const name = resolveLocalized(sg.subjects?.name, locale) || 'Unknown'
        const key = sg.subject_id || name
        if (!map[key]) map[key] = { name, totalNorm: 0, totalWeight: 0, count: 0 }
        const w = Number(sg.subject_weight ?? 1)
        map[key].totalNorm += Number(sg.grade_normalized_100 ?? 0) * w
        map[key].totalWeight += w
        map[key].count += 1
      })
    })
    return Object.values(map).map((s) => ({
      subject: s.name,
      avgScore: s.totalWeight > 0 ? s.totalNorm / s.totalWeight : 0,
      count: s.count,
    }))
  }, [terms, locale])

  const tierDistribution = useMemo(() => {
    let best = 0,
      second = 0,
      third = 0,
      below = 0
    terms.forEach((t) => {
      t.subject_grades.forEach((sg) => {
        const tier = sg.grade_quality_tier || ''
        if (tier === 'best') best++
        else if (tier === 'second') second++
        else if (tier === 'third') third++
        else below++
      })
    })
    return [
      { name: 'Best', value: best, color: '#22c55e' },
      { name: 'Second', value: second, color: '#6366f1' },
      { name: 'Third', value: third, color: '#f59e0b' },
      { name: 'Below', value: below, color: '#ef4444' },
    ].filter((d) => d.value > 0)
  }, [terms])

  const termComparison = useMemo(() => {
    return terms
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-8)
      .map((t) => ({
        label: `${t.school_year} ${t.term_type}`,
        bonus: Number(t.total_bonus_points || 0),
      }))
  }, [terms])

  return {
    terms,
    loading,
    error,
    selectedYear,
    setSelectedYear,
    selectedTermType,
    setSelectedTermType,
    expandedTerm,
    setExpandedTerm,
    profile,
    profileLoading,
    sessionExpired,
    years,
    filteredTerms,
    stats,
    loadTerms,
    handleDelete,
    handleEdit,
    subjectAggregates,
    tierDistribution,
    termComparison,
    locale,
  }
}
