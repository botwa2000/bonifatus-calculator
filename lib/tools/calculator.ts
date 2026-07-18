export type GradingSystemId = 'german' | 'us' | 'french' | 'percentage' | 'swiss' | 'austrian'

export interface GradingSystem {
  id: GradingSystemId
  grades: string[]
  percentages: number[]
}

export const GRADING_SYSTEMS: Record<GradingSystemId, GradingSystem> = {
  german: {
    id: 'german',
    grades: ['1', '2', '3', '4', '5', '6'],
    percentages: [100, 80, 60, 40, 20, 0],
  },
  us: {
    id: 'us',
    grades: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    percentages: [100, 95, 90, 87, 83, 80, 77, 73, 70, 60, 0],
  },
  french: {
    id: 'french',
    grades: [
      '20',
      '19',
      '18',
      '17',
      '16',
      '15',
      '14',
      '13',
      '12',
      '11',
      '10',
      '9',
      '8',
      '7',
      '6',
      '5',
      '4',
      '3',
      '2',
      '1',
      '0',
    ],
    percentages: [
      100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0,
    ],
  },
  percentage: {
    id: 'percentage',
    grades: [
      '100%',
      '95%',
      '90%',
      '85%',
      '80%',
      '75%',
      '70%',
      '65%',
      '60%',
      '55%',
      '50%',
      '40%',
      '30%',
      '0%',
    ],
    percentages: [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 40, 30, 0],
  },
  swiss: {
    id: 'swiss',
    grades: ['6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1'],
    percentages: [100, 90, 80, 70, 60, 50, 40, 30, 15, 0],
  },
  austrian: {
    id: 'austrian',
    grades: ['1', '2', '3', '4', '5'],
    percentages: [100, 80, 60, 40, 0],
  },
}

export type Tier = 'excellent' | 'good' | 'satisfactory' | 'insufficient'

export const TIER_THRESHOLDS = {
  excellent: 80,
  good: 60,
  satisfactory: 40,
} as const

export function getTier(percentage: number): Tier {
  if (percentage >= TIER_THRESHOLDS.excellent) return 'excellent'
  if (percentage >= TIER_THRESHOLDS.good) return 'good'
  if (percentage >= TIER_THRESHOLDS.satisfactory) return 'satisfactory'
  return 'insufficient'
}

export interface SubjectInput {
  name: string
  grade: string
  systemId: GradingSystemId
}

export interface SubjectResult {
  name: string
  grade: string
  percentage: number
  tier: Tier
}

export interface CalculatorResult {
  subjects: SubjectResult[]
  averagePercentage: number
  tier: Tier
}

export function gradeToPercentage(grade: string, systemId: GradingSystemId): number {
  const system = GRADING_SYSTEMS[systemId]
  const idx = system.grades.indexOf(grade)
  if (idx === -1) return 0
  return system.percentages[idx]
}

export function calculateRewards(subjects: SubjectInput[]): CalculatorResult {
  if (subjects.length === 0) {
    return { subjects: [], averagePercentage: 0, tier: 'insufficient' }
  }

  const results: SubjectResult[] = subjects.map((s) => {
    const percentage = gradeToPercentage(s.grade, s.systemId)
    return {
      name: s.name,
      grade: s.grade,
      percentage,
      tier: getTier(percentage),
    }
  })

  const avg = results.reduce((sum, r) => sum + r.percentage, 0) / results.length

  return {
    subjects: results,
    averagePercentage: Math.round(avg),
    tier: getTier(avg),
  }
}
