// Pocket-money recommendations of the Deutsches Jugendinstitut (DJI), September 2025:
// Chabursky & Langmeyer, "Taschengeld und Gelderziehung", DOI 10.36189/DJI202534, p. 6/35.
// Ranges, not point values; weekly for younger children, monthly from age 10.
// Do not edit amounts without a newer DJI publication as the source.

export const DJI_SOURCE_URL =
  'https://www.dji.de/fileadmin/user_upload/dasdji/publikationen/Broschueren_2025/Expertise_Taschengeld_ChaburskyLangmeyer2025_aktualisiert.pdf'

export type AllowancePeriod = 'week' | 'month'

export interface AllowanceEntry {
  /** Inclusive age bounds. `ageMin: 0` means "under ageMax + 1"; `ageMax: null` means "and older". */
  ageMin: number
  ageMax: number | null
  minEur: number
  maxEur: number
  period: AllowancePeriod
  /** From 16: applies to young people still financially dependent on their parents. */
  dependentOnly?: boolean
}

export const DJI_ALLOWANCE_TABLE: readonly AllowanceEntry[] = [
  { ageMin: 0, ageMax: 5, minEur: 1, maxEur: 2, period: 'week' },
  { ageMin: 6, ageMax: 7, minEur: 2, maxEur: 3, period: 'week' },
  { ageMin: 8, ageMax: 9, minEur: 3, maxEur: 4, period: 'week' },
  { ageMin: 10, ageMax: 11, minEur: 15, maxEur: 25, period: 'month' },
  { ageMin: 12, ageMax: 13, minEur: 20, maxEur: 30, period: 'month' },
  { ageMin: 14, ageMax: 15, minEur: 25, maxEur: 45, period: 'month' },
  { ageMin: 16, ageMax: 17, minEur: 40, maxEur: 60, period: 'month', dependentOnly: true },
  { ageMin: 18, ageMax: null, minEur: 55, maxEur: 75, period: 'month', dependentOnly: true },
]

export function getAllowanceForAge(age: number): AllowanceEntry | null {
  return (
    DJI_ALLOWANCE_TABLE.find((e) => age >= e.ageMin && (e.ageMax === null || age <= e.ageMax)) ??
    null
  )
}

const WEEKS_PER_MONTH = 52 / 12

/** Approximate the same range in the other period (weekly ↔ monthly), rounded for display. */
export function convertRange(entry: AllowanceEntry): {
  minEur: number
  maxEur: number
  period: AllowancePeriod
} {
  if (entry.period === 'week') {
    return {
      minEur: Math.round(entry.minEur * WEEKS_PER_MONTH),
      maxEur: Math.round(entry.maxEur * WEEKS_PER_MONTH),
      period: 'month',
    }
  }
  const toHalf = (v: number) => Math.round((v / WEEKS_PER_MONTH) * 2) / 2
  return { minEur: toHalf(entry.minEur), maxEur: toHalf(entry.maxEur), period: 'week' }
}
