'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParentData } from '@/hooks/useParentData'
import { resolveLocalized } from '@/lib/i18n'
import { deriveTier, tierColor } from '@/lib/utils/grade-helpers'
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

export default function ParentInsightsPage() {
  const t = useTranslations('parent')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { connections, loading, gradeSummaries, allChildTerms, combinedBonus, gradesLoaded } =
    useParentData()

  const [selectedChild, setSelectedChild] = useState<string>('all')

  /* ── Maps & helpers ────────────────────────────────────── */

  const childNames = useMemo(() => {
    const map: Record<string, string> = {}
    connections.forEach((c) => {
      map[c.childId] = c.child?.fullName || t('child')
    })
    return map
  }, [connections, t])

  const childIds = useMemo(() => connections.map((c) => c.childId), [connections])

  /* ── All-children stats ───────────────────────────────── */

  const totalTerms = useMemo(() => allChildTerms.length, [allChildTerms])

  const overallAvg = useMemo(() => {
    let totalWeight = 0
    let totalWeighted = 0
    const terms =
      selectedChild === 'all'
        ? allChildTerms
        : allChildTerms.filter((t) => t.childId === selectedChild)
    terms.forEach(({ term }) => {
      ;(term.subject_grades || []).forEach(
        (sg: { grade_normalized_100?: number | null; subject_weight?: number | null }) => {
          const w = Number(sg.subject_weight ?? 1)
          const n = Number(sg.grade_normalized_100 ?? 0)
          totalWeighted += n * w
          totalWeight += w
        }
      )
    })
    return totalWeight > 0 ? totalWeighted / totalWeight : 0
  }, [allChildTerms, selectedChild])

  const selectedBonus = useMemo(() => {
    if (selectedChild === 'all') return combinedBonus
    return gradeSummaries[selectedChild]?.totalBonus ?? 0
  }, [selectedChild, combinedBonus, gradeSummaries])

  const selectedTermCount = useMemo(() => {
    if (selectedChild === 'all') return totalTerms
    return gradeSummaries[selectedChild]?.savedTerms ?? 0
  }, [selectedChild, totalTerms, gradeSummaries])

  const mostActive = useMemo(() => {
    let max = 0
    let name = '-'
    Object.entries(gradeSummaries).forEach(([id, s]) => {
      if (s.savedTerms > max) {
        max = s.savedTerms
        name = childNames[id] || t('child')
      }
    })
    return name
  }, [gradeSummaries, childNames, t])

  /* ── Per-child summary cards ──────────────────────────── */

  const childSummaryCards = useMemo(() => {
    return childIds.map((id, idx) => {
      const summary = gradeSummaries[id]
      const name = childNames[id] || t('child')
      const terms = allChildTerms.filter((t) => t.childId === id)
      let totalWeight = 0
      let totalWeighted = 0
      terms.forEach(({ term }) => {
        ;(term.subject_grades || []).forEach(
          (sg: { grade_normalized_100?: number | null; subject_weight?: number | null }) => {
            const w = Number(sg.subject_weight ?? 1)
            const n = Number(sg.grade_normalized_100 ?? 0)
            totalWeighted += n * w
            totalWeight += w
          }
        )
      })
      const avg = totalWeight > 0 ? totalWeighted / totalWeight : 0
      return {
        id,
        name,
        color: CHILD_COLORS[idx % CHILD_COLORS.length],
        bonus: summary?.totalBonus ?? 0,
        terms: summary?.savedTerms ?? 0,
        avg,
        tier: deriveTier(avg),
      }
    })
  }, [childIds, gradeSummaries, childNames, allChildTerms, t])

  /* ── Comparative bonus by year (all children) ─────────── */

  const comparativeData = useMemo(() => {
    const yearMap: Record<string, Record<string, number>> = {}
    allChildTerms.forEach(({ childId, term }) => {
      const year = term.school_year
      if (!yearMap[year]) yearMap[year] = {}
      yearMap[year][childId] = (yearMap[year][childId] || 0) + Number(term.total_bonus_points ?? 0)
    })
    return Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, children]) => ({ year, ...children }))
  }, [allChildTerms])

  /* ── Score trend lines (all children) ─────────────────── */

  const trendData = useMemo(() => {
    const yearChildMap: Record<string, Record<string, number>> = {}
    allChildTerms.forEach(({ childId, term }) => {
      const year = term.school_year
      if (!yearChildMap[year]) yearChildMap[year] = {}
      const grades = term.subject_grades || []
      let totalW = 0
      let totalS = 0
      grades.forEach(
        (sg: { grade_normalized_100?: number | null; subject_weight?: number | null }) => {
          const w = Number(sg.subject_weight ?? 1)
          totalW += w
          totalS += Number(sg.grade_normalized_100 ?? 0) * w
        }
      )
      const avg = totalW > 0 ? totalS / totalW : 0
      yearChildMap[year][childId] = avg
    })
    return Object.entries(yearChildMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, children]) => ({ year, ...children }))
  }, [allChildTerms])

  /* ── Aggregated subject performance ───────────────────── */

  const subjectAggregates = useMemo(() => {
    const map: Record<string, { name: string; totalNorm: number; totalWeight: number }> = {}
    const terms =
      selectedChild === 'all'
        ? allChildTerms
        : allChildTerms.filter((t) => t.childId === selectedChild)
    terms.forEach(({ term }) => {
      ;(term.subject_grades || []).forEach(
        (sg: {
          subjects?: { name?: string | Record<string, string> | null } | null
          grade_normalized_100?: number | null
          subject_weight?: number | null
        }) => {
          const name = resolveLocalized(sg.subjects?.name, locale) || 'Unknown'
          if (!map[name]) map[name] = { name, totalNorm: 0, totalWeight: 0 }
          const w = Number(sg.subject_weight ?? 1)
          map[name].totalNorm += Number(sg.grade_normalized_100 ?? 0) * w
          map[name].totalWeight += w
        }
      )
    })
    return Object.values(map).map((s) => ({
      subject: s.name,
      avgScore: s.totalWeight > 0 ? s.totalNorm / s.totalWeight : 0,
    }))
  }, [allChildTerms, selectedChild, locale])

  /* ── Grade tier distribution ──────────────────────────── */

  const tierDistribution = useMemo(() => {
    let best = 0,
      second = 0,
      third = 0,
      below = 0
    const terms =
      selectedChild === 'all'
        ? allChildTerms
        : allChildTerms.filter((t) => t.childId === selectedChild)
    terms.forEach(({ term }) => {
      ;(term.subject_grades || []).forEach((sg: { grade_normalized_100?: number | null }) => {
        const n = Number(sg.grade_normalized_100 ?? 0)
        const tier = deriveTier(n)
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
  }, [allChildTerms, selectedChild, t])

  /* ── Single-child: bonus trend ────────────────────────── */

  const childBonusTrend = useMemo(() => {
    if (selectedChild === 'all') return []
    const yearMap: Record<string, number> = {}
    allChildTerms
      .filter((t) => t.childId === selectedChild)
      .forEach(({ term }) => {
        const year = term.school_year
        yearMap[year] = (yearMap[year] || 0) + Number(term.total_bonus_points ?? 0)
      })
    return Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, value]) => ({ label: year, value }))
  }, [allChildTerms, selectedChild])

  /* ── Single-child: term comparison ────────────────────── */

  const childTermComparison = useMemo(() => {
    if (selectedChild === 'all') return []
    return allChildTerms
      .filter((t) => t.childId === selectedChild)
      .sort((a, b) => new Date(a.term.created_at).getTime() - new Date(b.term.created_at).getTime())
      .slice(-8)
      .map(({ term }) => ({
        label: `${term.school_year} ${term.term_type}`,
        bonus: Number(term.total_bonus_points ?? 0),
      }))
  }, [allChildTerms, selectedChild])

  /* ── Year-over-year change ────────────────────────────── */

  const yearOverYearChange = useMemo(() => {
    const trend = selectedChild === 'all' ? comparativeData : childBonusTrend
    if (trend.length < 2) return null
    const values = trend.map((d) => {
      if ('value' in d) return d.value as number
      // For comparativeData: sum all child values in the year
      const sum = Object.entries(d).reduce(
        (acc, [k, v]) => (k === 'year' ? acc : acc + Number(v ?? 0)),
        0
      )
      return sum
    })
    const recent = values[values.length - 1]
    const previous = values[values.length - 2]
    if (previous === 0) return null
    return ((recent - previous) / previous) * 100
  }, [comparativeData, childBonusTrend, selectedChild])

  /* ── Subject comparison table (all children) ──────────── */

  const subjectTable = useMemo(() => {
    const subjectChildMap: Record<string, Record<string, { total: number; weight: number }>> = {}
    allChildTerms.forEach(({ childId, term }) => {
      ;(term.subject_grades || []).forEach(
        (sg: {
          subjects?: { name?: string | Record<string, string> | null } | null
          grade_normalized_100?: number | null
          subject_weight?: number | null
        }) => {
          const subName = resolveLocalized(sg.subjects?.name, locale) || 'Unknown'
          if (!subjectChildMap[subName]) subjectChildMap[subName] = {}
          if (!subjectChildMap[subName][childId])
            subjectChildMap[subName][childId] = { total: 0, weight: 0 }
          const w = Number(sg.subject_weight ?? 1)
          subjectChildMap[subName][childId].total += Number(sg.grade_normalized_100 ?? 0) * w
          subjectChildMap[subName][childId].weight += w
        }
      )
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
  }, [allChildTerms, locale])

  /* ── Top & bottom subjects ────────────────────────────── */

  const { topSubjects, weakSubjects } = useMemo(() => {
    const sorted = [...subjectAggregates].sort((a, b) => b.avgScore - a.avgScore)
    return {
      topSubjects: sorted.slice(0, 3),
      weakSubjects: sorted.slice(-3).reverse(),
    }
  }, [subjectAggregates])

  /* ── Loading / empty state ────────────────────────────── */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 animate-pulse"
            >
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
              <div className="h-8 w-48 bg-neutral-100 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('insightsTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('insightsDesc')}</p>
      </header>

      {!gradesLoaded || connections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center space-y-3">
          <div className="text-4xl">&#128202;</div>
          <p className="text-neutral-600 dark:text-neutral-300 font-medium">
            {t('noInsightsData')}
          </p>
        </div>
      ) : (
        <>
          {/* Child Selector Tabs */}
          {connections.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedChild('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedChild === 'all'
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-md'
                    : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-primary-400 bg-white dark:bg-neutral-900'
                }`}
              >
                {t('allChildren')}
              </button>
              {childIds.map((id, idx) => (
                <button
                  key={id}
                  onClick={() => setSelectedChild(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    selectedChild === id
                      ? 'text-white shadow-md'
                      : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-primary-400 bg-white dark:bg-neutral-900'
                  }`}
                  style={
                    selectedChild === id
                      ? { backgroundColor: CHILD_COLORS[idx % CHILD_COLORS.length] }
                      : undefined
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: CHILD_COLORS[idx % CHILD_COLORS.length] }}
                  />
                  {childNames[id] || t('child')}
                </button>
              ))}
            </div>
          )}

          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border-l-4 border-l-primary-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedChild === 'all' ? t('totalChildren') : t('termsAnalyzed')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {selectedChild === 'all' ? connections.length : selectedTermCount}
              </p>
            </div>
            <div className="rounded-2xl border-l-4 border-l-secondary-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedChild === 'all' ? t('combinedBonus') : t('totalBonusLabel')}
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
                {selectedBonus.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border-l-4 border-l-amber-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('avgScoreAll')}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {overallAvg.toFixed(1)}
                <span className="text-sm font-normal text-neutral-400 ml-1">/ 100</span>
              </p>
            </div>
            <div className="rounded-2xl border-l-4 border-l-success-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedChild === 'all' ? t('mostActive') : t('termsAnalyzed')}
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {selectedChild === 'all' ? mostActive : selectedTermCount}
              </p>
            </div>
          </div>

          {/* Per-child summary cards (only when "All" is selected and multiple children) */}
          {selectedChild === 'all' && childSummaryCards.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childSummaryCards.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm text-left hover:border-primary-400 dark:hover:border-primary-600 transition-all hover:shadow-md group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: child.color }}
                    >
                      {child.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
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
                </button>
              ))}
            </div>
          )}

          {/* Charts Section */}
          {selectedChild === 'all' ? (
            <>
              {/* ── ALL CHILDREN VIEW ──────────────────────────────── */}

              {/* Comparative Bonus by Year */}
              {comparativeData.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    {t('comparativeBonus')}
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparativeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17,24,39,0.95)',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          fontSize: 13,
                          color: '#f3f4f6',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {childIds.map((id, idx) => (
                        <Bar
                          key={id}
                          dataKey={id}
                          name={childNames[id] || t('child')}
                          fill={CHILD_COLORS[idx % CHILD_COLORS.length]}
                          radius={[6, 6, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Score Trends */}
              {trendData.length > 1 && (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    {t('trendLines')}
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17,24,39,0.95)',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          fontSize: 13,
                          color: '#f3f4f6',
                        }}
                        formatter={(value: number) => [value.toFixed(1), '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {childIds.map((id, idx) => (
                        <Line
                          key={id}
                          type="monotone"
                          dataKey={id}
                          name={childNames[id] || t('child')}
                          stroke={CHILD_COLORS[idx % CHILD_COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 5, strokeWidth: 2 }}
                          activeDot={{ r: 7 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Subject Performance + Grade Distribution row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {subjectAggregates.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('subjectPerformanceLabel')}
                    </h2>
                    <SubjectPerformanceChart
                      data={subjectAggregates}
                      height={Math.max(200, subjectAggregates.length * 36)}
                    />
                  </div>
                )}

                {tierDistribution.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('gradeDistributionLabel')}
                    </h2>
                    <GradeDistributionChart data={tierDistribution} />
                  </div>
                )}
              </div>

              {/* Year-over-Year + Top/Bottom Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {yearOverYearChange !== null && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col items-center justify-center">
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
                  </div>
                )}

                {topSubjects.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                      {t('topSubjectsLabel')}
                    </h2>
                    <div className="space-y-2">
                      {topSubjects.map((s, i) => (
                        <div key={s.subject} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}.</span>
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
                  </div>
                )}

                {weakSubjects.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                      {t('weakSubjectsLabel')}
                    </h2>
                    <div className="space-y-2">
                      {weakSubjects.map((s, i) => (
                        <div key={s.subject} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}.</span>
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
                  </div>
                )}
              </div>

              {/* Subject Comparison Table */}
              {subjectTable.length > 0 && connections.length > 1 && (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
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
                              const val = (row as Record<string, unknown>)[id] as number | undefined
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
                </div>
              )}
            </>
          ) : (
            <>
              {/* ── SINGLE CHILD VIEW ─────────────────────────────── */}

              {/* Bonus Trend */}
              {childBonusTrend.length >= 2 && (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    {t('comparativeBonus')}
                  </h2>
                  <GradeTrendChart data={childBonusTrend} height={300} />
                </div>
              )}

              {/* Subject Performance + Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {subjectAggregates.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('subjectPerformanceLabel')}
                    </h2>
                    <SubjectPerformanceChart
                      data={subjectAggregates}
                      height={Math.max(200, subjectAggregates.length * 36)}
                    />
                  </div>
                )}

                {tierDistribution.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      {t('gradeDistributionLabel')}
                    </h2>
                    <GradeDistributionChart data={tierDistribution} />
                  </div>
                )}
              </div>

              {/* Term Comparison */}
              {childTermComparison.length > 1 && (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    {t('termComparisonLabel')}
                  </h2>
                  <TermComparisonChart data={childTermComparison} height={300} />
                </div>
              )}

              {/* Year-over-Year + Top/Bottom Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {yearOverYearChange !== null && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col items-center justify-center">
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
                  </div>
                )}

                {topSubjects.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                      {t('topSubjectsLabel')}
                    </h2>
                    <div className="space-y-2">
                      {topSubjects.map((s, i) => (
                        <div key={s.subject} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}.</span>
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
                  </div>
                )}

                {weakSubjects.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                      {t('weakSubjectsLabel')}
                    </h2>
                    <div className="space-y-2">
                      {weakSubjects.map((s, i) => (
                        <div key={s.subject} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}.</span>
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
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
