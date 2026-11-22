// Notendurchschnitt-Rechner: (weighted) average of German grades 1–6, plus the Bavarian
// Übertritt check (Grundschulordnung § 6 Abs. 5: Gymnasium from 2,33, Realschule from 2,66,
// average of Deutsch, Mathematik, Heimat- und Sachunterricht).

export interface GradeEntry {
  name: string
  /** 1–6, decimals allowed (e.g. 2.5); null while not entered. */
  grade: number | null
  /** Relative weight, e.g. 2 for a subject that counts double. */
  weight: number
}

export interface AverageResult {
  /** Exact weighted average, or null when nothing is entered. */
  exact: number | null
  /** Average cut off after two decimals (2.666… → 2.66), as on Bavarian Übertrittszeugnisse. */
  truncated: number | null
  counted: number
  totalWeight: number
}

export function isValidGrade(n: number | null): n is number {
  return n !== null && Number.isFinite(n) && n >= 1 && n <= 6
}

/** Cut off (not round) after two decimals, robust against binary float noise. */
export function truncate2(n: number): number {
  return Math.floor(Math.round(n * 1e6) / 1e4) / 100
}

export function calculateAverage(entries: readonly GradeEntry[]): AverageResult {
  const valid = entries.filter((e) => isValidGrade(e.grade) && e.weight > 0)
  const totalWeight = valid.reduce((sum, e) => sum + e.weight, 0)
  if (totalWeight === 0) return { exact: null, truncated: null, counted: 0, totalWeight: 0 }
  const exact = valid.reduce((sum, e) => sum + (e.grade as number) * e.weight, 0) / totalWeight
  return { exact, truncated: truncate2(exact), counted: valid.length, totalWeight }
}

export const BAVARIA_SUBJECTS = ['Deutsch', 'Mathematik', 'Heimat- und Sachunterricht'] as const
export const BAVARIA_GYMNASIUM = 2.33
export const BAVARIA_REALSCHULE = 2.66

export type BavariaEligibility = 'gymnasium' | 'realschule' | 'none'

/** Eligibility from the Gesamtdurchschnittsnote (lower is better). */
export function bavariaEligibility(truncated: number): BavariaEligibility {
  if (truncated <= BAVARIA_GYMNASIUM) return 'gymnasium'
  if (truncated <= BAVARIA_REALSCHULE) return 'realschule'
  return 'none'
}

export function formatGrade(n: number, digits = 2): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}
