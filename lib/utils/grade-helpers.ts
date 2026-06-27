export function formatDate(input: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(input))
  } catch {
    return input
  }
}

export function calculateAge(dob?: string | null) {
  if (!dob) return null
  const parsed = new Date(dob)
  if (Number.isNaN(parsed.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const m = today.getMonth() - parsed.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
    age -= 1
  }
  if (age < 0 || age > 150) return null
  return age
}

export type GradingSystemInfo = {
  name?: string | Record<string, string> | null
  code?: string | null
  scale_type?: string | null
  min_value?: number | null
  max_value?: number | null
  best_is_highest?: boolean | null
} | null

export function convertNormalizedToScale(
  system: GradingSystemInfo | undefined,
  normalized: number
) {
  if (!system) return normalized
  const min = Number(system.min_value ?? 0)
  const max = Number(system.max_value ?? 100)
  if (max === min) return normalized
  if (system.best_is_highest === false) {
    return max - (normalized / 100) * (max - min)
  }
  return min + (normalized / 100) * (max - min)
}

/**
 * KMK formula: converts a DE_GYMNASIUM average (0-15 Punkte) to the 1-6 university scale.
 * Note = (17 - P) / 3, clamped to [1.0, 6.0]. P = 0 → 6.0 by convention.
 */
export function convertPoints15ToGrade6(avgPoints: number): number {
  if (avgPoints <= 0) return 6.0
  const grade = (17 - avgPoints) / 3
  return Math.round(Math.max(1.0, Math.min(6.0, grade)) * 10) / 10
}

/**
 * Returns a bracketed secondary-scale label for grading systems that have a standard
 * university translation (e.g. DE_GYMNASIUM → 1-6), or null for all other systems.
 * Example: formatSecondaryAverage('DE_GYMNASIUM', 10.5) → "(≈ 2.2)"
 */
export function formatSecondaryAverage(
  systemCode: string | null | undefined,
  avgNative: number
): string | null {
  if (systemCode === 'DE_GYMNASIUM') {
    return `(≈ ${convertPoints15ToGrade6(avgNative).toFixed(1)})`
  }
  return null
}

export function deriveTier(normalized: number): string {
  if (normalized >= 75) return 'best'
  if (normalized >= 50) return 'second'
  if (normalized >= 25) return 'third'
  return 'below'
}

export function tierColor(tier: string): string {
  switch (tier) {
    case 'best':
      return '#22c55e'
    case 'second':
      return '#6366f1'
    case 'third':
      return '#f59e0b'
    case 'below':
      return '#ef4444'
    default:
      return '#6b7280'
  }
}
