'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { resolveLocalized } from '@/lib/i18n'
import { useStudentData } from '@/hooks/useStudentData'
import { formatDate, convertNormalizedToScale } from '@/lib/utils/grade-helpers'

export default function StudentSavedPage() {
  const t = useTranslations('student')
  const tc = useTranslations('common')
  const {
    loading,
    error,
    sessionExpired,
    filteredTerms,
    years,
    selectedYear,
    setSelectedYear,
    selectedTermType,
    setSelectedTermType,
    expandedTerm,
    setExpandedTerm,
    handleDelete,
    handleEdit,
    loadTerms,
    locale,
  } = useStudentData()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            {t('savedTitle')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('savedDesc')}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
          >
            <option value="all">{t('allYears')}</option>
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
            <option value="all">{t('allTerms')}</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="semester">Semester</option>
            <option value="quarterly">Quarter</option>
          </select>
          <button
            onClick={loadTerms}
            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
          >
            {tc('refresh')}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}{' '}
          {sessionExpired && (
            <button
              onClick={() => (window.location.href = '/login')}
              className="underline font-semibold"
            >
              {t('signInLink')}
            </button>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6 space-y-4">
        {loading ? (
          <p className="text-neutral-600 dark:text-neutral-300 text-sm">{tc('loading')}</p>
        ) : filteredTerms.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('noSavedResults')}</p>
            <Link
              href="/student/calculator"
              className="inline-block text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
            >
              {t('newCalculation')} &rarr;
            </Link>
          </div>
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
                      {term.school_year} &middot; {term.term_type}
                      {term.term_name ? ` \u00b7 ${term.term_name}` : ''}
                    </p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {resolveLocalized(term.grading_systems?.name, locale) || t('gradingSystem')}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t('savedDate', { date: formatDate(term.created_at) })}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t('subjectsAvgScore', {
                        count: term.subject_grades.length,
                        score: (() => {
                          const totals = term.subject_grades.reduce(
                            (acc, sg) => {
                              const w = Number(sg.subject_weight ?? 1)
                              const n = Number(sg.grade_normalized_100 ?? 0)
                              acc.weighted += n * w
                              acc.weight += w
                              return acc
                            },
                            { weighted: 0, weight: 0 }
                          )
                          const avgNorm = totals.weight > 0 ? totals.weighted / totals.weight : 0
                          const avgRaw = convertNormalizedToScale(term.grading_systems, avgNorm)
                          const max = term.grading_systems?.max_value
                          return `${avgRaw.toFixed(2)}${max ? ` / ${Number(max)}` : ''}`
                        })(),
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">{t('bonusPoints')}</p>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-300">
                        {Number(term.total_bonus_points ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/student/calculator?edit=${term.id}`}
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500"
                      >
                        {tc('edit')}
                      </Link>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="px-3 py-1.5 rounded-lg border border-error-200 text-sm font-semibold text-error-600 hover:bg-error-50"
                      >
                        {tc('delete')}
                      </button>
                      <button
                        onClick={() =>
                          setExpandedTerm((prev) => (prev === term.id ? null : term.id))
                        }
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-800 dark:text-white"
                      >
                        {expandedTerm === term.id ? tc('hide') : tc('details')}
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
                              {resolveLocalized(sub.subjects?.name, locale) || 'Subject'}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {t('gradeLabel', {
                                value: sub.grade_value ?? '-',
                                weight: Number(sub.subject_weight ?? 1).toFixed(1),
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500">{t('bonus')}</p>
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
    </div>
  )
}
