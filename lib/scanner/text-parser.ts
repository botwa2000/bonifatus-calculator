import { dbg } from '@/lib/debug'

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
    date?: string
  }
  rawText: string
  overallConfidence: number
}

// Grade patterns for different systems (single-column)
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

// Two-column layout: "Deutsch 2   Mathematik 2" — OCR merges columns separated by whitespace
// Captures: subject1, grade1, subject2, grade2
const TWO_COL_PATTERN =
  /^(.+?)\s{2,}(\d[+-]?|\d\.\d|\d{1,2}\/20|\d{1,3}%|[A-F][*+-]?)\s{3,}(.+?)\s{2,}(\d[+-]?|\d\.\d|\d{1,2}\/20|\d{1,3}%|[A-F][*+-]?)\s*$/i

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

function tryAddSubject(
  subjectName: string,
  grade: string,
  confidence: number,
  subjects: ParsedSubject[]
): void {
  if (subjectName.length < 2) return
  if (isBehavioralGrade(subjectName)) return
  if (!isGradeValue(grade)) return
  if (/^\d/.test(subjectName)) return
  subjects.push({ originalName: subjectName, grade, confidence })
}

export function parseOcrText(text: string, overallConfidence: number): ScanResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const subjects: ParsedSubject[] = []
  const metadata: ScanResult['metadata'] = {}

  let prevLine = ''

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    let isMetadataLine = false

    // School name: "Name der Schule" (or similar) is a label printed *below* the school name.
    // When we see that label, the previous non-empty line is the school name.
    if (/^Name\s+der\s+Schule$/i.test(line) && prevLine && !metadata.schoolName) {
      metadata.schoolName = prevLine
      isMetadataLine = true
    }

    // Student name — handles "Vor- und Zuname", "Name:", "Schüler:" etc.
    // Colon is optional because German reports often use spacing only.
    if (!metadata.studentName) {
      const studentMatch = line.match(
        /(?:Vor-?\s*(?:und|u\.?)\s*Zuname|Vorname|Name|Student|Schüler(?:in)?|Élève|Aluno|Alumno|Ученик)\s*[:：]?\s+(.+)/i
      )
      if (studentMatch) {
        metadata.studentName = studentMatch[1].trim()
        isMetadataLine = true
      }
    }

    // School name via explicit label prefix (e.g. "Schule: …")
    if (!metadata.schoolName) {
      const schoolMatch = line.match(
        /(?:Schule|School|École|Scuola|Escuela|Школа|Gymnasium|Realschule|Hauptschule|Gesamtschule|Lycée|Instituto)\s*[:：]\s*(.+)/i
      )
      if (schoolMatch) {
        metadata.schoolName = schoolMatch[1].trim()
        isMetadataLine = true
      }
    }

    // School year — do NOT use continue so class level can match on the same line
    if (!metadata.schoolYear) {
      const yearMatch = line.match(/(\d{4})\s*[/–-]\s*(\d{2,4})/)
      if (yearMatch) {
        const y1 = yearMatch[1]
        const y2 =
          yearMatch[2].length === 2 ? yearMatch[1].slice(0, 2) + yearMatch[2] : yearMatch[2]
        metadata.schoolYear = `${y1}-${y2}`
        isMetadataLine = true
      }
    }

    // Class level — also no continue, so year + class on one line both get extracted
    if (!metadata.classLevel) {
      const classMatch = line.match(
        /(?:Klasse|Classe|Class|Grade|Grado|Класс|Stufe)\s*[:：]?\s*(\d{1,2})/i
      )
      if (classMatch) {
        metadata.classLevel = parseInt(classMatch[1], 10)
        isMetadataLine = true
      }
    }

    // Date (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD) — shares lines freely
    if (!metadata.date) {
      const dateMatch = line.match(/\b(\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}-\d{2}-\d{2})\b/)
      if (dateMatch) {
        metadata.date = dateMatch[1]
      }
    }

    // Term type — check on every line (keyword may appear in document title)
    for (const [keyword, termType] of Object.entries(TERM_KEYWORDS)) {
      if (lowerLine.includes(keyword) && !metadata.termType) {
        metadata.termType = termType
        break
      }
    }

    // Subject extraction — skip lines that are purely metadata
    if (!isMetadataLine) {
      // Try two-column layout first: "Deutsch 2   Mathematik 2"
      const twoCol = line.match(TWO_COL_PATTERN)
      if (twoCol) {
        tryAddSubject(twoCol[1].trim(), twoCol[2].trim(), overallConfidence, subjects)
        tryAddSubject(twoCol[3].trim(), twoCol[4].trim(), overallConfidence, subjects)
      } else {
        // Single-column patterns
        for (const pattern of GRADE_PATTERNS) {
          const match = line.match(pattern)
          if (match) {
            tryAddSubject(match[1].trim(), match[2].trim(), overallConfidence, subjects)
            break
          }
        }
      }
    }

    prevLine = line
  }

  dbg('scanner', 'extracted metadata', {
    studentName: metadata.studentName ?? '(not found)',
    schoolName: metadata.schoolName ?? '(not found)',
    schoolYear: metadata.schoolYear ?? '(not found)',
    classLevel: metadata.classLevel ?? '(not found)',
    termType: metadata.termType ?? '(not found)',
    date: metadata.date ?? '(not found)',
  })

  dbg('scanner', 'extracted subjects', {
    count: subjects.length,
    subjects: subjects.map((s) => ({
      name: s.originalName,
      grade: s.grade,
      ocrConfidence: Math.round(s.confidence),
    })),
  })

  return {
    subjects,
    metadata,
    rawText: text,
    overallConfidence,
  }
}
