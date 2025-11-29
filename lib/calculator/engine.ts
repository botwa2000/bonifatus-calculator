import type { Database } from '@/types/database'

type GradingSystemRow = Database['public']['Tables']['grading_systems']['Row']
type BonusFactor = Database['public']['Tables']['bonus_factor_defaults']['Row']
type UserBonusFactor = Database['public']['Tables']['user_bonus_factors']['Row']

export type CalculatorInputSubject = {
  subjectId: string
  subjectName?: string
  grade: string
  weight?: number
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
  type: BonusFactor['factor_type'],
  key: string,
  defaults: BonusFactor[],
  overrides?: UserBonusFactor[]
) {
  // Priority: child override > user override > default
  const childOverride = overrides?.find(
    (f) => f.factor_type === type && f.factor_key === key && f.child_id
  )
  if (childOverride) return Number(childOverride.factor_value)

  const userOverride = overrides?.find(
    (f) => f.factor_type === type && f.factor_key === key && !f.child_id
  )
  if (userOverride) return Number(userOverride.factor_value)

  const def = defaults.find((f) => f.factor_type === type && f.factor_key === key)
  if (def) return Number(def.factor_value)

  return undefined
}

function normalizeGrade(system: GradingSystemRow, grade: string): number {
  if (!grade) return 0

  // Try direct match in grade_definitions
  const def = (system.grade_definitions || []).find(
    (g) => g.grade?.toLowerCase() === grade.trim().toLowerCase()
  )
  if (def?.normalized_100 != null) return Number(def.normalized_100)

  // Percentages: clamp 0-100
  if (system.scale_type === 'percentage') {
    const val = Number(grade)
    if (Number.isNaN(val)) return 0
    return Math.min(Math.max(val, 0), 100)
  }

  // Numeric fallback
  const num = Number(grade)
  if (!Number.isNaN(num)) {
    const min = Number(system.min_value ?? 0)
    const max = Number(system.max_value ?? 100)
    const clamped = Math.min(Math.max(num, min), max)
    if (max === min) return 0
    const normalized = ((clamped - min) / (max - min)) * 100
    return system.best_is_highest ? normalized : 100 - normalized
  }

  return 0
}

function deriveTier(system: GradingSystemRow, grade: string): CalculatorSubjectResult['tier'] {
  const def = (system.grade_definitions || []).find(
    (g) => g.grade?.toLowerCase() === grade.trim().toLowerCase()
  )
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
  // Conservative fallback
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

export function calculateBonus(input: CalculatorInput): CalculatorResult {
  const { gradingSystem, factors, classLevel, termType, subjects } = input

  const breakdown: CalculatorSubjectResult[] = subjects.map((sub) => {
    const weight = Number(sub.weight ?? 1) || 1
    const normalized = normalizeGrade(gradingSystem, sub.grade)
    const tier = deriveTier(gradingSystem, sub.grade)
    const gradeMult = gradeMultiplier(tier, factors.defaults, factors.overrides)
    const classMult =
      factorValue('class_level', `class_${classLevel}`, factors.defaults, factors.overrides) ?? 1
    const termMult = factorValue('term_type', termType, factors.defaults, factors.overrides) ?? 1
    const bonus = gradeMult * classMult * termMult * weight

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
