'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type FactorRow = {
  factorType: string
  factorKey: string
  factorValue: number
}

type FactorsResponse = {
  success: boolean
  defaults: FactorRow[]
  overrides: FactorRow[]
}

const GRADE_TIER_KEYS = ['best', 'second', 'third', 'below'] as const
const TERM_TYPE_KEYS = [
  'semester_1',
  'semester_2',
  'midterm',
  'final',
  'quarterly',
  'trimester',
] as const
const CLASS_LEVEL_KEYS = Array.from({ length: 13 }, (_, i) => `class_${i + 1}`) as string[]

function getEffectiveValue(
  factorType: string,
  factorKey: string,
  defaults: FactorRow[],
  overrides: FactorRow[]
): number {
  const override = overrides.find((f) => f.factorType === factorType && f.factorKey === factorKey)
  if (override !== undefined) return override.factorValue
  const def = defaults.find((f) => f.factorType === factorType && f.factorKey === factorKey)
  return def?.factorValue ?? 0
}

function buildCurrentFactors(
  defaults: FactorRow[],
  overrides: FactorRow[],
  localEdits: Map<string, number>
): FactorRow[] {
  const factors: FactorRow[] = []

  const allKeys = [
    ...GRADE_TIER_KEYS.map((k) => ({ type: 'grade_tier', key: k })),
    ...TERM_TYPE_KEYS.map((k) => ({ type: 'term_type', key: k })),
    ...CLASS_LEVEL_KEYS.map((k) => ({ type: 'class_level', key: k })),
  ]

  for (const { type, key } of allKeys) {
    const editKey = `${type}:${key}`
    const localVal = localEdits.get(editKey)
    if (localVal !== undefined) {
      factors.push({ factorType: type, factorKey: key, factorValue: localVal })
    } else {
      const effective = getEffectiveValue(type, key, defaults, overrides)
      factors.push({ factorType: type, factorKey: key, factorValue: effective })
    }
  }

  return factors
}

export default function BonusFactorEditor() {
  const t = useTranslations('settings')

  const [defaults, setDefaults] = useState<FactorRow[]>([])
  const [overrides, setOverrides] = useState<FactorRow[]>([])
  const [localEdits, setLocalEdits] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [gradeTierOpen, setGradeTierOpen] = useState(true)
  const [termTypeOpen, setTermTypeOpen] = useState(false)
  const [classLevelOpen, setClassLevelOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings/factors')
        const data: FactorsResponse = await res.json()
        if (data.success) {
          setDefaults(data.defaults)
          setOverrides(data.overrides)
        }
      } catch {
        // Silently fail; user sees defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const saveFactors = useCallback(
    async (edits: Map<string, number>) => {
      setSaveStatus('saving')
      try {
        const factors = buildCurrentFactors(defaults, overrides, edits)
        const res = await fetch('/api/settings/factors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ factors }),
        })
        const data = await res.json()
        if (data.success) {
          // Merge edits into overrides so state is consistent
          const newOverrides = factors.map((f) => ({
            factorType: f.factorType,
            factorKey: f.factorKey,
            factorValue: f.factorValue,
          }))
          setOverrides(newOverrides)
          setLocalEdits(new Map())
          setSaveStatus('saved')
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
        } else {
          setSaveStatus('error')
        }
      } catch {
        setSaveStatus('error')
      }
    },
    [defaults, overrides]
  )

  const handleChange = useCallback(
    (factorType: string, factorKey: string, value: number) => {
      setLocalEdits((prev) => {
        const next = new Map(prev)
        next.set(`${factorType}:${factorKey}`, value)

        // Debounced save
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          saveFactors(next)
        }, 500)

        return next
      })
    },
    [saveFactors]
  )

  const resetSection = useCallback(
    (factorType: string) => {
      const keys =
        factorType === 'grade_tier'
          ? GRADE_TIER_KEYS
          : factorType === 'term_type'
            ? TERM_TYPE_KEYS
            : CLASS_LEVEL_KEYS

      setLocalEdits((prev) => {
        const next = new Map(prev)
        // Remove local edits for this section
        for (const key of keys) {
          next.delete(`${factorType}:${key}`)
        }
        return next
      })

      // Remove overrides for this section and save immediately
      const remaining = overrides.filter((f) => f.factorType !== factorType)
      const otherEdits = new Map<string, number>()
      // Keep edits from other sections
      for (const [editKey, val] of localEdits) {
        if (!editKey.startsWith(`${factorType}:`)) {
          otherEdits.set(editKey, val)
        }
      }

      // Build factors from remaining overrides + other edits, using defaults for the reset section
      const factors: FactorRow[] = []
      const allSections = [
        { type: 'grade_tier', keys: GRADE_TIER_KEYS },
        { type: 'term_type', keys: TERM_TYPE_KEYS },
        { type: 'class_level', keys: CLASS_LEVEL_KEYS },
      ]
      for (const section of allSections) {
        for (const key of section.keys) {
          const editKey = `${section.type}:${key}`
          const localVal = otherEdits.get(editKey)
          if (localVal !== undefined) {
            factors.push({ factorType: section.type, factorKey: key, factorValue: localVal })
          } else if (section.type === factorType) {
            // Use default value for reset section
            const def = defaults.find((f) => f.factorType === section.type && f.factorKey === key)
            factors.push({
              factorType: section.type,
              factorKey: key,
              factorValue: def?.factorValue ?? 0,
            })
          } else {
            const effective = getEffectiveValue(section.type, key, defaults, remaining)
            factors.push({ factorType: section.type, factorKey: key, factorValue: effective })
          }
        }
      }

      setSaveStatus('saving')
      fetch('/api/settings/factors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factors }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOverrides(factors)
            setLocalEdits(otherEdits)
            setSaveStatus('saved')
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
            savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
          } else {
            setSaveStatus('error')
          }
        })
        .catch(() => setSaveStatus('error'))
    },
    [defaults, overrides, localEdits]
  )

  const getValue = useCallback(
    (factorType: string, factorKey: string): number => {
      const editKey = `${factorType}:${factorKey}`
      const localVal = localEdits.get(editKey)
      if (localVal !== undefined) return localVal
      return getEffectiveValue(factorType, factorKey, defaults, overrides)
    },
    [defaults, overrides, localEdits]
  )

  const getDefaultValue = useCallback(
    (factorType: string, factorKey: string): number => {
      const def = defaults.find((f) => f.factorType === factorType && f.factorKey === factorKey)
      return def?.factorValue ?? 0
    },
    [defaults]
  )

  const isOverridden = useCallback(
    (factorType: string, factorKey: string): boolean => {
      const editKey = `${factorType}:${factorKey}`
      if (localEdits.has(editKey)) return true
      return overrides.some(
        (f) =>
          f.factorType === factorType &&
          f.factorKey === factorKey &&
          f.factorValue !== getDefaultValue(factorType, factorKey)
      )
    },
    [overrides, localEdits, getDefaultValue]
  )

  const factorKeyLabel = useCallback(
    (factorType: string, key: string): string => {
      if (factorType === 'grade_tier') {
        const labels: Record<string, () => string> = {
          best: () => t('best'),
          second: () => t('second'),
          third: () => t('third'),
          below: () => t('below'),
        }
        return labels[key]?.() ?? key
      }
      if (factorType === 'term_type') {
        const labels: Record<string, string> = {
          semester_1: 'Semester 1',
          semester_2: 'Semester 2',
          midterm: 'Midterm',
          final: 'Final',
          quarterly: 'Quarterly',
          trimester: 'Trimester',
        }
        return labels[key] ?? key
      }
      if (factorType === 'class_level') {
        const num = key.replace('class_', '')
        return `Class ${num}`
      }
      return key
    },
    [t]
  )

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('bonusFactorsTitle')}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            {t('bonusCalculationDesc')}
          </p>
        </div>
        {saveStatus === 'saving' && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400 animate-pulse">
            {t('factorSaved')}...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-success-600 dark:text-success-400 font-medium">
            {t('factorSaved')}
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-error-600 dark:text-error-400 font-medium">
            Error saving
          </span>
        )}
      </div>

      {/* Grade Tier Factors */}
      <SectionAccordion
        title={t('gradeTierFactors')}
        description={t('gradeTierFactorsDesc')}
        open={gradeTierOpen}
        onToggle={() => setGradeTierOpen((v) => !v)}
        onReset={() => resetSection('grade_tier')}
        resetLabel={t('resetToDefaults')}
      >
        <div className="space-y-2">
          {GRADE_TIER_KEYS.map((key) => (
            <FactorInput
              key={key}
              label={factorKeyLabel('grade_tier', key)}
              value={getValue('grade_tier', key)}
              defaultValue={getDefaultValue('grade_tier', key)}
              isOverridden={isOverridden('grade_tier', key)}
              onChange={(val) => handleChange('grade_tier', key, val)}
              step={0.5}
            />
          ))}
        </div>
      </SectionAccordion>

      {/* Term Type Factors */}
      <SectionAccordion
        title={t('termTypeFactors')}
        description={t('termTypeFactorsDesc')}
        open={termTypeOpen}
        onToggle={() => setTermTypeOpen((v) => !v)}
        onReset={() => resetSection('term_type')}
        resetLabel={t('resetToDefaults')}
      >
        <div className="space-y-2">
          {TERM_TYPE_KEYS.map((key) => (
            <FactorInput
              key={key}
              label={factorKeyLabel('term_type', key)}
              value={getValue('term_type', key)}
              defaultValue={getDefaultValue('term_type', key)}
              isOverridden={isOverridden('term_type', key)}
              onChange={(val) => handleChange('term_type', key, val)}
              step={0.1}
            />
          ))}
        </div>
      </SectionAccordion>

      {/* Class Level Factors */}
      <SectionAccordion
        title={t('classLevelFactors')}
        description={t('classLevelFactorsDesc')}
        open={classLevelOpen}
        onToggle={() => setClassLevelOpen((v) => !v)}
        onReset={() => resetSection('class_level')}
        resetLabel={t('resetToDefaults')}
      >
        <div className="space-y-2">
          {CLASS_LEVEL_KEYS.map((key) => (
            <FactorInput
              key={key}
              label={factorKeyLabel('class_level', key)}
              value={getValue('class_level', key)}
              defaultValue={getDefaultValue('class_level', key)}
              isOverridden={isOverridden('class_level', key)}
              onChange={(val) => handleChange('class_level', key, val)}
              step={0.1}
            />
          ))}
        </div>
      </SectionAccordion>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function SectionAccordion({
  title,
  description,
  open,
  onToggle,
  onReset,
  resetLabel,
  children,
}: {
  title: string
  description: string
  open: boolean
  onToggle: () => void
  onReset: () => void
  resetLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      >
        <div className="text-left">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {title}
          </span>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="p-5 space-y-3">
            {children}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onReset()
                }}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
              >
                {resetLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FactorInput({
  label,
  value,
  defaultValue,
  isOverridden,
  onChange,
  step = 0.1,
}: {
  label: string
  value: number
  defaultValue: number
  isOverridden: boolean
  onChange: (val: number) => void
  step?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
        {isOverridden && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0"
            title="Custom override"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value)
            if (!Number.isNaN(parsed)) {
              onChange(parsed)
            }
          }}
          className="w-20 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white text-right tabular-nums"
        />
        {isOverridden && (
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 tabular-nums w-10 text-right">
            ({defaultValue})
          </span>
        )}
      </div>
    </div>
  )
}
