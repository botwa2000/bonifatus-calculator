'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveLocalized } from '@/lib/i18n'
import { Button, Select, Accordion, FormField, Tooltip } from '@/components/ui'

type GradeDefinition = {
  grade?: string
  normalized_100?: number
  numeric_value?: number
  quality_tier?: string
}

type GradingSystem = {
  id: string
  code: string | null
  name: string | Record<string, string> | null
  description: string | Record<string, string> | null
  countryCode: string | null
  scaleType: string
  bestIsHighest: boolean
  minValue: number | null
  maxValue: number | null
  passingThreshold: number | null
  gradeDefinitions: GradeDefinition[] | null
  displayOrder: number | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

type Factor = {
  factorType: string
  factorKey: string
  factorValue: number
  description: string | null
}

type Subject = {
  id: string
  name: string | Record<string, string>
  categoryId?: string
  isCoreSubject?: boolean
}

type SubjectEntry = {
  id: string
  subjectId?: string
  subjectName: string
  grade: string
  weight: number
  isCoreSubject?: boolean
}

type CalculatorConfig = {
  gradingSystems: GradingSystem[]
  bonusFactorDefaults: Factor[]
  subjects: Subject[]
  categories: Array<{ id: string; name: string | Record<string, string> }>
}

type CalculationResult = {
  total: number
  averageNormalized: number
  subjectCount: number
  breakdown: Array<{
    subject: string
    normalized: number
    tier: string
    bonus: number
  }>
}

type CalculatorDraft = {
  gradingSystemId?: string
  classLevel: number
  termType: string
  schoolYear: string
  termName?: string
  subjects: SubjectEntry[]
  updatedAt: number
}

// resolveLocalized imported from @/lib/i18n

function getFactorValue(factors: Factor[], type: string, key: string, fallback?: number) {
  const found = factors.find((f) => f.factorType === type && f.factorKey === key)
  return found ? Number(found.factorValue) : fallback
}

function deriveTierFromDefinitions(system: GradingSystem, grade: string) {
  const def = system.gradeDefinitions?.find(
    (g) => (g.grade ?? '').toLowerCase() === grade.trim().toLowerCase()
  )
  if (def?.quality_tier) return def.quality_tier
  return 'below'
}

function normalizeGrade(system: GradingSystem, grade: string) {
  if (!grade) return 0
  if (system.scaleType === 'percentage') {
    const val = Number(grade)
    if (Number.isNaN(val)) return 0
    return Math.min(Math.max(val, 0), 100)
  }

  const def = system.gradeDefinitions?.find(
    (g) => (g.grade ?? '').toLowerCase() === grade.trim().toLowerCase()
  )
  if (def?.normalized_100 != null) return Number(def.normalized_100)

  return 0
}

function convertNormalizedToScale(system: GradingSystem | null, normalized: number) {
  if (!system) return normalized
  const min = Number(system.minValue ?? 0)
  const max = Number(system.maxValue ?? 100)
  if (max === min) return normalized
  if (system.bestIsHighest === false) {
    return max - (normalized / 100) * (max - min)
  }
  return min + (normalized / 100) * (max - min)
}

// NEW SIMPLIFIED FORMULA: class_level × term_factor × grade_factor, floored at 0
function calculateBonus(
  system: GradingSystem | null,
  factors: Factor[],
  classLevel: number,
  termType: string,
  subjects: SubjectEntry[]
): CalculationResult {
  if (!system)
    return {
      total: 0,
      averageNormalized: 0,
      subjectCount: subjects.length,
      breakdown: [],
    }

  let totalWeightedNormalized = 0
  let totalWeight = 0

  // Get term factor from DB or use defaults
  const termFactor = getFactorValue(factors, 'term_type', termType, 1) ?? 1

  // Grade factors: best=2, second=1, third=0, below=-1
  const getGradeFactor = (tier: string) => {
    const value = getFactorValue(factors, 'grade_tier', tier)
    if (value !== undefined) return value
    const defaults: Record<string, number> = { best: 2, second: 1, third: 0, below: -1 }
    return defaults[tier] ?? -1
  }

  const breakdown = subjects.map((subject) => {
    const normalized = normalizeGrade(system, subject.grade)
    const tier = deriveTierFromDefinitions(system, subject.grade)
    const gradeFactor = getGradeFactor(tier)
    const weight = Number(subject.weight) || 1

    // Formula: class_level × term_factor × grade_factor × weight
    const rawBonus = classLevel * termFactor * gradeFactor * weight
    const bonus = Math.max(0, rawBonus)

    totalWeightedNormalized += normalized * weight
    totalWeight += weight

    return {
      subject: subject.subjectName || 'Subject',
      normalized,
      tier,
      bonus,
    }
  })

  const sum = breakdown.reduce((acc, item) => acc + item.bonus, 0)
  const averageNormalized =
    totalWeight > 0 ? Number((totalWeightedNormalized / totalWeight).toFixed(2)) : 0
  return {
    total: sum,
    averageNormalized,
    subjectCount: subjects.length,
    breakdown,
  }
}

function getSampleData(
  config: CalculatorConfig,
  locale: string = 'en'
): {
  systemId?: string
  classLevel: number
  termType: string
  subjects: SubjectEntry[]
} {
  const systemPool = config.gradingSystems
  const subjectPool = config.subjects
  const pickRandom = <T,>(arr: T[]): T | undefined =>
    arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined
  const sampleSystem = pickRandom(systemPool)
  const shuffled = [...subjectPool].sort(() => Math.random() - 0.5)
  const sampleSubjects = shuffled.slice(0, Math.min(5, shuffled.length))

  const randomGrade = (system: GradingSystem | undefined) => {
    if (!system) return ''
    if (system.scaleType === 'percentage') {
      return Math.floor(60 + Math.random() * 40).toString()
    }
    const defs = system.gradeDefinitions || []
    if (defs.length) {
      return pickRandom(defs)?.grade || ''
    }
    return ''
  }

  return {
    systemId: sampleSystem?.id,
    classLevel: Math.floor(1 + Math.random() * 12),
    termType: 'final',
    subjects: sampleSubjects.map((s, idx) => ({
      id: `${idx}`,
      subjectId: s.id,
      subjectName: resolveLocalized(s.name, locale) || `Subject ${idx + 1}`,
      grade: randomGrade(sampleSystem),
      weight: 1, // Always 1 for demo
      isCoreSubject: s.isCoreSubject ?? false,
    })),
  }
}

function guessCountryCode() {
  if (typeof navigator === 'undefined') return undefined
  const locale = navigator.language || ''
  const parts = locale.split('-')
  if (parts.length > 1) return parts[1]?.toUpperCase()
  return undefined
}

type DemoCalculatorProps = {
  allowSample?: boolean
  isDemo?: boolean // Demo mode: weights are fixed at 1 and not editable
  onSaved?: (payload: {
    termId?: string
    totalBonusPoints: number
    schoolYear: string
    termType: string
    termName?: string
  }) => void
  initialData?: {
    termId?: string
    gradingSystemId: string
    classLevel: number
    termType: string
    schoolYear: string
    termName?: string
    subjects: SubjectEntry[]
  }
}

export function DemoCalculator({
  allowSample = true,
  isDemo = true,
  onSaved,
  initialData,
}: DemoCalculatorProps = {}) {
  const locale = useLocale()
  const t = useTranslations('calculator')
  const tc = useTranslations('common')
  const currentYear = new Date().getFullYear()
  const defaultSchoolYear = `${currentYear}-${currentYear + 1}`

  const [settingsOpen, setSettingsOpen] = useState(true)
  const [subjectsOpen, setSubjectsOpen] = useState(true)
  const [resultsOpen, setResultsOpen] = useState(true)

  const [config, setConfig] = useState<CalculatorConfig>({
    gradingSystems: [],
    bonusFactorDefaults: [],
    subjects: [],
    categories: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [preferredSystemId, setPreferredSystemId] = useState<string | undefined>(undefined)
  const [suggestedSystemId, setSuggestedSystemId] = useState<string | undefined>(undefined)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftStatus, setDraftStatus] = useState<string | null>(null)

  const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>(
    initialData?.gradingSystemId
  )
  const [classLevel, setClassLevel] = useState(initialData?.classLevel ?? 1)
  const [termType, setTermType] = useState(initialData?.termType ?? 'final')
  const [schoolYear, setSchoolYear] = useState(initialData?.schoolYear ?? defaultSchoolYear)
  const [termName, setTermName] = useState(initialData?.termName ?? '')
  const [subjectRows, setSubjectRows] = useState<SubjectEntry[]>(
    initialData?.subjects?.length
      ? initialData.subjects
      : [
          {
            id: '0',
            subjectId: undefined,
            subjectName: '',
            grade: '',
            weight: 1,
          },
        ]
  )
  const [editingTermId, setEditingTermId] = useState<string | undefined>(initialData?.termId)
  const [subjectFilters, setSubjectFilters] = useState<Record<string, string>>({})
  const [pickerOpen, setPickerOpen] = useState<Record<string, boolean>>({})
  const draftLoadedRef = useRef(false)
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftKey = useMemo(() => `calculator-draft-${userEmail || 'guest'}`, [userEmail])
  const defaultSystemKey = useMemo(
    () => `calculator-default-system-${userEmail || 'guest'}`,
    [userEmail]
  )
  const selectedSubjectIds = useMemo(
    () => new Set(subjectRows.map((r) => r.subjectId).filter(Boolean) as string[]),
    [subjectRows]
  )

  const sortedGradingSystems = useMemo(
    () =>
      config.gradingSystems
        .slice()
        .sort(
          (a, b) =>
            (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
            resolveLocalized(a.name, locale).localeCompare(resolveLocalized(b.name, locale))
        ),
    [config.gradingSystems, locale]
  )

  const selectedSystem = useMemo(
    () => sortedGradingSystems.find((g) => g.id === selectedSystemId) || sortedGradingSystems[0],
    [sortedGradingSystems, selectedSystemId]
  )

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config/calculator')
        if (!res.ok) throw new Error('Failed to load calculator config')
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load calculator config')
        const countryGuess = guessCountryCode()
        const storedDefault =
          typeof window !== 'undefined' ? localStorage.getItem(defaultSystemKey) : null
        setConfig({
          gradingSystems: data.gradingSystems || [],
          bonusFactorDefaults: data.bonusFactorDefaults || [],
          subjects: data.subjects || [],
          categories: data.categories || [],
        })
        const countrySuggested = countryGuess
          ? data.gradingSystems?.find(
              (gs: GradingSystem) =>
                (gs.countryCode || '').toUpperCase() === (countryGuess || '').toUpperCase()
            )?.id
          : undefined
        if (storedDefault) {
          setPreferredSystemId(storedDefault)
        }
        if (countrySuggested) {
          setSuggestedSystemId(countrySuggested)
        }
        const resolvedSystemId =
          initialData?.gradingSystemId ||
          storedDefault ||
          countrySuggested ||
          data.gradingSystems?.[0]?.id
        if (resolvedSystemId) {
          setSelectedSystemId(resolvedSystemId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calculator config')
      } finally {
        setLoading(false)
      }
    }

    async function loadUser() {
      try {
        const { getSession } = await import('next-auth/react')
        const session = await getSession()
        setUserEmail(session?.user?.email ?? null)
      } catch {
        setUserEmail(null)
      }
    }

    loadConfig()
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    draftLoadedRef.current = false
  }, [draftKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedDefault = localStorage.getItem(defaultSystemKey)
    if (storedDefault) {
      setPreferredSystemId(storedDefault)
      if (!selectedSystemId) {
        setSelectedSystemId(storedDefault)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSystemKey])

  useEffect(() => {
    if (!initialData) return
    setEditingTermId(initialData.termId)
    setSelectedSystemId(initialData.gradingSystemId)
    setClassLevel(initialData.classLevel)
    setTermType(initialData.termType)
    setSchoolYear(initialData.schoolYear)
    setTermName(initialData.termName ?? '')
    setSubjectRows(
      initialData.subjects.map((s, idx) => ({
        ...s,
        id: s.id || `${idx}`,
      }))
    )
  }, [initialData])

  useEffect(() => {
    if (selectedSystemId) return
    const candidate =
      initialData?.gradingSystemId ||
      preferredSystemId ||
      suggestedSystemId ||
      sortedGradingSystems[0]?.id
    if (candidate) {
      setSelectedSystemId(candidate)
    }
  }, [initialData, preferredSystemId, selectedSystemId, sortedGradingSystems, suggestedSystemId])

  useEffect(() => {
    if (draftLoadedRef.current) return
    if (initialData?.termId) return
    if (loading) return
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(draftKey)
    if (!raw) return
    try {
      const parsed: CalculatorDraft = JSON.parse(raw)
      setSelectedSystemId(
        parsed.gradingSystemId || selectedSystemId || sortedGradingSystems[0]?.id || undefined
      )
      setClassLevel(parsed.classLevel || classLevel)
      setTermType(parsed.termType || termType)
      setSchoolYear(parsed.schoolYear || schoolYear)
      setTermName(parsed.termName || '')
      if (parsed.subjects?.length) {
        setSubjectRows(parsed.subjects.map((s) => ({ ...s, weight: isDemo ? 1 : s.weight })))
      }
      setDraftRestored(true)
      setDraftStatus(t('draftRestored'))
      setSettingsOpen(false)
      draftLoadedRef.current = true
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, initialData, loading, sortedGradingSystems, isDemo])

  const calcResult = useMemo(
    () =>
      calculateBonus(
        selectedSystem ?? null,
        config.bonusFactorDefaults,
        classLevel,
        termType,
        subjectRows
      ),
    [selectedSystem, config.bonusFactorDefaults, classLevel, termType, subjectRows]
  )

  useEffect(() => {
    if (loading) return
    if (typeof window === 'undefined') return
    if (draftSaveTimer.current) {
      clearTimeout(draftSaveTimer.current)
    }
    draftSaveTimer.current = setTimeout(() => {
      const draft: CalculatorDraft = {
        gradingSystemId: selectedSystemId,
        classLevel,
        termType,
        schoolYear,
        termName,
        subjects: subjectRows,
        updatedAt: Date.now(),
      }
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft))
        setDraftStatus(t('draftSaved'))
      } catch {
        // ignore storage errors
      }
    }, 600)
    return () => {
      if (draftSaveTimer.current) {
        clearTimeout(draftSaveTimer.current)
      }
    }
  }, [classLevel, draftKey, loading, schoolYear, selectedSystemId, subjectRows, termName, termType])

  const addRow = () => {
    setSubjectRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), subjectName: '', grade: '', weight: 1 },
    ])
  }

  const resolveSubjectId = (name: string | undefined) => {
    if (!name) return undefined
    const found = config.subjects.find(
      (s) => resolveLocalized(s.name, locale).toLowerCase() === name.trim().toLowerCase()
    )
    return found?.id
  }

  const getFilteredSubjectsByCategory = useMemo(() => {
    return (filterRaw: string) => {
      const filter = filterRaw.trim().toLowerCase()
      const grouped: Record<
        string,
        { categoryName: string; items: Array<{ id: string; label: string }> }
      > = {}

      config.categories.forEach((cat) => {
        const catName = resolveLocalized(cat.name, locale)
        const items = config.subjects
          .filter((s) => s.categoryId === cat.id)
          .map((s) => ({
            id: s.id,
            label: resolveLocalized(s.name, locale),
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        const filteredItems = filter
          ? items.filter((item) => item.label.toLowerCase().includes(filter))
          : items

        if (filteredItems.length) {
          grouped[cat.id] = { categoryName: catName, items: filteredItems }
        }
      })
      return grouped
    }
  }, [config.categories, config.subjects, locale])

  const updateRow = (id: string, field: keyof SubjectEntry, value: string | number) => {
    setSubjectRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const removeRow = (id: string) => {
    setSubjectRows((prev) => prev.filter((row) => row.id !== id))
  }

  const applySample = () => {
    const sample = getSampleData(config, locale)
    setSelectedSystemId(sample.systemId)
    setClassLevel(sample.classLevel)
    setTermType(sample.termType)
    setSubjectRows(sample.subjects.map((s) => ({ ...s, subjectId: s.subjectId })))
  }

  const canSave =
    !!userEmail &&
    !!selectedSystem &&
    subjectRows.every((row) => row.subjectId || resolveSubjectId(row.subjectName))

  const handleSetDefaultSystem = () => {
    if (!selectedSystem) return
    try {
      localStorage.setItem(defaultSystemKey, selectedSystem.id)
      setPreferredSystemId(selectedSystem.id)
      setDraftStatus(t('savedAsDefault'))
    } catch {
      setSaveError(t('couldNotStoreDefault'))
    }
  }

  const handleSave = async () => {
    setSaveMessage(null)
    setSaveError(null)
    if (!userEmail) {
      window.location.href = `/register?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    if (!selectedSystem) {
      setSaveError(t('selectSystemFirst'))
      return
    }
    const subjectPayload = subjectRows.map((row) => {
      const sid = row.subjectId || resolveSubjectId(row.subjectName || '')
      return {
        subjectId: sid || '',
        subjectName: row.subjectName,
        grade: row.grade,
        weight: row.weight,
      }
    })
    if (subjectPayload.some((s) => !s.subjectId)) {
      setSaveError(t('pickSubjects'))
      return
    }
    setSaving(true)
    try {
      const endpoint = editingTermId ? '/api/grades/update' : '/api/grades/save'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termId: editingTermId,
          gradingSystemId: selectedSystem.id,
          classLevel,
          termType,
          schoolYear,
          termName: termName || undefined,
          subjects: subjectPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setSaveError(data.error || 'Failed to save')
        return
      }
      setSaveMessage(t('saved'))
      setEditingTermId(undefined)
      try {
        localStorage.removeItem(draftKey)
        setDraftRestored(false)
        setDraftStatus(null)
      } catch {
        // ignore storage cleanup errors
      }
      onSaved?.({
        termId: data.termId,
        totalBonusPoints: data.totalBonusPoints,
        schoolYear,
        termType,
        termName: termName || undefined,
      })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Select options
  const gradingSystemOptions = sortedGradingSystems.map((gs) => ({
    value: gs.id,
    label: resolveLocalized(gs.name, locale),
  }))

  const termTypeOptions = [
    { value: 'midterm', label: t('midterm') },
    { value: 'final', label: t('final') },
    { value: 'semester', label: t('semester') },
    { value: 'quarterly', label: t('quarterly') },
  ]

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          {userEmail ? (
            <span className="font-semibold text-neutral-800 dark:text-white">
              {t('loggedInAs', { email: userEmail })}{' '}
              <span className="font-normal text-neutral-600 dark:text-neutral-400">
                {t('savesToProfile')}
              </span>
            </span>
          ) : (
            t('demoMode')
          )}
        </div>
        {allowSample && (
          <button
            onClick={applySample}
            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
          >
            {t('loadSample')}
          </button>
        )}
      </div>

      {loading && <p className="text-neutral-600 dark:text-neutral-300">{t('loadingSettings')}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">Error: {error}</p>}

      {!loading && !error && selectedSystem && (
        <div className="space-y-4">
          <Accordion
            title={t('settings')}
            open={settingsOpen}
            onToggle={() => setSettingsOpen((v) => !v)}
          >
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Select
                    label={t('gradingSystem')}
                    tooltip={t('gradingSystemTooltip')}
                    value={selectedSystem?.id}
                    onChange={(e) => setSelectedSystemId(e.target.value)}
                    options={gradingSystemOptions}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSetDefaultSystem}
                      className="rounded-full border border-neutral-300 px-3 py-1 font-semibold text-neutral-700 transition hover:border-primary-400 hover:text-primary-700 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-primary-500 dark:hover:text-primary-200"
                    >
                      {t('setAsDefault')}
                    </button>
                    {preferredSystemId && preferredSystemId === selectedSystem?.id && (
                      <span className="rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/30 dark:text-primary-200">
                        {t('default')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <FormField label={t('classLevel')} tooltip={t('classLevelTooltip')}>
                    <input
                      type="number"
                      min={1}
                      max={13}
                      step={1}
                      value={classLevel}
                      onChange={(e) => setClassLevel(Number(e.target.value) || 1)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </FormField>
                  <Select
                    label={t('termType')}
                    tooltip={t('termTypeTooltip')}
                    value={termType}
                    onChange={(e) => setTermType(e.target.value)}
                    options={termTypeOptions}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <FormField label={t('schoolYear')} tooltip={t('schoolYearTooltip')}>
                  <input
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    placeholder={t('schoolYearPlaceholder')}
                    className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                  />
                </FormField>
                <FormField label={t('termName')} tooltip={t('termNameTooltip')}>
                  <input
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                    placeholder={t('termNamePlaceholder')}
                    className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                  />
                </FormField>
              </div>
            </div>
          </Accordion>

          <Accordion
            title={t('subjectsAndGrades')}
            open={subjectsOpen}
            onToggle={() => setSubjectsOpen((v) => !v)}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {t('subjectRows')}
                </h4>
                <button
                  onClick={addRow}
                  className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
                >
                  {t('addSubject')}
                </button>
              </div>

              {/* Column headers */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                <div className="lg:col-span-5 flex items-center gap-1">
                  {t('subject')}
                  <Tooltip content={t('subjectTooltip')} />
                </div>
                <div className="lg:col-span-3 flex items-center gap-1">
                  {t('grade')}
                  <Tooltip content={t('gradeTooltip')} />
                </div>
                <div className="lg:col-span-3 flex items-center gap-1">
                  {t('weight')}
                  <Tooltip content={t('weightTooltip')} />
                </div>
                <div className="lg:col-span-1"></div>
              </div>

              <div className="space-y-2">
                {subjectRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-3 overflow-hidden"
                  >
                    <div className="lg:col-span-5 space-y-2">
                      <div className="lg:hidden flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {t('subject')}
                        <Tooltip content={t('subjectTooltip')} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          placeholder={row.subjectName || t('searchSubject')}
                          value={subjectFilters[row.id] ?? ''}
                          onChange={(e) =>
                            setSubjectFilters((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          onFocus={() => setPickerOpen((prev) => ({ ...prev, [row.id]: true }))}
                          className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                        />
                        {row.isCoreSubject && (
                          <span className="shrink-0 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                            {t('core')}
                          </span>
                        )}
                        <button
                          type="button"
                          className="text-xs text-neutral-600 dark:text-neutral-300 underline shrink-0"
                          onClick={() =>
                            setPickerOpen((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                          }
                        >
                          {pickerOpen[row.id] ? tc('hide') : t('browse')}
                        </button>
                      </div>
                      {pickerOpen[row.id] && (
                        <div className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2">
                          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
                            {row.subjectName || t('selectSubject')}
                          </div>
                          <div className="max-h-72 overflow-y-auto overflow-x-hidden space-y-2">
                            {Object.values(
                              getFilteredSubjectsByCategory(subjectFilters[row.id] || '')
                            ).map((group) => {
                              const items = group.items.filter(
                                (item) =>
                                  !selectedSubjectIds.has(item.id) || row.subjectId === item.id
                              )
                              if (!items.length) return null
                              return (
                                <div key={group.categoryName} className="mb-2">
                                  <div className="text-xs font-semibold text-neutral-500 mb-1">
                                    {group.categoryName}
                                  </div>
                                  <div className="grid grid-cols-1 gap-1">
                                    {items.map((item) => (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                          const subjectConfig = config.subjects.find(
                                            (s) => s.id === item.id
                                          )
                                          setSubjectRows((prev) =>
                                            prev.map((p) =>
                                              p.id === row.id
                                                ? {
                                                    ...p,
                                                    subjectId: item.id,
                                                    subjectName: item.label,
                                                    isCoreSubject:
                                                      subjectConfig?.isCoreSubject ?? false,
                                                  }
                                                : p
                                            )
                                          )
                                          setSubjectFilters((prev) => ({ ...prev, [row.id]: '' }))
                                          setPickerOpen((prev) => ({ ...prev, [row.id]: false }))
                                        }}
                                        disabled={
                                          selectedSubjectIds.has(item.id) &&
                                          row.subjectId !== item.id
                                        }
                                        className="text-left px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm text-neutral-800 dark:text-neutral-100 disabled:opacity-40"
                                      >
                                        {item.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                            {Object.values(
                              getFilteredSubjectsByCategory(subjectFilters[row.id] || '')
                            ).every(
                              (group) =>
                                group.items.filter(
                                  (item) =>
                                    !selectedSubjectIds.has(item.id) || row.subjectId === item.id
                                ).length === 0
                            ) && (
                              <div className="text-xs text-neutral-500 px-2 py-1">
                                {tc('noMatches')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-3">
                      <div className="lg:hidden flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {t('grade')}
                        <Tooltip content={t('gradeTooltip')} />
                      </div>
                      {selectedSystem?.scaleType === 'percentage' ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 85"
                          value={row.grade}
                          onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                          className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                        />
                      ) : selectedSystem?.gradeDefinitions?.length ? (
                        <select
                          value={row.grade}
                          onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                          className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                        >
                          <option value="">{t('selectGrade')}</option>
                          {selectedSystem?.gradeDefinitions?.map((g) => (
                            <option key={g.grade ?? ''} value={g.grade ?? ''}>
                              {g.grade ?? ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          placeholder={t('grade')}
                          value={row.grade}
                          onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                          className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                        />
                      )}
                    </div>
                    <div className="lg:col-span-3">
                      <div className="lg:hidden flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {t('weight')}
                        <Tooltip content={t('weightTooltip')} />
                      </div>
                      {isDemo ? (
                        <div className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-neutral-500 dark:text-neutral-400 cursor-not-allowed">
                          1
                        </div>
                      ) : (
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          value={row.weight}
                          onChange={(e) => updateRow(row.id, 'weight', Number(e.target.value) || 1)}
                          className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                        />
                      )}
                    </div>
                    <div className="lg:col-span-1 flex justify-end">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-sm text-neutral-500 hover:text-red-500"
                        aria-label={t('removeSubject')}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Accordion>

          <Accordion
            title={t('results')}
            open={resultsOpen}
            onToggle={() => setResultsOpen((v) => !v)}
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t('bonusTotal')}
                  </p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                    {calcResult.total.toFixed(2)} {tc('pts')}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {(() => {
                      const avgRaw = convertNormalizedToScale(
                        selectedSystem,
                        calcResult.averageNormalized
                      )
                      const max = selectedSystem?.maxValue
                      const scaleLabel = max ? ` / ${Number(max)}` : ''
                      return t('subjectsAvg', {
                        count: calcResult.subjectCount,
                        avg: avgRaw.toFixed(2),
                        scale: scaleLabel,
                      })
                    })()}
                  </p>
                </div>
                {userEmail ? (
                  <Button onClick={handleSave} disabled={saving || !canSave} isLoading={saving}>
                    {t('saveTerm')}
                  </Button>
                ) : (
                  <Button onClick={() => (window.location.href = '/register')}>
                    {t('saveAndTrack')}
                  </Button>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                {calcResult.breakdown.map((item, idx) => (
                  <div key={`${item.subject}-${idx}`} className="flex justify-between">
                    <span>{t('tier', { subject: item.subject, tier: item.tier })}</span>
                    <span className="font-semibold">
                      {item.bonus.toFixed(2)} {tc('pts')}
                    </span>
                  </div>
                ))}
                {calcResult.breakdown.length === 0 && (
                  <p className="text-neutral-500">{t('addSubjectsToSee')}</p>
                )}
              </div>
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">{t('formula')}</p>
              {saveError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{saveError}</p>
              )}
              {saveMessage && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">{saveMessage}</p>
              )}
              {draftRestored && (
                <p className="mt-1 text-xs text-secondary-700 dark:text-secondary-300">
                  {t('draftRestored')}
                </p>
              )}
              {draftStatus && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{draftStatus}</p>
              )}
            </div>
          </Accordion>
        </div>
      )}
    </div>
  )
}
