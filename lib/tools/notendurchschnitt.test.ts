import { describe, expect, it } from 'vitest'
import { bavariaEligibility, calculateAverage, truncate2 } from './notendurchschnitt'

describe('calculateAverage', () => {
  it('averages entered grades and ignores empty or invalid ones', () => {
    const r = calculateAverage([
      { name: 'Deutsch', grade: 2, weight: 1 },
      { name: 'Mathe', grade: 3, weight: 1 },
      { name: 'Englisch', grade: 1, weight: 1 },
      { name: 'Sport', grade: null, weight: 1 },
      { name: 'Kunst', grade: 7, weight: 1 },
    ])
    expect(r.exact).toBe(2)
    expect(r.counted).toBe(3)
  })

  it('weights subjects', () => {
    const r = calculateAverage([
      { name: 'Deutsch', grade: 2, weight: 2 },
      { name: 'Mathe', grade: 3, weight: 2 },
      { name: 'Englisch', grade: 2, weight: 1 },
      { name: 'Sport', grade: 1, weight: 1 },
    ])
    expect(r.exact).toBeCloseTo(13 / 6)
    expect(r.truncated).toBe(2.16)
  })

  it('returns nulls when nothing is entered', () => {
    expect(calculateAverage([{ name: 'Deutsch', grade: null, weight: 1 }]).exact).toBeNull()
  })
})

describe('truncate2 and the Bavarian thresholds', () => {
  it('cuts off instead of rounding, as the Grundschulordnung values 2,33 and 2,66 imply', () => {
    expect(truncate2(7 / 3)).toBe(2.33)
    expect(truncate2(8 / 3)).toBe(2.66)
    expect(truncate2(2)).toBe(2)
    expect(truncate2(0.29 * 10)).toBe(2.9)
  })

  it('classifies the three-subject average', () => {
    expect(bavariaEligibility(truncate2((2 + 2 + 3) / 3))).toBe('gymnasium')
    expect(bavariaEligibility(truncate2((2 + 3 + 3) / 3))).toBe('realschule')
    expect(bavariaEligibility(truncate2((3 + 3 + 3) / 3))).toBe('none')
  })
})
