'use client'

import { useEffect, useState } from 'react'
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

export default function BonusFactorReadonly({ parentName }: { parentName?: string }) {
  const t = useTranslations('settings')

  const [defaults, setDefaults] = useState<FactorRow[]>([])
  const [overrides, setOverrides] = useState<FactorRow[]>([])
  const [loading, setLoading] = useState(true)

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
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getValue = (factorType: string, factorKey: string): number => {
    return getEffectiveValue(factorType, factorKey, defaults, overrides)
  }

  const isOverridden = (factorType: string, factorKey: string): boolean => {
    return overrides.some((f) => f.factorType === factorType && f.factorKey === factorKey)
  }

  const factorKeyLabel = (factorType: string, key: string): string => {
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
  }

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

  const hasOverrides = overrides.length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('bonusFactorsTitle')}
        </h2>
        {parentName ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {t('managedByParentDesc', { name: parentName })}
          </p>
        ) : hasOverrides ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {t('managedByParent')}
          </p>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t('systemDefaultsDesc')}
          </p>
        )}
      </div>

      {/* Grade Tier Factors */}
      <FactorSection title={t('gradeTierFactors')} description={t('gradeTierFactorsDesc')}>
        <FactorTable
          factorType="grade_tier"
          keys={GRADE_TIER_KEYS as unknown as string[]}
          getValue={getValue}
          isOverridden={isOverridden}
          getLabel={factorKeyLabel}
        />
      </FactorSection>

      {/* Term Type Factors */}
      <FactorSection title={t('termTypeFactors')} description={t('termTypeFactorsDesc')}>
        <FactorTable
          factorType="term_type"
          keys={TERM_TYPE_KEYS as unknown as string[]}
          getValue={getValue}
          isOverridden={isOverridden}
          getLabel={factorKeyLabel}
        />
      </FactorSection>

      {/* Class Level Factors */}
      <FactorSection title={t('classLevelFactors')} description={t('classLevelFactorsDesc')}>
        <FactorTable
          factorType="class_level"
          keys={CLASS_LEVEL_KEYS}
          getValue={getValue}
          isOverridden={isOverridden}
          getLabel={factorKeyLabel}
        />
      </FactorSection>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function FactorSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  )
}

function FactorTable({
  factorType,
  keys,
  getValue,
  isOverridden,
  getLabel,
}: {
  factorType: string
  keys: string[]
  getValue: (type: string, key: string) => number
  isOverridden: (type: string, key: string) => boolean
  getLabel: (type: string, key: string) => string
}) {
  return (
    <div className="space-y-1.5">
      {keys.map((key) => {
        const value = getValue(factorType, key)
        const customized = isOverridden(factorType, key)
        return (
          <div key={key} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {getLabel(factorType, key)}
              </span>
              {customized && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0"
                  title="Customized"
                />
              )}
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white tabular-nums">
              {value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
