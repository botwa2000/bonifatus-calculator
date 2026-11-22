import { describe, expect, it } from 'vitest'
import { calculateZeugnisgeld, DEFAULT_RULE, describeRule, type SubjectRow } from './zeugnisgeld'

const rows: SubjectRow[] = [
  { name: 'Deutsch', grade: 2, previous: 3 },
  { name: 'Mathematik', grade: 1, previous: 3 },
  { name: 'Englisch', grade: 4, previous: 3 },
  { name: 'Sachunterricht', grade: null, previous: 2 },
]

describe('calculateZeugnisgeld', () => {
  it('per grade: sums the amount for each entered grade', () => {
    const r = calculateZeugnisgeld({ ...DEFAULT_RULE, cap: null }, rows)
    expect(r.subjects.map((s) => s.amount)).toEqual([2, 3, 0])
    expect(r.total).toBe(5)
    expect(r.counted).toBe(3)
  })

  it('improvement: pays per step improved, never negative, skips rows without both grades', () => {
    const r = calculateZeugnisgeld({ ...DEFAULT_RULE, model: 'improvement', cap: null }, rows)
    expect(r.subjects.map((s) => s.steps)).toEqual([1, 2, 0])
    expect(r.total).toBe(6)
    expect(r.counted).toBe(3)
  })

  it('flat: fixed amount once any grade is entered, zero before', () => {
    const rule = { ...DEFAULT_RULE, model: 'flat' as const, cap: null }
    expect(calculateZeugnisgeld(rule, rows).total).toBe(15)
    expect(
      calculateZeugnisgeld(rule, [{ name: 'Deutsch', grade: null, previous: null }]).total
    ).toBe(0)
  })

  it('applies the cap and reports it', () => {
    const r = calculateZeugnisgeld(
      { ...DEFAULT_RULE, perGrade: [10, 10, 10, 0, 0, 0], cap: 20 },
      rows
    )
    expect(r.subtotal).toBe(20)
    expect(r.capped).toBe(false)
    const r2 = calculateZeugnisgeld(
      { ...DEFAULT_RULE, perGrade: [10, 10, 10, 10, 0, 0], cap: 20 },
      rows
    )
    expect(r2.subtotal).toBe(30)
    expect(r2.total).toBe(20)
    expect(r2.capped).toBe(true)
  })

  it('ignores negative amounts and rounds to cents', () => {
    const r = calculateZeugnisgeld(
      { ...DEFAULT_RULE, perGrade: [1.005, -5, 0, 0, 0, 0], cap: null },
      rows
    )
    expect(r.total).toBe(1)
  })
})

describe('describeRule', () => {
  it('names every paid grade and the cap', () => {
    const text = describeRule(DEFAULT_RULE)
    expect(text).toContain('für eine 1')
    expect(text).toContain('für eine 3')
    expect(text).not.toContain('für eine 4')
    expect(text).toContain('Höchstens 20,00')
  })
})
