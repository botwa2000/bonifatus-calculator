export type ParsedSubject = {
  originalName: string
  grade: string
  confidence: number
}

export type ScanResult = {
  subjects: ParsedSubject[]
  metadata: {
    schoolYear?: string
    classLevel?: number
    studentName?: string
    termType?: 'midterm' | 'final' | 'semester' | 'quarterly'
    schoolName?: string
  }
  rawText: string
  overallConfidence: number
}

// Grade patterns for different systems
const GRADE_PATTERNS = [
  // German: "Deutsch 2" or "Deutsch: 2" or "Deutsch  2+"
  /^(.+?)\s*[:：]?\s+(\d[+-]?)$/,
  // French: "Français 15/20" or "Français: 15"
  /^(.+?)\s*[:：]?\s+(\d{1,2}(?:\/20)?)$/,
  // Letter grades: "Mathematics A+" or "Math: B-"
  /^(.+?)\s*[:：]?\s+([A-F][*+-]?)$/i,
  // UK GCSE: "English 9" or "Maths: 7"
  /^(.+?)\s*[:：]?\s+([1-9])$/,
  // Percentage: "Science 85%" or "Math: 92%"
  /^(.+?)\s*[:：]?\s+(\d{1,3}%?)$/,
  // Swiss: "Deutsch 5.5"
  /^(.+?)\s*[:：]?\s+(\d\.\d)$/,
  // Tab or multi-space separated: "Deutsch    2"
  /^(.+?)\t+(\S+)$/,
]

// Term type keywords
const TERM_KEYWORDS: Record<string, 'midterm' | 'final' | 'semester' | 'quarterly'> = {
  // German
  jahreszeugnis: 'final',
  halbjahreszeugnis: 'semester',
  zwischenzeugnis: 'midterm',
  // French
  'bulletin annuel': 'final',
  'bulletin semestriel': 'semester',
  'bulletin trimestriel': 'quarterly',
  // English
  'final report': 'final',
  'end of year': 'final',
  'mid-term': 'midterm',
  'mid term': 'midterm',
  midterm: 'midterm',
  semester: 'semester',
  quarterly: 'quarterly',
  // Italian
  pagella: 'final',
  'pagella finale': 'final',
  // Spanish
  'boletín final': 'final',
  'boletín trimestral': 'quarterly',
}

// Subject aliases for common OCR outputs (OCR often mis-reads specific characters)
const BEHAVIORAL_GRADES = new Set([
  'verhalten',
  'mitarbeit',
  'betragen',
  'fleiss',
  'fleiß',
  'ordnung',
  'sozialverhalten',
  'arbeitsverhalten',
  'behavior',
  'behaviour',
  'conduct',
  'effort',
  'comportement',
  'conduite',
  'comportamento',
  'condotta',
  'comportamiento',
  'conducta',
])

function isGradeValue(text: string): boolean {
  const trimmed = text.trim()
  // Numeric grades 1-20, with optional +/-
  if (/^\d{1,2}[+-]?$/.test(trimmed)) return true
  // Letter grades A-F with optional +/-/*
  if (/^[A-Fa-f][*+-]?$/.test(trimmed)) return true
  // Percentage
  if (/^\d{1,3}%$/.test(trimmed)) return true
  // Swiss decimal grades
  if (/^\d\.\d$/.test(trimmed)) return true
  // French /20 format
  if (/^\d{1,2}\/20$/.test(trimmed)) return true
  return false
}

function isBehavioralGrade(subject: string): boolean {
  return BEHAVIORAL_GRADES.has(subject.toLowerCase().trim())
}

export function parseOcrText(text: string, overallConfidence: number): ScanResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const subjects: ParsedSubject[] = []
  const metadata: ScanResult['metadata'] = {}

  for (const line of lines) {
    // Extract school year
    const yearMatch = line.match(/(\d{4})\s*[/–-]\s*(\d{2,4})/)
    if (yearMatch && !metadata.schoolYear) {
      const y1 = yearMatch[1]
      const y2 = yearMatch[2].length === 2 ? yearMatch[1].slice(0, 2) + yearMatch[2] : yearMatch[2]
      metadata.schoolYear = `${y1}-${y2}`
      continue
    }

    // Extract class level
    const classMatch = line.match(
      /(?:Klasse|Classe|Class|Grade|Grado|Класс|Stufe)\s*[:：]?\s*(\d{1,2})/i
    )
    if (classMatch && !metadata.classLevel) {
      metadata.classLevel = parseInt(classMatch[1], 10)
      continue
    }

    // Detect term type
    const lowerLine = line.toLowerCase()
    for (const [keyword, termType] of Object.entries(TERM_KEYWORDS)) {
      if (lowerLine.includes(keyword) && !metadata.termType) {
        metadata.termType = termType
        break
      }
    }

    // Try to extract subject-grade pairs
    for (const pattern of GRADE_PATTERNS) {
      const match = line.match(pattern)
      if (match) {
        const subjectName = match[1].trim()
        const grade = match[2].trim()

        // Skip if the "subject" is too short or is a behavioral grade
        if (subjectName.length < 2) continue
        if (isBehavioralGrade(subjectName)) continue
        if (!isGradeValue(grade)) continue

        // Skip lines that look like metadata
        if (/^\d/.test(subjectName)) continue

        subjects.push({
          originalName: subjectName,
          grade,
          confidence: overallConfidence,
        })
        break // Only match first pattern per line
      }
    }
  }

  return {
    subjects,
    metadata,
    rawText: text,
    overallConfidence,
  }
}
