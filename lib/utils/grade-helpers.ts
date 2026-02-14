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
