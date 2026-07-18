export interface AllowanceEntry {
  ageMin: number
  ageMax: number
  monthlyEur: number
  weeklyEur: number
}

export const DJI_ALLOWANCE_TABLE: AllowanceEntry[] = [
  { ageMin: 4, ageMax: 5, monthlyEur: 5, weeklyEur: 1.25 },
  { ageMin: 6, ageMax: 6, monthlyEur: 10, weeklyEur: 2.5 },
  { ageMin: 7, ageMax: 7, monthlyEur: 12, weeklyEur: 3 },
  { ageMin: 8, ageMax: 8, monthlyEur: 14, weeklyEur: 3.5 },
  { ageMin: 9, ageMax: 9, monthlyEur: 18, weeklyEur: 4.5 },
  { ageMin: 10, ageMax: 10, monthlyEur: 22, weeklyEur: 5.5 },
  { ageMin: 11, ageMax: 11, monthlyEur: 25, weeklyEur: 6.25 },
  { ageMin: 12, ageMax: 12, monthlyEur: 30, weeklyEur: 7.5 },
  { ageMin: 13, ageMax: 13, monthlyEur: 35, weeklyEur: 8.75 },
  { ageMin: 14, ageMax: 14, monthlyEur: 40, weeklyEur: 10 },
  { ageMin: 15, ageMax: 15, monthlyEur: 50, weeklyEur: 12.5 },
  { ageMin: 16, ageMax: 16, monthlyEur: 60, weeklyEur: 15 },
  { ageMin: 17, ageMax: 17, monthlyEur: 75, weeklyEur: 18.75 },
  { ageMin: 18, ageMax: 21, monthlyEur: 100, weeklyEur: 25 },
]

export function getAllowanceForAge(age: number): AllowanceEntry | null {
  return DJI_ALLOWANCE_TABLE.find((e) => age >= e.ageMin && age <= e.ageMax) ?? null
}
