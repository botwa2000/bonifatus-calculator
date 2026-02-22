'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParentData } from '@/hooks/useParentData'
import { resolveLocalized } from '@/lib/i18n'
import { deriveTier, tierColor } from '@/lib/utils/grade-helpers'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Badge } from '@/components/ui/Badge'
import {
  GradeTrendChart,
  SubjectPerformanceChart,
  TermComparisonChart,
  GradeDistributionChart,
} from '@/components/charts'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const CHILD_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899']

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid #374151',
  borderRadius: '12px',
  fontSize: 13,
  color: '#f3f4f6',
}

type SubjectGrade = {
  grade_normalized_100?: number | null
  subject_weight?: number | null
  subjects?: { name?: string | Record<string, string> | null } | null
}

export default function ParentInsightsPage() {
  const t = useTranslations('parent')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { connections, loading, gradeSummaries, allChildTerms, combinedBonus, gradesLoaded } =
    useParentData()

  /* ── Filter state ─────────────────────────────────────── */

  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedTermType, setSelectedTermType] = useState<string>('all')
  const [selectedTier, setSelectedTier] = useState<string>('all')

  /* ── Maps & helpers ────────────────────────────────────── */

  const childNames = useMemo(() => {
    const map: Record<string, string> = {}
    connections.forEach((c) => {
      map[c.childId] = c.child?.fullName || t('child')
    })
    return map
  }, [connections, t])

  const childIds = useMemo(() => connections.map((c) => c.childId), [connections])

  /* ── Available filter values (derived from data) ──────── */

  const availableYears = useMemo(() => {
    const set = new Set<string>()
    allChildTerms.forEach(({ term }) => set.add(term.school_year))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [allChildTerms])

  const availableTermTypes = useMemo(() => {
    const set = new Set<string>()
    allChildTerms.forEach(({ term }) => set.add(term.term_type))
    return Array.from(set).sort()
  }, [allChildTerms])

  /* ── Apply filters to get working dataset ─────────────── */

  const filteredTerms = useMemo(() => {
    return allChildTerms.filter(({ childId, term }) => {
      if (selectedChild !== 'all' && childId !== selectedChild) return false
      if (selectedYear !== 'all' && term.school_year !== selectedYear) return false
      if (selectedTermType !== 'all' && term.term_type !== selectedTermType) return false
      return true
    })
  }, [allChildTerms, selectedChild, selectedYear, selectedTermType])

  /** Filter individual subject grades by tier when tier filter is active */
  const filterGradesByTier = (grades: SubjectGrade[]): SubjectGrade[] => {
    if (selectedTier === 'all') return grades
    return grades.filter((sg) => {
      const n = Number(sg.grade_normalized_100 ?? 0)
      return deriveTier(n) === selectedTier
    })
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedYear !== 'all') count++
    if (selectedTermType !== 'all') count++
    if (selectedTier !== 'all') count++
    return count
  }, [selectedYear, selectedTermType, selectedTier])

  /* ── Stats (computed from filtered data) ──────────────── */

  const filteredTermCount = filteredTerms.length

  const overallAvg = useMemo(() => {
    let totalWeight = 0
    let totalWeighted = 0
    filteredTerms.forEach(({ term }) => {
      filterGradesByTier(term.subject_grades || []).forEach((sg) => {
        const w = Number(sg.subject_weight ?? 1)
        const n = Number(sg.grade_normalized_100 ?? 0)
        totalWeighted += n * w
        totalWeight += w
      })
    })
    return totalWeight > 0 ? totalWeighted / totalWeight : 0
  }, [filteredTerms, selectedTier])

  const filteredBonus = useMemo(() => {
    return filteredTerms.reduce((sum, { term }) => sum + Number(term.total_bonus_points ?? 0), 0)
  }, [filteredTerms])

  const mostActive = useMemo(() => {
    if (selectedChild !== 'all') return childNames[selectedChild] || t('child')
    const counts: Record<string, number> = {}
    filteredTerms.forEach(({ childId }) => {
      counts[childId] = (counts[childId] || 0) + 1
    })
    let max = 0
    let name = '-'
    Object.entries(counts).forEach(([id, c]) => {
      if (c > max) {
        max = c
        name = childNames[id] || t('child')
      }
    })
    return name
  }, [filteredTerms, selectedChild, childNames, t])

  /* ── Per-child summary cards ──────────────────────────── */

  const childSummaryCards = useMemo(() => {
    return childIds.map((id, idx) => {
      const terms = filteredTerms.filter((t) => t.childId === id)
      let totalWeight = 0
      let totalWeighted = 0
      let bonus = 0
      terms.forEach(({ term }) => {
        bonus += Number(term.total_bonus_points ?? 0)
        filterGradesByTier(term.subject_grades || []).forEach((sg) => {
          const w = Number(sg.subject_weight ?? 1)
          const n = Number(sg.grade_normalized_100 ?? 0)
          totalWeighted += n * w
          totalWeight += w
        })
      })
      const avg = totalWeight > 0 ? totalWeighted / totalWeight : 0
      return {
        id,
        name: childNames[id] || t('child'),
        color: CHILD_COLORS[idx % CHILD_COLORS.length],
        bonus,
        terms: terms.length,
        avg,
        tier: deriveTier(avg),
      }
    })
  }, [childIds, childNames, filteredTerms, selectedTier, t])

  /* ── Comparative bonus by year ────────────────────────── */

  const comparativeData = useMemo(() => {
    const yearMap: Record<string, Record<string, number>> = {}
    filteredTerms.forEach(({ childId, term }) => {
      const year = term.school_year
      if (!yearMap[year]) yearMap[year] = {}
      yearMap[year][childId] = (yearMap[year][childId] || 0) + Number(term.total_bonus_points ?? 0)
    })
    return Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, children]) => ({ year, ...children }))
  }, [filteredTerms])

  /* ── Score trend lines ────────────────────────────────── */

  const trendData = useMemo(() => {
    const yearChildMap: Record<string, Record<string, { totalW: number; totalS: number }>> = {}
    filteredTerms.forEach(({ childId, term }) => {
      const year = term.school_year
      if (!yearChildMap[year]) yearChildMap[year] = {}
      if (!yearChildMap[year][childId]) yearChildMap[year][childId] = { totalW: 0, totalS: 0 }
      filterGradesByTier(term.subject_grades || []).forEach((sg) => {
        const w = Number(sg.subject_weight ?? 1)
        yearChildMap[year][childId].totalW += w
        yearChildMap[year][childId].totalS += Number(sg.grade_normalized_100 ?? 0) * w
      })
    })
    return Object.entries(yearChildMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, children]) => {
        const row: Record<string, string | number> = { year }
        Object.entries(children).forEach(([childId, d]) => {
          row[childId] = d.totalW > 0 ? d.totalS / d.totalW : 0
        })
        return row
      })
  }, [filteredTerms, selectedTier])

  /* ── Subject performance ──────────────────────────────── */

  const subjectAggregates = useMemo(() => {
    const map: Record<string, { name: string; totalNorm: number; totalWeight: number }> = {}
    filteredTerms.forEach(({ term }) => {
      filterGradesByTier(term.subject_grades || []).forEach((sg) => {
        const name = resolveLocalized(sg.subjects?.name, locale) || 'Unknown'
        if (!map[name]) map[name] = { name, totalNorm: 0, totalWeight: 0 }
        const w = Number(sg.subject_weight ?? 1)
        map[name].totalNorm += Number(sg.grade_normalized_100 ?? 0) * w
        map[name].totalWeight += w
      })
    })
    return Object.values(map).map((s) => ({
      subject: s.name,
      avgScore: s.totalWeight > 0 ? s.totalNorm / s.totalWeight : 0,
    }))
  }, [filteredTerms, selectedTier, locale])

  /* ── Grade tier distribution ──────────────────────────── */

  const tierDistribution = useMemo(() => {
    let best = 0,
      second = 0,
      third = 0,
      below = 0
    filteredTerms.forEach(({ term }) => {
      ;(term.subject_grades || []).forEach((sg: { grade_normalized_100?: number | null }) => {
        const n = Number(sg.grade_normalized_100 ?? 0)
        const tier = deriveTier(n)
        if (selectedTier !== 'all' && tier !== selectedTier) return
        if (tier === 'best') best++
        else if (tier === 'second') second++
        else if (tier === 'third') third++
        else below++
      })
    })
    return [
      { name: t('tierBest'), value: best, color: '#22c55e' },
      { name: t('tierSecond'), value: second, color: '#6366f1' },
      { name: t('tierThird'), value: third, color: '#f59e0b' },
      { name: t('tierBelow'), value: below, color: '#ef4444' },
    ].filter((d) => d.value > 0)
  }, [filteredTerms, selectedTier, t])

  /* ── Single-child: bonus trend ────────────────────────── */

  const childBonusTrend = useMemo(() => {
    if (selectedChild === 'all') return []
    const yearMap: Record<string, number> = {}
    filteredTerms.forEach(({ term }) => {
      const year = term.school_year
      yearMap[year] = (yearMap[year] || 0) + Number(term.total_bonus_points ?? 0)
    })
    return Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, value]) => ({ label: year, value }))
  }, [filteredTerms, selectedChild])

  /* ── Single-child: term comparison ────────────────────── */

  const childTermComparison = useMemo(() => {
    if (selectedChild === 'all') return []
    return filteredTerms
      .sort((a, b) => new Date(a.term.created_at).getTime() - new Date(b.term.created_at).getTime())
      .slice(-8)
      .map(({ term }) => ({
        label: `${term.school_year} ${term.term_type}`,
        bonus: Number(term.total_bonus_points ?? 0),
      }))
  }, [filteredTerms, selectedChild])

  /* ── Year-over-year change ────────────────────────────── */

  const yearOverYearChange = useMemo(() => {
    const trend = selectedChild === 'all' ? comparativeData : childBonusTrend
    if (trend.length < 2) return null
    const values = trend.map((d) => {
      if ('value' in d) return d.value as number
      return Object.entries(d).reduce(
        (acc, [k, v]) => (k === 'year' ? acc : acc + Number(v ?? 0)),
        0
      )
    })
    const recent = values[values.length - 1]
    const previous = values[values.length - 2]
    if (previous === 0) return null
    return ((recent - previous) / previous) * 100
  }, [comparativeData, childBonusTrend, selectedChild])

  /* ── Subject comparison table ─────────────────────────── */

  const subjectTable = useMemo(() => {
    const subjectChildMap: Record<string, Record<string, { total: number; weight: number }>> = {}
    filteredTerms.forEach(({ childId, term }) => {
      filterGradesByTier(term.subject_grades || []).forEach((sg) => {
        const subName = resolveLocalized(sg.subjects?.name, locale) || 'Unknown'
        if (!subjectChildMap[subName]) subjectChildMap[subName] = {}
        if (!subjectChildMap[subName][childId])
          subjectChildMap[subName][childId] = { total: 0, weight: 0 }
        const w = Number(sg.subject_weight ?? 1)
        subjectChildMap[subName][childId].total += Number(sg.grade_normalized_100 ?? 0) * w
        subjectChildMap[subName][childId].weight += w
      })
    })
    return Object.entries(subjectChildMap)
      .map(([subject, children]) => {
        const avgs: Record<string, number> = {}
        Object.entries(children).forEach(([childId, d]) => {
          avgs[childId] = d.weight > 0 ? d.total / d.weight : 0
        })
        return { subject, ...avgs }
      })
      .sort((a, b) => a.subject.localeCompare(b.subject))
  }, [filteredTerms, selectedTier, locale])

  /* ── Top & bottom subjects ────────────────────────────── */

  const { topSubjects, weakSubjects } = useMemo(() => {
    const sorted = [...subjectAggregates].sort((a, b) => b.avgScore - a.avgScore)
    return {
      topSubjects: sorted.slice(0, 3),
      weakSubjects: sorted.length > 3 ? sorted.slice(-3).reverse() : [],
    }
  }, [subjectAggregates])

  /* ── Handlers ─────────────────────────────────────────── */

  const clearFilters = () => {
    setSelectedYear('all')
    setSelectedTermType('all')
    setSelectedTier('all')
  }

  /* ── Loading ──────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} padding="md">
              <div className="animate-pulse">
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
                <div className="h-8 w-48 bg-neutral-100 dark:bg-neutral-800 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const visibleChildIds = selectedChild === 'all' ? childIds : [selectedChild]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('insightsTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('insightsDesc')}</p>
      </header>

      {!gradesLoaded || connections.length === 0 ? (
        <Card padding="lg" className="text-center">
          <CardContent className="space-y-3 py-6">
            <div className="text-4xl">&#128202;</div>
            <p className="text-neutral-600 dark:text-neutral-300 font-medium">
              {t('noInsightsData')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Child selector + Filters ─────────────────────── */}
          <Card padding="sm" className="space-y-4">
            <CardContent>
              {/* Child selector */}
              {connections.length > 1 && (
                <div className="mb-4">
                  <SegmentedControl
                    options={[
                      { value: 'all', label: t('allChildren') },
                      ...childIds.map((id, idx) => ({
                        value: id,
                        label: (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: CHILD_COLORS[idx % CHILD_COLORS.length] }}
                            />
                            {childNames[id] || t('child')}
                          </span>
                        ),
                      })),
                    ]}
                    value={selectedChild}
                    onChange={setSelectedChild}
                  />
                </div>
              )}

              {/* Filters row */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <Select
                    label={t('filterYear')}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    options={[
                      { value: 'all', label: t('allYears') },
                      ...availableYears.map((y) => ({ value: y, label: y })),
                    ]}
                    fullWidth
                    className="!py-2 !px-3 text-sm !border"
                  />
                </div>

                <div className="w-44">
                  <Select
                    label={t('filterTermType')}
                    value={selectedTermType}
                    onChange={(e) => setSelectedTermType(e.target.value)}
                    options={[
                      { value: 'all', label: t('allTermTypes') },
                      ...availableTermTypes.map((tt) => ({
                        value: tt,
                        label: tt.charAt(0).toUpperCase() + tt.slice(1),
                      })),
                    ]}
                    fullWidth
                    className="!py-2 !px-3 text-sm !border"
                  />
                </div>

                <div className="w-44">
                  <Select
                    label={t('filterTier')}
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    options={[
                      { value: 'all', label: t('allTiers') },
                      { value: 'best', label: t('tierBest') },
                      { value: 'second', label: t('tierSecond') },
                      { value: 'third', label: t('tierThird') },
                      { value: 'below', label: t('tierBelow') },
                    ]}
                    fullWidth
                    className="!py-2 !px-3 text-sm !border"
                  />
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {t('clearFilters')}
                    <Badge variant="info">{activeFilterCount}</Badge>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Overview Stats ───────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="sm" className="!border-l-4 !border-l-primary-500">
              <CardContent>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedChild === 'all' ? t('totalChildren') : t('termsAnalyzed')}
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {selectedChild === 'all' ? connections.length : filteredTermCount}
                </p>
                {selectedChild === 'all' && filteredTermCount !== allChildTerms.length && (
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {filteredTermCount} / {allChildTerms.length} {t('termsFiltered')}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card padding="sm" className="!border-l-4 !border-l-secondary-500">
              <CardContent>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedChild === 'all' ? t('combinedBonus') : t('totalBonusLabel')}
                </p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
                  {filteredBonus.toFixed(2)}
                </p>
                {activeFilterCount > 0 && selectedChild === 'all' && (
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {t('unfilteredLabel')}: {combinedBonus.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card padding="sm" className="!border-l-4 !border-l-amber-500">
              <CardContent>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('avgScoreAll')}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {overallAvg.toFixed(1)}
                  <span className="text-sm font-normal text-neutral-400 ml-1">/ 100</span>
                </p>
              </CardContent>
            </Card>

            <Card padding="sm" className="!border-l-4 !border-l-success-500">
              <CardContent>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedChild === 'all' ? t('mostActive') : t('termsAnalyzed')}
                </p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {selectedChild === 'all' ? mostActive : filteredTermCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Per-child summary cards ──────────────────────── */}
          {selectedChild === 'all' && childSummaryCards.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childSummaryCards.map((child) => (
                <Card key={child.id} padding="sm" hover onClick={() => setSelectedChild(child.id)}>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: child.color }}
                      >
                        {child.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          {child.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {child.terms} {child.terms === 1 ? 'term' : 'terms'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-xs text-neutral-500">{t('combinedBonus')}</p>
                        <p className="font-bold text-primary-600 dark:text-primary-300">
                          {child.bonus.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">{t('avgScoreAll')}</p>
                        <p className="font-bold" style={{ color: tierColor(child.tier) }}>
                          {child.avg.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── No data after filtering ──────────────────────── */}
          {filteredTerms.length === 0 ? (
            <Card padding="lg" className="text-center">
              <CardContent className="py-6 space-y-2">
                <p className="text-neutral-500 font-medium">{t('noFilteredData')}</p>
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
                >
                  {t('clearFilters')}
                </button>
              </CardContent>
            </Card>
          ) : selectedChild === 'all' ? (
            <>
              {/* ── ALL CHILDREN VIEW ────────────────────────── */}

              {/* Comparative Bonus by Year */}
              {comparativeData.length > 0 && (
                <Card padding="md">
                  <CardContent>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('comparativeBonus')}
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparativeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {visibleChildIds.map((id, idx) => (
                          <Bar
                            key={id}
                            dataKey={id}
                            name={childNames[id] || t('child')}
                            fill={
                              CHILD_COLORS[
                                childIds.indexOf(id) >= 0
                                  ? childIds.indexOf(id) % CHILD_COLORS.length
                                  : idx % CHILD_COLORS.length
                              ]
                            }
                            radius={[6, 6, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Score Trends */}
              {trendData.length > 1 && (
                <Card padding="md">
                  <CardContent>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('trendLines')}
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(value) => [Number(value).toFixed(1), '']}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {visibleChildIds.map((id) => {
                          const colorIdx = childIds.indexOf(id)
                          return (
                            <Line
                              key={id}
                              type="monotone"
                              dataKey={id}
                              name={childNames[id] || t('child')}
                              stroke={
                                CHILD_COLORS[colorIdx >= 0 ? colorIdx % CHILD_COLORS.length : 0]
                              }
                              strokeWidth={2.5}
                              dot={{ r: 5, strokeWidth: 2 }}
                              activeDot={{ r: 7 }}
                            />
                          )
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Subject Performance + Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {subjectAggregates.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        {t('subjectPerformanceLabel')}
                      </h2>
                      <SubjectPerformanceChart
                        data={subjectAggregates}
                        height={Math.max(200, subjectAggregates.length * 36)}
                      />
                    </CardContent>
                  </Card>
                )}

                {tierDistribution.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        {t('gradeDistributionLabel')}
                      </h2>
                      <GradeDistributionChart data={tierDistribution} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Year-over-Year + Top/Bottom Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {yearOverYearChange !== null && (
                  <Card padding="md" className="flex flex-col items-center justify-center">
                    <CardContent className="text-center">
                      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                        {t('yearOverYearLabel')}
                      </h2>
                      <p
                        className={`text-4xl font-bold ${
                          yearOverYearChange >= 0 ? 'text-success-600' : 'text-error-600'
                        }`}
                      >
                        {yearOverYearChange >= 0 ? '\u2191' : '\u2193'}{' '}
                        {Math.abs(yearOverYearChange).toFixed(1)}%
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">{t('bonusChangeLabel')}</p>
                    </CardContent>
                  </Card>
                )}

                {topSubjects.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                        {t('topSubjectsLabel')}
                      </h2>
                      <div className="space-y-2.5">
                        {topSubjects.map((s, i) => (
                          <div key={s.subject} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="!rounded-md w-5 text-center">
                                {i + 1}
                              </Badge>
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                {s.subject}
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold"
                              style={{ color: tierColor(deriveTier(s.avgScore)) }}
                            >
                              {s.avgScore.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {weakSubjects.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                        {t('weakSubjectsLabel')}
                      </h2>
                      <div className="space-y-2.5">
                        {weakSubjects.map((s, i) => (
                          <div key={s.subject} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="warning" className="!rounded-md w-5 text-center">
                                {i + 1}
                              </Badge>
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                {s.subject}
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold"
                              style={{ color: tierColor(deriveTier(s.avgScore)) }}
                            >
                              {s.avgScore.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Subject Comparison Table */}
              {subjectTable.length > 0 && connections.length > 1 && (
                <Card padding="md">
                  <CardContent>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('subjectComparison')}
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-800">
                            <th className="text-left py-2.5 px-3 text-neutral-500 font-medium">
                              {t('subjectLabel')}
                            </th>
                            {childIds.map((id, idx) => (
                              <th key={id} className="text-center py-2.5 px-3 font-medium">
                                <span className="flex items-center justify-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full inline-block"
                                    style={{
                                      backgroundColor: CHILD_COLORS[idx % CHILD_COLORS.length],
                                    }}
                                  />
                                  <span className="text-neutral-700 dark:text-neutral-200">
                                    {childNames[id] || t('child')}
                                  </span>
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {subjectTable.map((row) => (
                            <tr
                              key={row.subject}
                              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                            >
                              <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-white">
                                {row.subject}
                              </td>
                              {childIds.map((id) => {
                                const val = (row as Record<string, unknown>)[id] as
                                  | number
                                  | undefined
                                const score = val ?? 0
                                const tier = deriveTier(score)
                                return (
                                  <td key={id} className="py-2.5 px-3 text-center">
                                    {val !== undefined ? (
                                      <span
                                        className="font-semibold"
                                        style={{ color: tierColor(tier) }}
                                      >
                                        {score.toFixed(1)}
                                      </span>
                                    ) : (
                                      <span className="text-neutral-300 dark:text-neutral-600">
                                        -
                                      </span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* ── SINGLE CHILD VIEW ───────────────────────── */}

              {/* Bonus Trend */}
              {childBonusTrend.length >= 2 && (
                <Card padding="md">
                  <CardContent>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('comparativeBonus')}
                    </h2>
                    <GradeTrendChart data={childBonusTrend} height={300} />
                  </CardContent>
                </Card>
              )}

              {/* Subject Performance + Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {subjectAggregates.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        {t('subjectPerformanceLabel')}
                      </h2>
                      <SubjectPerformanceChart
                        data={subjectAggregates}
                        height={Math.max(200, subjectAggregates.length * 36)}
                      />
                    </CardContent>
                  </Card>
                )}

                {tierDistribution.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        {t('gradeDistributionLabel')}
                      </h2>
                      <GradeDistributionChart data={tierDistribution} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Term Comparison */}
              {childTermComparison.length > 1 && (
                <Card padding="md">
                  <CardContent>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('termComparisonLabel')}
                    </h2>
                    <TermComparisonChart data={childTermComparison} height={300} />
                  </CardContent>
                </Card>
              )}

              {/* Year-over-Year + Top/Bottom Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {yearOverYearChange !== null && (
                  <Card padding="md" className="flex flex-col items-center justify-center">
                    <CardContent className="text-center">
                      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                        {t('yearOverYearLabel')}
                      </h2>
                      <p
                        className={`text-4xl font-bold ${
                          yearOverYearChange >= 0 ? 'text-success-600' : 'text-error-600'
                        }`}
                      >
                        {yearOverYearChange >= 0 ? '\u2191' : '\u2193'}{' '}
                        {Math.abs(yearOverYearChange).toFixed(1)}%
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">{t('bonusChangeLabel')}</p>
                    </CardContent>
                  </Card>
                )}

                {topSubjects.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                        {t('topSubjectsLabel')}
                      </h2>
                      <div className="space-y-2.5">
                        {topSubjects.map((s, i) => (
                          <div key={s.subject} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="!rounded-md w-5 text-center">
                                {i + 1}
                              </Badge>
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                {s.subject}
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold"
                              style={{ color: tierColor(deriveTier(s.avgScore)) }}
                            >
                              {s.avgScore.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {weakSubjects.length > 0 && (
                  <Card padding="md">
                    <CardContent>
                      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                        {t('weakSubjectsLabel')}
                      </h2>
                      <div className="space-y-2.5">
                        {weakSubjects.map((s, i) => (
                          <div key={s.subject} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="warning" className="!rounded-md w-5 text-center">
                                {i + 1}
                              </Badge>
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                {s.subject}
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold"
                              style={{ color: tierColor(deriveTier(s.avgScore)) }}
                            >
                              {s.avgScore.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
