'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { resolveLocalized } from '@/lib/i18n'
import { useStudentData, Term } from '@/hooks/useStudentData'
import { formatDate, convertNormalizedToScale } from '@/lib/utils/grade-helpers'
import { BonusIcon } from '@/components/ui'

/* ------------------------------------------------------------------ */
/*  ViewTermModal                                                      */
/* ------------------------------------------------------------------ */

function ViewTermModal({
  term,
  locale,
  onClose,
}: {
  term: Term
  locale: string
  onClose: () => void
}) {
  const t = useTranslations('student')
  const tc = useTranslations('common')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {resolveLocalized(term.grading_systems?.name, locale) || t('gradingSystem')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {term.school_year} &middot; {term.term_type}
              {term.term_name ? ` \u00b7 ${term.term_name}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={tc('close')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Meta info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('schoolYear')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {term.school_year}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('termType')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {term.term_type}
                {term.term_name ? ` (${term.term_name})` : ''}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('classLevel')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {term.class_level}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('savedDate', { date: '' }).replace(/:?\s*$/, '')}
              </p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {formatDate(term.created_at)}
              </p>
            </div>
          </div>

          {/* Grading system info */}
          {term.grading_systems && (
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                {t('gradingSystem')}
              </p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {resolveLocalized(term.grading_systems.name, locale)}
                {term.grading_systems.code ? ` (${term.grading_systems.code})` : ''}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {t('scaleLabel', {
                  min: term.grading_systems.min_value ?? 0,
                  max: term.grading_systems.max_value ?? 100,
                })}
                {term.grading_systems.scale_type
                  ? ` \u00b7 ${term.grading_systems.scale_type}`
                  : ''}
                {term.grading_systems.best_is_highest === false
                  ? ` \u00b7 ${t('lowerIsBetter')}`
                  : ''}
              </p>
            </div>
          )}

          {/* Total bonus points */}
          <div className="flex items-center justify-between rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-5 py-4">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t('bonusPoints')}
            </p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-300 flex items-center gap-1">
              <BonusIcon className="w-5 h-5 text-primary-500" />
              {Number(term.total_bonus_points ?? 0).toFixed(2)}
            </p>
          </div>

          {/* Subject grades table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('subjectName')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('grade')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('weight')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('tier')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('bonusPoints')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {term.subject_grades.map((sub, idx) => (
                    <tr
                      key={sub.id}
                      className={
                        idx < term.subject_grades.length - 1
                          ? 'border-b border-neutral-100 dark:border-neutral-800'
                          : ''
                      }
                    >
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                        {resolveLocalized(sub.subjects?.name, locale) || 'Subject'}
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-700 dark:text-neutral-300">
                        {sub.grade_value ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-700 dark:text-neutral-300">
                        {Number(sub.subject_weight ?? 1).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <TierBadge tier={sub.grade_quality_tier} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600 dark:text-primary-300">
                        {Number(sub.bonus_points ?? 0) >= 0 ? '+' : ''}
                        {Number(sub.bonus_points ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report card image */}
          {term.report_card_image_url && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t('reportCardImage')}
              </p>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-800/30">
                <Image
                  src={term.report_card_image_url}
                  alt={t('reportCardImage')}
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-4 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {tc('close')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  TierBadge                                                          */
/* ------------------------------------------------------------------ */

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-neutral-400">-</span>

  const styles: Record<string, string> = {
    best: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    second: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    third: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    below: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[tier] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}
    >
      {tier}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

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
    loadTerms,
    locale,
  } = useStudentData()

  const [viewingTerm, setViewingTerm] = useState<Term | null>(null)

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
                      <button
                        onClick={() => setViewingTerm(term)}
                        className="px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-700 text-sm font-semibold text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        {tc('view')}
                      </button>
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
                            <p className="text-primary-600 dark:text-primary-300 font-semibold flex items-center gap-1">
                              <BonusIcon className="w-3.5 h-3.5 text-primary-500" />
                              {Number(sub.bonus_points ?? 0) >= 0 ? '+' : ''}
                              {Number(sub.bonus_points ?? 0).toFixed(2)}
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

      {/* View Term Modal */}
      {viewingTerm && (
        <ViewTermModal term={viewingTerm} locale={locale} onClose={() => setViewingTerm(null)} />
      )}
    </div>
  )
}
