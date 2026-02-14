'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { resolveLocalized } from '@/lib/i18n'
import { DemoCalculator } from '@/components/demo-calculator'
import type { TermPrefill } from '@/hooks/useStudentData'

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
}

export default function StudentCalculatorPage() {
  const t = useTranslations('student')
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const editTermId = searchParams.get('edit')
  const [prefill, setPrefill] = useState<TermPrefill | undefined>(undefined)
  const [loadingEdit, setLoadingEdit] = useState(!!editTermId)

  useEffect(() => {
    if (!editTermId) return
    async function loadTerm() {
      try {
        const res = await fetch('/api/grades/list')
        const data = await res.json()
        if (!res.ok || !data.success) return
        const term = (data.terms as Term[]).find((t) => t.id === editTermId)
        if (!term) return
        const subjects =
          term.subject_grades?.map((s) => ({
            id: crypto.randomUUID(),
            subjectId: s.subject_id || undefined,
            subjectName: resolveLocalized(s.subjects?.name, locale) || 'Subject',
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
      } catch {
        // ignore
      } finally {
        setLoadingEdit(false)
      }
    }
    loadTerm()
  }, [editTermId, locale])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('calculatorTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('calculatorDesc')}</p>
      </header>

      {loadingEdit ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-6 text-center">
          <p className="text-neutral-500">{t('loadingEdit') || 'Loading...'}</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6">
          <DemoCalculator
            allowSample={false}
            initialData={prefill}
            onSaved={() => {
              setPrefill(undefined)
              router.push('/student/saved')
            }}
          />
        </div>
      )}
    </div>
  )
}
