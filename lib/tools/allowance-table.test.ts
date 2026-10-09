import { describe, expect, it } from 'vitest'
import { DJI_ALLOWANCE_TABLE, convertRange, getAllowanceForAge } from '@/lib/tools/allowance-table'

describe('DJI 2025 pocket-money table', () => {
  it('matches the published recommendations (Chabursky & Langmeyer 2025, p. 6)', () => {
    expect(
      DJI_ALLOWANCE_TABLE.map((e) => [e.ageMin, e.ageMax, e.minEur, e.maxEur, e.period])
    ).toEqual([
      [0, 5, 1, 2, 'week'],
      [6, 7, 2, 3, 'week'],
      [8, 9, 3, 4, 'week'],
      [10, 11, 15, 25, 'month'],
      [12, 13, 20, 30, 'month'],
      [14, 15, 25, 45, 'month'],
      [16, 17, 40, 60, 'month'],
      [18, null, 55, 75, 'month'],
    ])
  })

  it('covers every age without gaps or overlaps', () => {
    for (let age = 0; age <= 25; age++) {
      const matches = DJI_ALLOWANCE_TABLE.filter(
        (e) => age >= e.ageMin && (e.ageMax === null || age <= e.ageMax)
      )
      expect(matches).toHaveLength(1)
    }
    expect(getAllowanceForAge(16)?.dependentOnly).toBe(true)
    expect(getAllowanceForAge(15)?.dependentOnly).toBeUndefined()
  })

  it('converts between weekly and monthly amounts', () => {
    expect(convertRange(getAllowanceForAge(8)!)).toEqual({
      minEur: 13,
      maxEur: 17,
      period: 'month',
    })
    expect(convertRange(getAllowanceForAge(10)!)).toEqual({
      minEur: 3.5,
      maxEur: 6,
      period: 'week',
    })
  })
})
