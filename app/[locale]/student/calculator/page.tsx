'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { resolveLocalized } from '@/lib/i18n'
import { DemoCalculator } from '@/components/demo-calculator'
import { ReportCardScanner } from '@/components/scanner/ReportCardScanner'
import { ScanReviewPanel } from '@/components/scanner/ScanReviewPanel'
import { SegmentedControl } from '@/components/ui'
import type { ScanApiResult } from '@/components/scanner/ReportCardScanner'
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

type CalculatorConfig = {
  subjects: Array<{ id: string; name: string | Record<string, string>; categoryId?: string }>
  categories: Array<{ id: string; name: string | Record<string, string> }>
  gradingSystems: Array<{
    id: string
    name: string | Record<string, string> | null
    countryCode: string | null
  }>
  termTypes: {
    groups: Array<{ code: string; name: Record<string, string> }>
    types: Array<{ code: string; group: string; name: Record<string, string> }>
  } | null
}

type ScanMode = 'manual' | 'scanning' | 'reviewing'

export default function StudentCalculatorPage() {
  const t = useTranslations('student')
  const ts = useTranslations('scanner')
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const editTermId = searchParams.get('edit')
  const [prefill, setPrefill] = useState<TermPrefill | undefined>(undefined)
  const [loadingEdit, setLoadingEdit] = useState(!!editTermId)
  const [scanMode, setScanMode] = useState<ScanMode>('manual')
  const [scanResult, setScanResult] = useState<ScanApiResult | null>(null)
  const [config, setConfig] = useState<CalculatorConfig | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined)

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

  // Load config for scan review panel (subjects + categories)
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config/calculator')
        const data = await res.json()
        if (res.ok && data.success) {
          setConfig({
            subjects: data.subjects || [],
            categories: data.categories || [],
            gradingSystems: data.gradingSystems || [],
            termTypes: data.termTypes || null,
          })
          // Try to guess country from browser
          if (typeof navigator !== 'undefined') {
            const parts = navigator.language.split('-')
            if (parts.length > 1) {
              setSelectedCountry(parts[1].toUpperCase())
            }
          }
        }
      } catch {
        // ignore
      }
    }
    loadConfig()
  }, [])

  const handleScanComplete = useCallback((result: ScanApiResult) => {
    setScanResult(result)
    setScanMode('reviewing')
  }, [])

  const handleAcceptScan = useCallback(
    (data: {
      subjects: Array<{ subjectId: string; subjectName: string; grade: string; weight: number }>
      metadata: ScanApiResult['metadata']
      gradingSystemId: string
    }) => {
      const currentYear = new Date().getFullYear()
      setPrefill({
        gradingSystemId: data.gradingSystemId,
        classLevel: data.metadata.classLevel || 1,
        termType: data.metadata.termType || 'semester_2',
        schoolYear: data.metadata.schoolYear || `${currentYear}-${currentYear + 1}`,
        subjects: data.subjects.map((s, idx) => ({
          id: `scan-${idx}`,
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          grade: s.grade,
          weight: s.weight,
        })),
      })
      setScanMode('manual')
      setScanResult(null)
    },
    []
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('calculatorTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('calculatorDesc')}</p>
      </header>

      {/* Scan/Manual toggle */}
      {!editTermId && (
        <SegmentedControl
          value={scanMode === 'manual' ? 'manual' : 'scan'}
          onChange={(v) => {
            if (v === 'manual') {
              setScanMode('manual')
              setScanResult(null)
            } else {
              setScanMode('scanning')
            }
          }}
          options={[
            {
              value: 'manual',
              label: (
                <>
                  <span>&#9998;</span> {ts('enterManually')}
                </>
              ),
            },
            {
              value: 'scan',
              label: (
                <>
                  <span>&#128247;</span> {ts('scanReportCard')}
                </>
              ),
            },
          ]}
        />
      )}

      {loadingEdit ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-6 text-center">
          <p className="text-neutral-500">{t('loadingEdit') || 'Loading...'}</p>
        </div>
      ) : scanMode === 'scanning' ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6">
          <ReportCardScanner
            onScanComplete={handleScanComplete}
            onCancel={() => setScanMode('manual')}
            locale={locale}
            gradingSystemCountry={selectedCountry}
          />
        </div>
      ) : scanMode === 'reviewing' && scanResult && config ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-4 sm:p-6">
          <ScanReviewPanel
            scanResult={scanResult}
            subjects={config.subjects}
            categories={config.categories}
            gradingSystems={config.gradingSystems}
            suggestedGradingSystemId={
              config.gradingSystems.find(
                (gs) => gs.countryCode?.toUpperCase() === selectedCountry?.toUpperCase()
              )?.id
            }
            termTypes={config.termTypes}
            onAccept={handleAcceptScan}
            onScanAgain={() => {
              setScanResult(null)
              setScanMode('scanning')
            }}
            onCancel={() => {
              setScanResult(null)
              setScanMode('manual')
            }}
          />
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
