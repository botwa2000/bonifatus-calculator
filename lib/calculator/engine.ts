import type { InferSelectModel } from 'drizzle-orm'
import type { gradingSystems } from '@/drizzle/schema/grades'
import type { bonusFactorDefaults, userBonusFactors } from '@/drizzle/schema/bonuses'

type GradingSystemRow = InferSelectModel<typeof gradingSystems>
type BonusFactor = InferSelectModel<typeof bonusFactorDefaults>
type UserBonusFactor = InferSelectModel<typeof userBonusFactors>

export type CalculatorInputSubject = {
  subjectId: string
  subjectName?: string
  grade: string
  weight?: number
  isCoreSubject?: boolean
}

export type CalculatorInput = {
  gradingSystem: GradingSystemRow
  factors: {
    defaults: BonusFactor[]
    overrides?: UserBonusFactor[]
  }
  classLevel: number
  termType: string
  subjects: CalculatorInputSubject[]
}

export type CalculatorSubjectResult = {
  subjectId: string
  subjectName: string
  rawGrade: string
  normalized: number
  tier: 'best' | 'second' | 'third' | 'below'
  weight: number
  bonus: number
}

export type CalculatorResult = {
  total: number
  breakdown: CalculatorSubjectResult[]
}

function factorValue(
  type: BonusFactor['factorType'],
  key: string,
  defaults: BonusFactor[],
  overrides?: UserBonusFactor[]
) {
  // Priority: child override > user override > default
  const childOverride = overrides?.find(
    (f) => f.factorType === type && f.factorKey === key && f.childId
  )
  if (childOverride) return Number(childOverride.factorValue)

  const userOverride = overrides?.find(
    (f) => f.factorType === type && f.factorKey === key && !f.childId
  )
  if (userOverride) return Number(userOverride.factorValue)

  const def = defaults.find((f) => f.factorType === type && f.factorKey === key)
  if (def) return Number(def.factorValue)

  return undefined
}

function normalizeGrade(system: GradingSystemRow, grade: string): number {
  if (!grade) return 0

  // Try direct match in grade_definitions
  const defs = (system.gradeDefinitions || []) as Array<{
    grade?: string
    normalized_100?: number
    quality_tier?: string
  }>
  const def = defs.find((g) => g.grade?.toLowerCase() === grade.trim().toLowerCase())
  if (def?.normalized_100 != null) return Number(def.normalized_100)

  // Percentages: clamp 0-100
  if (system.scaleType === 'percentage') {
    const val = Number(grade)
    if (Number.isNaN(val)) return 0
    return Math.min(Math.max(val, 0), 100)
  }

  // Numeric fallback
  const num = Number(grade)
  if (!Number.isNaN(num)) {
    const min = Number(system.minValue ?? 0)
    const max = Number(system.maxValue ?? 100)
    const clamped = Math.min(Math.max(num, min), max)
    if (max === min) return 0
    const normalized = ((clamped - min) / (max - min)) * 100
    return system.bestIsHighest ? normalized : 100 - normalized
  }

  return 0
}

function deriveTier(system: GradingSystemRow, grade: string): CalculatorSubjectResult['tier'] {
  const defs = (system.gradeDefinitions || []) as Array<{ grade?: string; quality_tier?: string }>
  const def = defs.find((g) => g.grade?.toLowerCase() === grade.trim().toLowerCase())
  if (def?.quality_tier) return def.quality_tier as CalculatorSubjectResult['tier']
  return 'below'
}

function gradeMultiplier(
  tier: CalculatorSubjectResult['tier'],
  defaults: BonusFactor[],
  overrides?: UserBonusFactor[]
) {
  const value = factorValue('grade_tier', tier, defaults, overrides)
  if (value !== undefined && !Number.isNaN(value)) return value
  throw new Error(`Missing grade_tier factor for tier "${tier}" in bonus factor defaults`)
}

export type SingleGradeInput = {
  gradingSystem: CalculatorInput['gradingSystem']
  factors: CalculatorInput['factors']
  classLevel: number
  subject: CalculatorInputSubject
}

export function calculateSingleGradeBonus(input: SingleGradeInput): CalculatorSubjectResult {
  const { gradingSystem, factors, classLevel, subject } = input
  const baseAmount = factorValue('base_amount', 'per_subject', factors.defaults, factors.overrides)
  if (baseAmount === undefined) {
    throw new Error('Missing base_amount/per_subject factor in bonus factor defaults')
  }
  const weight = Number(subject.weight ?? 1) || 1
  const normalized = normalizeGrade(gradingSystem, subject.grade)
  const tier = deriveTier(gradingSystem, subject.grade)
  const gradeMult = gradeMultiplier(tier, factors.defaults, factors.overrides)
  const classMult =
    factorValue('class_level', `class_${classLevel}`, factors.defaults, factors.overrides) ?? 1
  const coreMult = subject.isCoreSubject
    ? (factorValue('core_subject_bonus', 'multiplier', factors.defaults, factors.overrides) ?? 1)
    : 1
  const rawBonus = baseAmount * gradeMult * classMult * coreMult * weight
  const bonus = Math.max(0, rawBonus)

  return {
    subjectId: subject.subjectId,
    subjectName: subject.subjectName || 'Subject',
    rawGrade: subject.grade,
    normalized,
    tier,
    weight,
    bonus,
  }
}

export function calculateBonus(input: CalculatorInput): CalculatorResult {
  const { gradingSystem, factors, classLevel, termType, subjects } = input

  const baseAmount = factorValue('base_amount', 'per_subject', factors.defaults, factors.overrides)
  if (baseAmount === undefined) {
    throw new Error('Missing base_amount/per_subject factor in bonus factor defaults')
  }

  const breakdown: CalculatorSubjectResult[] = subjects.map((sub) => {
    const weight = Number(sub.weight ?? 1) || 1
    const normalized = normalizeGrade(gradingSystem, sub.grade)
    const tier = deriveTier(gradingSystem, sub.grade)
    const gradeMult = gradeMultiplier(tier, factors.defaults, factors.overrides)
    const classMult =
      factorValue('class_level', `class_${classLevel}`, factors.defaults, factors.overrides) ?? 1
    const termMult = factorValue('term_type', termType, factors.defaults, factors.overrides) ?? 1
    const coreMult = sub.isCoreSubject
      ? (factorValue('core_subject_bonus', 'multiplier', factors.defaults, factors.overrides) ?? 1)
      : 1
    const rawBonus = baseAmount * gradeMult * classMult * termMult * coreMult * weight
    const bonus = Math.max(0, rawBonus)

    return {
      subjectId: sub.subjectId,
      subjectName: sub.subjectName || 'Subject',
      rawGrade: sub.grade,
      normalized,
      tier,
      weight,
      bonus,
    }
  })

  const total = Math.max(
    0,
    breakdown.reduce((acc, item) => acc + item.bonus, 0)
  )

  return { total, breakdown }
}
