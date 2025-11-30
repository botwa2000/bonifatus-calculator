'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import type { Tables } from '@/types/database'

type GradingSystem = Tables<'grading_systems'>

type Factor = Tables<'bonus_factor_defaults'>

type Subject = {
  id: string
  name: string | Record<string, string>
  category_id?: string
}

type SubjectEntry = {
  id: string
  subjectId?: string
  subjectName: string
  grade: string
  weight: number
}

type CalculatorConfig = {
  gradingSystems: GradingSystem[]
  bonusFactorDefaults: Factor[]
  subjects: Subject[]
  categories: Array<{ id: string; name: string | Record<string, string> }>
}

type CalculationResult = {
  total: number
  breakdown: Array<{
    subject: string
    normalized: number
    tier: string
    bonus: number
  }>
}

function resolveLocalized(value: string | Record<string, string> | null | undefined) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value['en'] || Object.values(value)[0] || ''
}

function getFactorValue(factors: Factor[], type: Factor['factor_type'], key: string, fallback = 1) {
  const found = factors.find((f) => f.factor_type === type && f.factor_key === key)
  return found ? Number(found.factor_value) : fallback
}

function deriveTierFromDefinitions(system: GradingSystem, grade: string) {
  const def = system.grade_definitions?.find(
    (g) => (g.grade ?? '').toLowerCase() === grade.trim().toLowerCase()
  )
  if (def?.quality_tier) return def.quality_tier
  return 'below'
}

function normalizeGrade(system: GradingSystem, grade: string) {
  if (!grade) return 0
  if (system.scale_type === 'percentage') {
    const val = Number(grade)
    if (Number.isNaN(val)) return 0
    return Math.min(Math.max(val, 0), 100)
  }

  const def = system.grade_definitions?.find(
    (g) => (g.grade ?? '').toLowerCase() === grade.trim().toLowerCase()
  )
  if (def?.normalized_100 != null) return Number(def.normalized_100)

  // Fallback: use numeric_value if provided
  if (def?.numeric_value != null) {
    const first = system.grade_definitions[0]?.numeric_value ?? 100
    const last = system.grade_definitions[system.grade_definitions.length - 1]?.numeric_value ?? 0
    const range = system.best_is_highest ? Number(first) : Number(last)
    return Math.min(Math.max((Number(def.numeric_value) / range) * 100, 0), 100)
  }

  return 0
}

function getGradeMultiplier(factors: Factor[], tier: string) {
  const value = getFactorValue(factors, 'grade_tier', tier, undefined as unknown as number)
  if (value !== undefined && !Number.isNaN(value)) return value
  switch (tier) {
    case 'best':
      return 2
    case 'second':
      return 1
    case 'third':
      return 0
    default:
      return -1
  }
}

function calculateBonus(
  system: GradingSystem,
  factors: Factor[],
  classLevel: number,
  termType: string,
  subjects: SubjectEntry[]
): CalculationResult {
  if (!system) return { total: 0, breakdown: [] }

  const breakdown = subjects.map((subject) => {
    const normalized = normalizeGrade(system, subject.grade)
    const defTier = deriveTierFromDefinitions(system, subject.grade)
    // Fallback tier by normalized value if not found in definitions
    let tier = defTier
    if (!tier || tier === 'below') {
      const score = normalized
      if (!system.best_is_highest) {
        // invert thresholds: lower is better
        tier = score <= 10 ? 'best' : score <= 30 ? 'second' : score <= 60 ? 'third' : 'below'
      } else {
        tier = score >= 90 ? 'best' : score >= 75 ? 'second' : score >= 60 ? 'third' : 'below'
      }
    }
    const gradeMultiplier = getGradeMultiplier(factors, tier)
    const classMult = getFactorValue(factors, 'class_level', `class_${classLevel}`, 1)
    const termMult = getFactorValue(factors, 'term_type', termType, 1)
    const weight = Number(subject.weight) || 1
    const rawBonus = gradeMultiplier * classMult * termMult * weight
    const bonus = Math.max(0, rawBonus)
    return {
      subject: subject.subjectName || 'Subject',
      normalized,
      tier,
      bonus,
    }
  })

  const sum = breakdown.reduce((acc, item) => acc + item.bonus, 0)
  return {
    total: Math.max(0, sum),
    breakdown,
  }
}

function getSampleData(config: CalculatorConfig): {
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
    if (system.scale_type === 'percentage') {
      return Math.floor(60 + Math.random() * 40).toString()
    }
    const defs = system.grade_definitions || []
    if (defs.length) {
      return pickRandom(defs)?.grade || ''
    }
    if (system.min_value != null && system.max_value != null) {
      const val = Math.floor(
        Number(system.min_value) +
          Math.random() * (Number(system.max_value) - Number(system.min_value))
      )
      return val.toString()
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
      subjectName: resolveLocalized(s.name) || `Subject ${idx + 1}`,
      grade: randomGrade(sampleSystem),
      weight: Number((0.5 + Math.random() * 1.5).toFixed(1)),
    })),
  }
}

export function DemoCalculator() {
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

  const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>()
  const [classLevel, setClassLevel] = useState(1)
  const [termType, setTermType] = useState('final')
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [termName, setTermName] = useState('')
  const [subjectRows, setSubjectRows] = useState<SubjectEntry[]>([
    { id: '0', subjectName: 'Math', grade: '', weight: 1 },
  ])
  const [subjectFilters, setSubjectFilters] = useState<Record<string, string>>({})
  const [pickerOpen, setPickerOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config/calculator')
        if (!res.ok) throw new Error('Failed to load calculator config')
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load calculator config')
        setConfig({
          gradingSystems: data.gradingSystems || [],
          bonusFactorDefaults: data.bonusFactorDefaults || [],
          subjects: data.subjects || [],
          categories: data.categories || [],
        })
        if (data.gradingSystems?.[0]?.id) {
          setSelectedSystemId(data.gradingSystems[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calculator config')
      } finally {
        setLoading(false)
      }
    }

    async function loadUser() {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data } = await supabase.auth.getUser()
        setUserEmail(data.user?.email ?? null)
      } catch {
        setUserEmail(null)
      }
    }

    loadConfig()
    loadUser()
  }, [])

  const sortedGradingSystems = useMemo(
    () =>
      config.gradingSystems
        .slice()
        .sort(
          (a, b) =>
            (a.display_order ?? 0) - (b.display_order ?? 0) ||
            resolveLocalized(a.name).localeCompare(resolveLocalized(b.name))
        ),
    [config.gradingSystems]
  )

  const selectedSystem = useMemo(
    () => sortedGradingSystems.find((g) => g.id === selectedSystemId) || sortedGradingSystems[0],
    [sortedGradingSystems, selectedSystemId]
  )

  const calcResult = useMemo(
    () =>
      calculateBonus(
        selectedSystem!,
        config.bonusFactorDefaults,
        classLevel,
        termType,
        subjectRows
      ),
    [selectedSystem, config.bonusFactorDefaults, classLevel, termType, subjectRows]
  )

  const addRow = () => {
    setSubjectRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), subjectName: '', grade: '', weight: 1 },
    ])
  }

  const resolveSubjectId = (name: string | undefined) => {
    if (!name) return undefined
    const found = config.subjects.find(
      (s) => resolveLocalized(s.name).toLowerCase() === name.trim().toLowerCase()
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
        const catName = resolveLocalized(cat.name)
        const items = config.subjects
          .filter((s) => s.category_id === cat.id)
          .map((s) => ({
            id: s.id,
            label: resolveLocalized(s.name),
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
  }, [config.categories, config.subjects])

  const updateRow = (id: string, field: keyof SubjectEntry, value: string | number) => {
    setSubjectRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const removeRow = (id: string) => {
    setSubjectRows((prev) => prev.filter((row) => row.id !== id))
  }

  const applySample = () => {
    const sample = getSampleData(config)
    setSelectedSystemId(sample.systemId)
    setClassLevel(sample.classLevel)
    setTermType(sample.termType)
    setSubjectRows(sample.subjects)
  }

  const canSave = !!userEmail && subjectRows.every((row) => resolveSubjectId(row.subjectName))

  const handleSave = async () => {
    setSaveMessage(null)
    setSaveError(null)
    if (!userEmail) {
      window.location.href = `/register?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    if (!selectedSystem) {
      setSaveError('Select a grading system first.')
      return
    }
    const subjectPayload = subjectRows.map((row) => {
      const sid = resolveSubjectId(row.subjectName || '')
      return {
        subjectId: sid || '',
        subjectName: row.subjectName,
        grade: row.grade,
        weight: row.weight,
      }
    })
    if (subjectPayload.some((s) => !s.subjectId)) {
      setSaveError('Please pick subjects from the list so we can save them.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/grades/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      setSaveMessage('Saved! View your dashboard to see this term.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={applySample}
          className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
        >
          Load sample
        </button>
      </div>

      {loading && <p className="text-neutral-600 dark:text-neutral-300">Loading settings…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">Error: {error}</p>}

      {!loading && !error && selectedSystem && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Grading system
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                value={selectedSystem?.id}
                onChange={(e) => setSelectedSystemId(e.target.value)}
              >
                {sortedGradingSystems.map((gs) => (
                  <option key={gs.id} value={gs.id}>
                    {resolveLocalized(gs.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Class level
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={classLevel}
                  onChange={(e) => setClassLevel(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Term type
                </label>
                <select
                  value={termType}
                  onChange={(e) => setTermType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                >
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="semester">Semester</option>
                  <option value="quarterly">Quarter</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                School year
              </label>
              <input
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="e.g. 2025-2026"
                className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Term name (optional)
              </label>
              <input
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                placeholder="e.g. Spring"
                className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                Subjects & grades
              </h4>
              <button
                onClick={addRow}
                className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
              >
                Add subject
              </button>
            </div>
            <div className="space-y-2">
              {subjectRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-3 overflow-hidden"
                >
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        placeholder={row.subjectName || 'Search subject'}
                        value={subjectFilters[row.id] ?? ''}
                        onChange={(e) =>
                          setSubjectFilters((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        onFocus={() => setPickerOpen((prev) => ({ ...prev, [row.id]: true }))}
                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                      />
                      <button
                        type="button"
                        className="text-xs text-neutral-600 dark:text-neutral-300 underline"
                        onClick={() =>
                          setPickerOpen((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                        }
                      >
                        {pickerOpen[row.id] ? 'Hide' : 'Browse'}
                      </button>
                    </div>
                    {pickerOpen[row.id] && (
                      <div className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2">
                        <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
                          {row.subjectName || 'Select a subject'}
                        </div>
                        <div className="max-h-52 overflow-y-auto overflow-x-hidden space-y-2">
                          {Object.values(
                            getFilteredSubjectsByCategory(subjectFilters[row.id] || '')
                          ).map((group) => (
                            <div key={group.categoryName} className="mb-2">
                              <div className="text-xs font-semibold text-neutral-500 mb-1">
                                {group.categoryName}
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                {group.items.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      updateRow(row.id, 'subjectName', item.label)
                                      setSubjectFilters((prev) => ({ ...prev, [row.id]: '' }))
                                      setPickerOpen((prev) => ({ ...prev, [row.id]: false }))
                                    }}
                                    className="text-left px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm text-neutral-800 dark:text-neutral-100"
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {Object.keys(getFilteredSubjectsByCategory(subjectFilters[row.id] || ''))
                            .length === 0 && (
                            <div className="text-xs text-neutral-500 px-2 py-1">No matches</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-3">
                    {selectedSystem.scale_type === 'percentage' ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="e.g. 85"
                        value={row.grade}
                        onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                      />
                    ) : selectedSystem.grade_definitions?.length ? (
                      <select
                        value={row.grade}
                        onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                      >
                        <option value="">Select grade</option>
                        {selectedSystem.grade_definitions.map((g) => (
                          <option key={g.grade} value={g.grade}>
                            {g.grade}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        placeholder="Grade"
                        value={row.grade}
                        onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                      />
                    )}
                  </div>
                  <div className="lg:col-span-2">
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={row.weight}
                      onChange={(e) => updateRow(row.id, 'weight', Number(e.target.value) || 1)}
                      className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Subject importance multiplier (default 1).
                    </p>
                  </div>
                  <div className="lg:col-span-1 flex justify-end">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-sm text-neutral-500 hover:text-red-500"
                      aria-label="Remove subject"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Bonus total</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                  {calcResult.total.toFixed(2)} pts
                </p>
              </div>
              {userEmail ? (
                <button
                  onClick={handleSave}
                  disabled={saving || !canSave}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-button hover:shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
                >
                  {saving ? 'Saving…' : 'Save term'}
                </button>
              ) : (
                <a
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-button hover:shadow-lg hover:scale-105 transition-all"
                >
                  Save & Track
                </a>
              )}
            </div>
            <div className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              {calcResult.breakdown.map((item, idx) => (
                <div key={`${item.subject}-${idx}`} className="flex justify-between">
                  <span>
                    {item.subject} — {item.tier} tier
                  </span>
                  <span className="font-semibold">{item.bonus.toFixed(2)} pts</span>
                </div>
              ))}
              {calcResult.breakdown.length === 0 && (
                <p className="text-neutral-500">Add subjects and grades to see the calculation.</p>
              )}
            </div>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">
              Calculation: grade tier multiplier × class level × term type × subject weight, floored
              at zero total. For exact conversion, we use our proprietary grading system
              definitions.
            </p>
            {saveError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{saveError}</p>
            )}
            {saveMessage && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">{saveMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
