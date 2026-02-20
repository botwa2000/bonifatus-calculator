'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { resolveLocalized } from '@/lib/i18n'
import { Button, Badge, Input, Label, SubjectCombobox } from '@/components/ui'
import type { BadgeVariant } from '@/components/ui'
import type { ScanApiResult } from './ReportCardScanner'

type SubjectOption = {
  id: string
  name: string | Record<string, string>
  categoryId?: string
}

type CategoryOption = {
  id: string
  name: string | Record<string, string>
}

type GradingSystemOption = {
  id: string
  name: string | Record<string, string> | null
  countryCode: string | null
}

type ReviewSubject = {
  originalName: string
  grade: string
  matchedSubjectId?: string
  matchedSubjectName?: string
  matchConfidence: 'high' | 'medium' | 'low' | 'none'
  excluded: boolean
}

type TermTypeConfig = {
  groups: Array<{ code: string; name: Record<string, string> }>
  types: Array<{ code: string; group: string; name: Record<string, string> }>
} | null

type ScanReviewPanelProps = {
  scanResult: ScanApiResult
  subjects: SubjectOption[]
  categories: CategoryOption[]
  gradingSystems: GradingSystemOption[]
  suggestedGradingSystemId?: string
  termTypes: TermTypeConfig
  onAccept: (data: {
    subjects: Array<{
      subjectId: string
      subjectName: string
      grade: string
      weight: number
    }>
    metadata: ScanApiResult['metadata']
    gradingSystemId: string
  }) => void
  onScanAgain: () => void
  onCancel: () => void
}

const confidenceBadgeVariant: Record<string, BadgeVariant> = {
  high: 'success',
  medium: 'warning',
  low: 'warning',
  none: 'danger',
}

const confidenceBorderColor: Record<string, string> = {
  high: 'border-green-400 dark:border-green-600',
  medium: 'border-yellow-400 dark:border-yellow-600',
  low: 'border-orange-400 dark:border-orange-600',
  none: 'border-red-400 dark:border-red-600',
}

export function ScanReviewPanel({
  scanResult,
  subjects: allSubjects,
  categories,
  gradingSystems,
  suggestedGradingSystemId,
  termTypes,
  onAccept,
  onScanAgain,
  onCancel,
}: ScanReviewPanelProps) {
  const t = useTranslations('scanner')
  const locale = useLocale()

  const [reviewSubjects, setReviewSubjects] = useState<ReviewSubject[]>(
    scanResult.subjects.map((s) => ({
      ...s,
      excluded: false,
    }))
  )
  const [metadata, setMetadata] = useState(scanResult.metadata)
  const [gradingSystemId, setGradingSystemId] = useState(suggestedGradingSystemId || '')

  const handleSubjectChange = (index: number, subjectId: string) => {
    const subj = allSubjects.find((s) => s.id === subjectId)
    setReviewSubjects((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              matchedSubjectId: subjectId,
              matchedSubjectName: subj ? resolveLocalized(subj.name, locale) : '',
              matchConfidence: 'high',
            }
          : r
      )
    )
  }

  const handleGradeChange = (index: number, grade: string) => {
    setReviewSubjects((prev) => prev.map((r, i) => (i === index ? { ...r, grade } : r)))
  }

  const handleToggleExclude = (index: number) => {
    setReviewSubjects((prev) =>
      prev.map((r, i) => (i === index ? { ...r, excluded: !r.excluded } : r))
    )
  }

  const handleAccept = () => {
    const accepted = reviewSubjects
      .filter((r) => !r.excluded && r.matchedSubjectId)
      .map((r) => ({
        subjectId: r.matchedSubjectId!,
        subjectName: r.matchedSubjectName || r.originalName,
        grade: r.grade,
        weight: 1,
      }))
    onAccept({ subjects: accepted, metadata, gradingSystemId })
  }

  const termTypeGroups = useMemo(() => {
    if (!termTypes?.groups || !termTypes?.types) return null
    return termTypes.groups.map((group) => ({
      code: group.code,
      label: resolveLocalized(group.name, locale),
      types: termTypes.types
        .filter((tt) => tt.group === group.code)
        .map((tt) => ({
          value: tt.code,
          label: resolveLocalized(tt.name, locale),
        })),
    }))
  }, [termTypes, locale])

  const gradingSystemOptions = gradingSystems.map((gs) => ({
    value: gs.id,
    label: resolveLocalized(gs.name, locale),
  }))

  const matchedCount = reviewSubjects.filter((r) => r.matchedSubjectId && !r.excluded).length
  const totalCount = reviewSubjects.filter((r) => !r.excluded).length

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('reviewTitle')}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('reviewDescription')}</p>
      </div>

      {/* Metadata section */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          {t('extractedInfo')}
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>{t('studentName')}</Label>
            <Input
              value={metadata.studentName || ''}
              onChange={(e) => setMetadata((m) => ({ ...m, studentName: e.target.value }))}
              placeholder={t('studentName')}
              className="mt-1 !py-1.5"
            />
          </div>
          <div>
            <Label>{t('schoolName')}</Label>
            <Input
              value={metadata.schoolName || ''}
              onChange={(e) => setMetadata((m) => ({ ...m, schoolName: e.target.value }))}
              placeholder={t('schoolName')}
              className="mt-1 !py-1.5"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>{t('schoolYear')}</Label>
            <Input
              value={metadata.schoolYear || ''}
              onChange={(e) => setMetadata((m) => ({ ...m, schoolYear: e.target.value }))}
              placeholder="2025-2026"
              className="mt-1 !py-1.5"
            />
          </div>
          <div>
            <Label>{t('classLevel')}</Label>
            <Input
              type="number"
              min={1}
              max={13}
              value={metadata.classLevel ?? ''}
              onChange={(e) =>
                setMetadata((m) => ({
                  ...m,
                  classLevel: parseInt(e.target.value) || undefined,
                }))
              }
              className="mt-1 !py-1.5"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>{t('termType')}</Label>
            <select
              value={metadata.termType || 'semester_2'}
              onChange={(e) =>
                setMetadata((m) => ({
                  ...m,
                  termType: e.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-primary-500 transition-colors"
            >
              {termTypeGroups ? (
                termTypeGroups.map((group) => (
                  <optgroup key={group.code} label={group.label}>
                    {group.types.map((tt) => (
                      <option key={tt.value} value={tt.value}>
                        {tt.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                <>
                  <option value="semester_2">{t('final')}</option>
                  <option value="semester_1">{t('midterm')}</option>
                </>
              )}
            </select>
          </div>
          <div>
            <Label>{t('gradingSystem')}</Label>
            <select
              value={gradingSystemId}
              onChange={(e) => setGradingSystemId(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">{t('selectGradingSystem')}</option>
              {gradingSystemOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subjects table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {t('extractedSubjects')} ({matchedCount}/{totalCount})
          </h4>
          <Badge variant={scanResult.overallConfidence > 70 ? 'success' : 'warning'}>
            {t('confidence')}: {Math.round(scanResult.overallConfidence)}%
          </Badge>
        </div>

        {reviewSubjects.map((row, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-12 gap-2 items-center rounded-xl border-2 px-3 py-2 transition-opacity ${
              row.excluded ? 'opacity-40' : ''
            } ${confidenceBorderColor[row.matchConfidence]} bg-white dark:bg-neutral-900`}
          >
            {/* Original name */}
            <div
              className="col-span-3 text-sm text-neutral-700 dark:text-neutral-300 truncate"
              title={row.originalName}
            >
              {row.originalName}
            </div>

            {/* Subject picker */}
            <div className="col-span-4">
              <SubjectCombobox
                subjects={allSubjects}
                categories={categories}
                value={row.matchedSubjectId}
                onChange={(subjectId) => handleSubjectChange(idx, subjectId)}
                placeholder={t('matchSubject')}
                disabled={row.excluded}
                locale={locale}
                compact
              />
            </div>

            {/* Grade */}
            <div className="col-span-2">
              <Input
                value={row.grade}
                onChange={(e) => handleGradeChange(idx, e.target.value)}
                disabled={row.excluded}
                className="!py-1.5 !px-2"
              />
            </div>

            {/* Confidence badge */}
            <div className="col-span-2 text-center">
              <Badge variant={confidenceBadgeVariant[row.matchConfidence]}>
                {row.matchConfidence === 'high'
                  ? t('matched')
                  : row.matchConfidence === 'none'
                    ? t('unmatched')
                    : t('lowConfidence')}
              </Badge>
            </div>

            {/* Exclude toggle */}
            <div className="col-span-1 text-center">
              <button
                type="button"
                onClick={() => handleToggleExclude(idx)}
                className="text-neutral-400 hover:text-red-500 text-lg transition-colors"
                title={row.excluded ? t('include') : t('exclude')}
              >
                {row.excluded ? '+' : '\u00d7'}
              </button>
            </div>
          </div>
        ))}

        {reviewSubjects.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-4">{t('unmatched')}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button variant="secondary" onClick={onScanAgain}>
          {t('retry')}
        </Button>
        <Button onClick={handleAccept} disabled={matchedCount === 0}>
          {t('useResults')} ({matchedCount})
        </Button>
      </div>
    </div>
  )
}
