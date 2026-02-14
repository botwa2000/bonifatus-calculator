'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParentData } from '@/hooks/useParentData'
import { resolveLocalized } from '@/lib/i18n'
import { deriveTier, tierColor } from '@/lib/utils/grade-helpers'
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

  const childNames = useMemo(() => {
    const map: Record<string, string> = {}
    connections.forEach((c) => {
      map[c.child_id] = c.child?.full_name || t('child')
    })
    return map
  }, [connections, t])

  const overallAvg = useMemo(() => {
    let totalWeight = 0
    let totalWeighted = 0
    allChildTerms.forEach(({ term }) => {
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
  }, [allChildTerms])

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

  // Comparative bonus by year grouped by child
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

  // Trend lines per child
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

  // Subject comparison table
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

  const childIds = connections.map((c) => c.child_id)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-neutral-500">{tc('loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('insightsTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('insightsDesc')}</p>
      </header>

      {!gradesLoaded || connections.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
          <p className="text-neutral-500">{t('noInsightsData')}</p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500">{t('totalChildren')}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {connections.length}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500">{t('combinedBonus')}</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
                {combinedBonus.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500">{t('avgScoreAll')}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {overallAvg.toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs text-neutral-500">{t('mostActive')}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{mostActive}</p>
            </div>
          </div>

          {/* Comparative Bonus by Year */}
          {comparativeData.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                {t('comparativeBonus')}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: 13,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {childIds.map((id, idx) => (
                    <Bar
                      key={id}
                      dataKey={id}
                      name={childNames[id] || t('child')}
                      fill={CHILD_COLORS[idx % CHILD_COLORS.length]}
                      radius={[4, 4, 0, 0]}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: 13,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {childIds.map((id, idx) => (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={childNames[id] || t('child')}
                      stroke={CHILD_COLORS[idx % CHILD_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject Comparison Table */}
          {subjectTable.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                {t('subjectComparison')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">Subject</th>
                      {childIds.map((id) => (
                        <th key={id} className="text-center py-2 px-3 text-neutral-500 font-medium">
                          {childNames[id] || t('child')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjectTable.map((row) => (
                      <tr
                        key={row.subject}
                        className="border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <td className="py-2 px-3 font-medium text-neutral-900 dark:text-white">
                          {row.subject}
                        </td>
                        {childIds.map((id) => {
                          const val = (row as Record<string, unknown>)[id] as number | undefined
                          const score = val ?? 0
                          const tier = deriveTier(score)
                          return (
                            <td
                              key={id}
                              className="py-2 px-3 text-center font-semibold"
                              style={{ color: tierColor(tier) }}
                            >
                              {val !== undefined ? score.toFixed(1) : '-'}
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
      )}
    </div>
  )
}
