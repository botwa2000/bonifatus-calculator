const TERM_KEY_MAP: Record<string, string> = {
  midterm: 'midterm',
  final: 'final',
  semester: 'semester',
  quarterly: 'quarterly',
  semester_1: 'semester1',
  semester_2: 'semester2',
}

export function formatTermType(type: string, tCalc: (key: string) => string): string {
  const key = TERM_KEY_MAP[type.toLowerCase()]
  return key ? tCalc(key) : type.replace(/_/g, ' ')
}
