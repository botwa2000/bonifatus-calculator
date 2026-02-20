import { dbg } from '@/lib/debug'
import { correctOcrText, capitalizeProperName } from './ocr-corrections'
import type { ScanParserConfig } from '@/lib/db/queries/scan-config'

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
    termType?: string
    schoolName?: string
    date?: string
  }
  rawText: string
  overallConfidence: number
}

export type { ScanParserConfig }

// Grade patterns for different systems (single-column) — structural regex, not data
const GRADE_PATTERNS = [
  /^(.+?)\s*[:：]?\s+(\d[+-]?)$/,
  /^(.+?)\s*[:：]?\s+(\d{1,2}(?:\/20)?)$/,
  /^(.+?)\s*[:：]?\s+([A-F][*+-]?)$/i,
  /^(.+?)\s*[:：]?\s+([1-9])$/,
  /^(.+?)\s*[:：]?\s+(\d{1,3}%?)$/,
  /^(.+?)\s*[:：]?\s+(\d\.\d)$/,
  /^(.+?)\t+(\S+)$/,
]

/**
 * Strip dot leaders, underscores, and similar fill characters between subject and grade.
 * E.g. "Informatik .......................... 5" → "Informatik 5"
 * Also handles "Informatik___________5" and "Informatik · · · · · 5"
 */
function stripDotLeaders(line: string): string {
  // Replace sequences of 3+ dots, middle dots, underscores, or dashes used as fill
  return line
    .replace(/[.·_]{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * For lines with two numbers at the end (e.g. "Punkte" + "Note" columns),
 * extract subject + last grade. Returns null if not applicable.
 * Example: "Informatik 03 5" → { subject: "Informatik", grade: "5" }
 */
function tryDualGradeColumn(line: string): { subject: string; grade: string } | null {
  const match = line.match(/^(.+?)\s+(\d{1,2})\s+(\d[+-]?)$/)
  if (!match) return null
  const subject = match[1].trim()
  const grade = match[3] // Take the last (Note) column
  if (subject.length < 2 || /^\d/.test(subject)) return null
  return { subject, grade }
}

// Two-column layout pattern — structural regex
const TWO_COL_PATTERN =
  /^(.+?)\s{2,}(\d[+-]?|\d\.\d|\d{1,2}\/20|\d{1,3}%|[A-F][*+-]?)\s{3,}(.+?)\s{2,}(\d[+-]?|\d\.\d|\d{1,2}\/20|\d{1,3}%|[A-F][*+-]?)\s*$/i

/** Escape special regex characters in a string for use in new RegExp() */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build a regex from DB labels that matches lines like "Label: value" or "Label value".
 * Returns null if the label list is empty.
 */
function buildLabelRegex(labels: string[]): RegExp | null {
  if (!labels.length) return null
  const alternation = labels.map(escapeRegex).join('|')
  return new RegExp(`(?:${alternation})\\s*[:：]?\\s+(.+)`, 'i')
}

/**
 * Build a regex for textual dates using DB month names.
 * Matches patterns like "12. Januar 2024" or "15 mars 2024".
 */
function buildTextDateRegex(monthNames: Record<string, string>): RegExp | null {
  const months = Object.keys(monthNames)
  if (!months.length) return null
  const alternation = months.map(escapeRegex).join('|')
  return new RegExp(`\\b(\\d{1,2})\\.?\\s+(${alternation})\\s+(\\d{4})\\b`, 'i')
}

function normalizeDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
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
  if (/^\d{1,2}[+-]?$/.test(trimmed)) return true
  if (/^[A-Fa-f][*+-]?$/.test(trimmed)) return true
  if (/^\d{1,3}%$/.test(trimmed)) return true
  if (/^\d\.\d$/.test(trimmed)) return true
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

function trySplitTwoColumnTokens(
  line: string,
  confidence: number,
  subjects: ParsedSubject[],
  behavioralGrades: Set<string>
): boolean {
  const tokens = line.split(/\s+/)
  if (tokens.length < 4) return false

  const gradeIndices: number[] = []
  let parenDepth = 0
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    for (const ch of t) {
      if (ch === '(') parenDepth++
      if (ch === ')') parenDepth = Math.max(0, parenDepth - 1)
    }
    if (parenDepth > 0) continue
    if (i === 0) continue
    if (isGradeValue(t)) {
      gradeIndices.push(i)
    }
  }

  if (gradeIndices.length < 2) return false

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
  // Strip OCR artifacts from dot leaders, bordered cells, and repeated noise chars
  const cleanName = subjectName
    .replace(/\.\s+.{1,6}$/, '') // "BIOIOGIE. rr" → "BIOIOGIE" (dot leader artifacts)
    .replace(/\s+(.)\1{1,}$/, '') // "GOSCHICHIE rrr" → "GOSCHICHIE" (repeated char noise)
    .replace(/["'*;:.]+$/g, '') // trailing punctuation including dots
    .trim()
  if (cleanName.length < 2) return
  if (isBehavioralGrade(cleanName, behavioralGrades)) return
  if (!isGradeValue(grade)) return
  if (/^\d/.test(cleanName)) return
  subjects.push({ originalName: cleanName, grade, confidence })
}

export function parseOcrText(
  text: string,
  overallConfidence: number,
  config?: ScanParserConfig
): ScanResult {
  const skipKeywords = config?.skipKeywords ?? []
  const behavioralGrades = config?.behavioralGrades ?? new Set<string>()
  const schoolTypeKeywords = config?.schoolTypeKeywords ?? []
  const termKeywords = config?.termKeywords ?? {}
  const monthNames = config?.monthNames ?? {}
  const studentNameLabels = config?.studentNameLabels ?? []
  const schoolNameLabels = config?.schoolNameLabels ?? []

  // Build dynamic regexes from DB-stored labels
  const studentNameRegex = buildLabelRegex(studentNameLabels)
  const schoolNameRegex = buildLabelRegex(schoolNameLabels)
  const textDateRegex = buildTextDateRegex(monthNames)

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

    // School name: "Name der Schule" label — previous line is the school name
    if (/^Name\s+der\s+Schule$/i.test(line) && prevLine && !metadata.schoolName) {
      metadata.schoolName = prevLine
      isMetadataLine = true
    }

    // Student name via DB-configured labels
    if (!metadata.studentName && studentNameRegex) {
      const studentMatch = line.match(studentNameRegex)
      if (studentMatch) {
        metadata.studentName = capitalizeProperName(correctOcrText(studentMatch[1].trim()))
        isMetadataLine = true
      }
    }

    // Berlin format: "für Vorname Nachname geboren am DD.MM.YYYY"
    if (!metadata.studentName && lineIndex < 15) {
      const berlinName = line.match(
        /f[üuia]{1,2}r\s+([A-ZÄÖÜa-zäöüß]+\s+[A-ZÄÖÜa-zäöüß]+(?:\s+[A-ZÄÖÜa-zäöüß]+)?)\s+geboren/i
      )
      if (berlinName) {
        metadata.studentName = capitalizeProperName(correctOcrText(berlinName[1].trim()))
        isMetadataLine = true
      }
    }

    // Heuristic: 2-3 capitalized words in top 10 lines may be a student name
    if (!metadata.studentName && lineIndex < 10) {
      const nameCandidate = line.match(
        /^([A-ZÄÖÜÀÂÉÈÊËÎÏÔÙÛÇÑ][a-zäöüàâéèêëîïôùûçñß]+(?:\s+[A-ZÄÖÜÀÂÉÈÊËÎÏÔÙÛÇÑ][a-zäöüàâéèêëîïôùûçñß]+){1,2})\s*$/
      )
      if (nameCandidate && !schoolTypeKeywords.some((kw) => line.toLowerCase().includes(kw))) {
        metadata.studentName = capitalizeProperName(correctOcrText(nameCandidate[1]))
        isMetadataLine = true
      }
    }

    // School name via DB-configured labels
    if (!metadata.schoolName && schoolNameRegex) {
      const schoolMatch = line.match(schoolNameRegex)
      if (schoolMatch) {
        metadata.schoolName = correctOcrText(schoolMatch[1].trim())
        isMetadataLine = true
      }
    }

    // Heuristic: school type keyword in line → treat entire line as school name
    if (!metadata.schoolName) {
      const lowerForSchool = line.toLowerCase()
      if (
        schoolTypeKeywords.some((kw) => lowerForSchool.includes(kw)) &&
        line.length > 5 &&
        line.length < 80
      ) {
        metadata.schoolName = correctOcrText(line)
        isMetadataLine = true
      }
    }

    // School year
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

    // Class level
    if (!metadata.classLevel) {
      const classMatch = line.match(
        /(?:Klasse|Classe|Class|Grade|Grado|Класс|Stufe|Jahrgangsstufe)\s*[:：]?\s*(\d{1,2})/i
      )
      if (classMatch) {
        metadata.classLevel = parseInt(classMatch[1], 10)
        isMetadataLine = true
      }
    }

    // Date (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, textual European)
    if (!metadata.date) {
      const dateMatch = line.match(/\b(\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}-\d{2}-\d{2})\b/)
      if (dateMatch) {
        metadata.date = normalizeDate(dateMatch[1])
      } else if (textDateRegex) {
        const textDateMatch = line.match(textDateRegex)
        if (textDateMatch) {
          const day = textDateMatch[1].padStart(2, '0')
          const monthName = textDateMatch[2].toLowerCase()
          const year = textDateMatch[3]
          const monthNum = monthNames[monthName] ?? null
          if (monthNum) {
            metadata.date = `${year}-${monthNum}-${day}`
          }
        }
      }
    }

    // Term type — check DB-loaded keywords
    for (const [keyword, termType] of Object.entries(termKeywords)) {
      if (lowerLine.includes(keyword) && !metadata.termType) {
        metadata.termType = termType
        break
      }
    }

    // Subject extraction
    if (!isMetadataLine && !shouldSkipLine(line, skipKeywords)) {
      // Pre-process: strip dot leaders for cleaner matching
      const cleanLine = stripDotLeaders(line)

      const twoCol = cleanLine.match(TWO_COL_PATTERN)
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
      } else {
        // Try dual-grade column (Punkte + Note format)
        const dualGrade = tryDualGradeColumn(cleanLine)
        if (dualGrade) {
          tryAddSubject(
            dualGrade.subject,
            dualGrade.grade,
            overallConfidence,
            subjects,
            behavioralGrades
          )
        } else if (
          !trySplitTwoColumnTokens(cleanLine, overallConfidence, subjects, behavioralGrades)
        ) {
          for (const pattern of GRADE_PATTERNS) {
            const match = cleanLine.match(pattern)
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
