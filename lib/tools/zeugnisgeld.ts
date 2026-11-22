// Zeugnisgeld-Rechner: suggested report-card reward in euros under one of three family
// rules. Pure functions, shared by the page (server render) and the interactive form.
// German grades 1 (sehr gut) to 6 (ungenügend), whole grades only.

export type ZeugnisgeldModel = 'perGrade' | 'improvement' | 'flat'

export const GRADES = [1, 2, 3, 4, 5, 6] as const
export type Grade = (typeof GRADES)[number]

export interface SubjectRow {
  name: string
  /** Grade on this report card; null while not entered. */
  grade: Grade | null
  /** Grade on the previous report card (improvement model only). */
  previous: Grade | null
}

export interface ZeugnisgeldRule {
  model: ZeugnisgeldModel
  /** Euros per subject for each grade (perGrade model). Index 0 = grade 1. */
  perGrade: [number, number, number, number, number, number]
  /** Euros per grade step a subject improved (improvement model). */
  perStep: number
  /** Fixed amount for the report card (flat model). */
  flat: number
  /** Upper limit for the total in euros; null = none. */
  cap: number | null
}

export const DEFAULT_RULE: ZeugnisgeldRule = {
  model: 'perGrade',
  perGrade: [3, 2, 1, 0, 0, 0],
  perStep: 2,
  flat: 15,
  cap: 20,
}

export const DEFAULT_SUBJECTS: readonly string[] = ['Deutsch', 'Mathematik', 'Englisch']

export interface SubjectResult {
  name: string
  amount: number
  /** Grade steps improved (improvement model), 0 otherwise. */
  steps: number
}

export interface ZeugnisgeldResult {
  /** Total before the cap. */
  subtotal: number
  /** Amount after the cap. */
  total: number
  capped: boolean
  subjects: SubjectResult[]
  /** Subjects with a grade entered (and, for improvement, a previous grade). */
  counted: number
}

const euro = (n: number) => Math.round(Math.max(0, n) * 100) / 100

export function isGrade(n: unknown): n is Grade {
  return typeof n === 'number' && (GRADES as readonly number[]).includes(n)
}

export function calculateZeugnisgeld(
  rule: ZeugnisgeldRule,
  rows: readonly SubjectRow[]
): ZeugnisgeldResult {
  const graded = rows.filter((r) => r.grade !== null)
  let subjects: SubjectResult[] = []
  let subtotal = 0

  if (rule.model === 'perGrade') {
    subjects = graded.map((r) => ({
      name: r.name,
      amount: euro(rule.perGrade[(r.grade as Grade) - 1]),
      steps: 0,
    }))
    subtotal = subjects.reduce((sum, s) => sum + s.amount, 0)
  } else if (rule.model === 'improvement') {
    subjects = graded
      .filter((r) => r.previous !== null)
      .map((r) => {
        // Lower is better: from 4 to 2 is two steps. A worse grade earns nothing and
        // takes nothing away.
        const steps = Math.max(0, (r.previous as Grade) - (r.grade as Grade))
        return { name: r.name, amount: euro(steps * rule.perStep), steps }
      })
    subtotal = subjects.reduce((sum, s) => sum + s.amount, 0)
  } else {
    subtotal = graded.length > 0 ? euro(rule.flat) : 0
  }

  subtotal = euro(subtotal)
  const capped = rule.cap !== null && subtotal > rule.cap
  return {
    subtotal,
    total: capped ? euro(rule.cap as number) : subtotal,
    capped,
    subjects,
    counted: rule.model === 'improvement' ? subjects.length : graded.length,
  }
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

/** The rule as one plain German sentence, for the family agreement. */
export function describeRule(rule: ZeugnisgeldRule): string {
  const cap = rule.cap !== null ? ` Höchstens ${formatEuro(rule.cap)} pro Zeugnis.` : ''
  if (rule.model === 'perGrade') {
    const parts = rule.perGrade
      .map((amount, i) => (amount > 0 ? `${formatEuro(amount)} für eine ${i + 1}` : null))
      .filter(Boolean)
    const body = parts.length
      ? `Pro Fach gibt es ${parts.join(', ')}.`
      : 'Für einzelne Noten gibt es kein Geld.'
    return `${body}${cap}`
  }
  if (rule.model === 'improvement') {
    return `Für jede Notenstufe, um die sich ein Fach gegenüber dem letzten Zeugnis verbessert, gibt es ${formatEuro(rule.perStep)}. Eine schlechtere Note kostet nichts.${cap}`
  }
  return `Für das Zeugnis gibt es ${formatEuro(rule.flat)}, unabhängig von den einzelnen Noten.${cap}`
}
