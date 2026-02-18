import { dbg } from '@/lib/debug'
import { correctOcrText, capitalizeProperName } from './ocr-corrections'

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

// School type keywords for heuristic school name detection
const SCHOOL_TYPE_KEYWORDS = [
  'grundschule',
  'volksschule',
  'gymnasium',
  'realschule',
  'hauptschule',
  'gesamtschule',
  'oberschule',
  'mittelschule',
  'förderschule',
  'college',
  'colegio',
  'liceo',
  'instituto',
  'lycée',
  'collège',
  'école',
  'scuola',
  'school',
  'academy',
  'escuela',
  'школа',
  'гимназия',
  'лицей',
]

// Term type keywords
const TERM_KEYWORDS: Record<string, 'midterm' | 'final' | 'semester' | 'quarterly'> = {
  // German
  jahreszeugnis: 'final',
  halbjahreszeugnis: 'semester',
  zwischenzeugnis: 'midterm',
  abschlusszeugnis: 'final',
  versetzungszeugnis: 'final',
  'zeugnis der allgemeinen hochschulreife': 'final',
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
  'annual report': 'final',
  // Italian
  pagella: 'final',
  'pagella finale': 'final',
  'scheda di valutazione': 'final',
  'primo quadrimestre': 'semester',
  'secondo quadrimestre': 'final',
  // Spanish
  'boletín final': 'final',
  'boletín trimestral': 'quarterly',
  'calificaciones finales': 'final',
  'evaluación trimestral': 'quarterly',
  // Russian
  'годовая оценка': 'final',
  годовая: 'final',
  'четвертная оценка': 'quarterly',
  четвертная: 'quarterly',
  полугодовая: 'semester',
  'итоговая аттестация': 'final',
  аттестат: 'final',
}

import type { ScanParserConfig } from '@/lib/db/queries/scan-config'

export type { ScanParserConfig }

const TEXT_MONTH_MAP: Record<string, string> = {
  // German
  januar: '01',
  februar: '02',
  märz: '03',
  april: '04',
  mai: '05',
  juni: '06',
  juli: '07',
  august: '08',
  september: '09',
  oktober: '10',
  november: '11',
  dezember: '12',
  // French
  janvier: '01',
  février: '02',
  mars: '03',
  avril: '04',
  juin: '06',
  juillet: '07',
  août: '08',
  septembre: '09',
  octobre: '10',
  novembre: '11',
  décembre: '12',
  // Spanish
  enero: '01',
  febrero: '02',
  marzo: '03',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  noviembre: '11',
  diciembre: '12',
  // Italian
  gennaio: '01',
  febbraio: '02',
  aprile: '04',
  maggio: '05',
  giugno: '06',
  luglio: '07',
  settembre: '09',
  ottobre: '10',
  // English
  january: '01',
  february: '02',
  march: '03',
  may: '05',
  june: '06',
  july: '07',
  october: '10',
  december: '12',
}

function textMonthToNumber(month: string): string | null {
  return TEXT_MONTH_MAP[month.toLowerCase()] ?? null
}

function normalizeDate(raw: string): string {
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // DD.MM.YYYY or DD/MM/YYYY
  const parts = raw.split(/[./]/)
  if (parts.length === 3) {
    const [d, m, y] = parts
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return raw
}

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

function isBehavioralGrade(subject: string, behavioralGrades: Set<string>): boolean {
  return behavioralGrades.has(subject.toLowerCase().trim())
}

function shouldSkipLine(line: string, skipKeywords: string[]): boolean {
  const lower = line.toLowerCase()
  return skipKeywords.some((kw) => lower.startsWith(kw))
}

/**
 * Token-based two-column splitter.
 * Handles OCR lines like "Deutsch 2 Mathematik 2" where whitespace is normalized
 * to single spaces (the regex-based TWO_COL_PATTERN requires 3+ spaces between columns).
 * Splits into individual (subject, grade) pairs and adds them via tryAddSubject.
 * Returns true if ≥2 pairs were found (i.e. it was indeed a two-column line).
 */
function trySplitTwoColumnTokens(
  line: string,
  confidence: number,
  subjects: ParsedSubject[],
  behavioralGrades: Set<string>
): boolean {
  const tokens = line.split(/\s+/)
  if (tokens.length < 4) return false

  // Find grade-value token positions, respecting parenthetical context like "(1. Fremdsprache)"
  const gradeIndices: number[] = []
  let parenDepth = 0
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    for (const ch of t) {
      if (ch === '(') parenDepth++
      if (ch === ')') parenDepth = Math.max(0, parenDepth - 1)
    }
    if (parenDepth > 0) continue
    if (i === 0) continue // First token must be a subject word, not a grade
    if (isGradeValue(t)) {
      gradeIndices.push(i)
    }
  }

  if (gradeIndices.length < 2) return false

  // Form (subject, grade) pairs from the grade positions
  const pairs: Array<{ subject: string; grade: string }> = []
  let start = 0
  for (const gi of gradeIndices) {
    if (gi <= start) continue
    const subjectStr = tokens.slice(start, gi).join(' ').trim()
    if (subjectStr.length >= 2 && /[a-zA-ZÀ-ÿß]/.test(subjectStr)) {
      pairs.push({ subject: subjectStr, grade: tokens[gi] })
    }
    start = gi + 1
  }

  if (pairs.length < 2) return false

  for (const pair of pairs) {
    tryAddSubject(pair.subject, pair.grade, confidence, subjects, behavioralGrades)
  }
  return true
}

function tryAddSubject(
  subjectName: string,
  grade: string,
  confidence: number,
  subjects: ParsedSubject[],
  behavioralGrades: Set<string>
): void {
  if (subjectName.length < 2) return
  if (isBehavioralGrade(subjectName, behavioralGrades)) return
  if (!isGradeValue(grade)) return
  if (/^\d/.test(subjectName)) return
  subjects.push({ originalName: subjectName, grade, confidence })
}

export function parseOcrText(
  text: string,
  overallConfidence: number,
  config?: ScanParserConfig
): ScanResult {
  const skipKeywords = config?.skipKeywords ?? []
  const behavioralGrades = config?.behavioralGrades ?? new Set<string>()
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const subjects: ParsedSubject[] = []
  const metadata: ScanResult['metadata'] = {}

  let prevLine = ''

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const lowerLine = line.toLowerCase()
    let isMetadataLine = false

    // School name: "Name der Schule" (or similar) is a label printed *below* the school name.
    // When we see that label, the previous non-empty line is the school name.
    if (/^Name\s+der\s+Schule$/i.test(line) && prevLine && !metadata.schoolName) {
      metadata.schoolName = prevLine
      isMetadataLine = true
    }

    // Student name — handles "Vor- und Zuname", "Name:", "Schüler:", "Nom:", "Apellido:", "Фамилия:" etc.
    // Colon is optional because German reports often use spacing only.
    if (!metadata.studentName) {
      const studentMatch = line.match(
        /(?:Vor-?\s*(?:und|u\.?)\s*Zuname|Vorname|Name|Student|Schüler(?:in)?|Élève|Aluno|Alumno|Ученик|Nom|Apellido|Фамилия|Имя)\s*[:：]?\s+(.+)/i
      )
      if (studentMatch) {
        metadata.studentName = capitalizeProperName(correctOcrText(studentMatch[1].trim()))
        isMetadataLine = true
      }
    }

    // Heuristic: 2-3 capitalized words in top 10 lines may be a student name
    if (!metadata.studentName && lineIndex < 10) {
      const nameCandidate = line.match(
        /^([A-ZÄÖÜÀÂÉÈÊËÎÏÔÙÛÇÑ][a-zäöüàâéèêëîïôùûçñß]+(?:\s+[A-ZÄÖÜÀÂÉÈÊËÎÏÔÙÛÇÑ][a-zäöüàâéèêëîïôùûçñß]+){1,2})\s*$/
      )
      if (nameCandidate && !SCHOOL_TYPE_KEYWORDS.some((kw) => line.toLowerCase().includes(kw))) {
        metadata.studentName = capitalizeProperName(correctOcrText(nameCandidate[1]))
        isMetadataLine = true
      }
    }

    // School name via explicit label prefix (e.g. "Schule: …")
    if (!metadata.schoolName) {
      const schoolMatch = line.match(
        /(?:Schule|School|École|Scuola|Escuela|Школа|Gymnasium|Realschule|Hauptschule|Gesamtschule|Lycée|Instituto|Colegio|College|Liceo)\s*[:：]\s*(.+)/i
      )
      if (schoolMatch) {
        metadata.schoolName = correctOcrText(schoolMatch[1].trim())
        isMetadataLine = true
      }
    }

    // Heuristic: school type keyword in line → treat entire line as school name
    if (!metadata.schoolName) {
      const lowerForSchool = line.toLowerCase()
      if (
        SCHOOL_TYPE_KEYWORDS.some((kw) => lowerForSchool.includes(kw)) &&
        line.length > 5 &&
        line.length < 80
      ) {
        metadata.schoolName = correctOcrText(line)
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

    // Date (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, textual European) — shares lines freely
    if (!metadata.date) {
      const dateMatch = line.match(/\b(\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}-\d{2}-\d{2})\b/)
      if (dateMatch) {
        metadata.date = normalizeDate(dateMatch[1])
      } else {
        // European textual formats: "12. Januar 2024", "12 janvier 2024", "15 marzo 2024"
        const textDateMatch = line.match(
          /\b(\d{1,2})\.?\s+(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|gennaio|febbraio|aprile|maggio|giugno|luglio|settembre|ottobre|dicembre|January|February|March|April|May|June|July|August|October|December)\s+(\d{4})\b/i
        )
        if (textDateMatch) {
          const day = textDateMatch[1].padStart(2, '0')
          const monthName = textDateMatch[2].toLowerCase()
          const year = textDateMatch[3]
          const monthNum = textMonthToNumber(monthName)
          if (monthNum) {
            metadata.date = `${year}-${monthNum}-${day}`
          }
        }
      }
    }

    // Term type — check on every line (keyword may appear in document title)
    for (const [keyword, termType] of Object.entries(TERM_KEYWORDS)) {
      if (lowerLine.includes(keyword) && !metadata.termType) {
        metadata.termType = termType
        break
      }
    }

    // Subject extraction — skip lines that are purely metadata or non-grade content
    if (!isMetadataLine && !shouldSkipLine(line, skipKeywords)) {
      // Strategy 1: Regex two-column layout (multi-space separated): "Deutsch  2   Mathematik  2"
      const twoCol = line.match(TWO_COL_PATTERN)
      if (twoCol) {
        tryAddSubject(
          twoCol[1].trim(),
          twoCol[2].trim(),
          overallConfidence,
          subjects,
          behavioralGrades
        )
        tryAddSubject(
          twoCol[3].trim(),
          twoCol[4].trim(),
          overallConfidence,
          subjects,
          behavioralGrades
        )
      }
      // Strategy 2: Token-based two-column split (single-space OCR output): "Deutsch 2 Mathematik 2"
      else if (!trySplitTwoColumnTokens(line, overallConfidence, subjects, behavioralGrades)) {
        // Strategy 3: Single-column patterns
        for (const pattern of GRADE_PATTERNS) {
          const match = line.match(pattern)
          if (match) {
            tryAddSubject(
              match[1].trim(),
              match[2].trim(),
              overallConfidence,
              subjects,
              behavioralGrades
            )
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
