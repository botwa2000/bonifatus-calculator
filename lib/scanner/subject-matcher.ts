import { db } from '@/lib/db/client'
import { subjects } from '@/drizzle/schema/grades'
import { eq } from 'drizzle-orm'
import type { ParsedSubject } from './text-parser'

const LOCALES = ['en', 'de', 'fr', 'it', 'es', 'ru'] as const

type DbSubject = {
  id: string
  code: string | null
  name: Record<string, string>
  categoryId: string | null
  isCoreSubject: boolean | null
}

export type MatchedSubject = ParsedSubject & {
  matchedSubjectId?: string
  matchedSubjectName?: string
  matchConfidence: 'high' | 'medium' | 'low' | 'none'
}

let subjectCache: DbSubject[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function loadSubjects(): Promise<DbSubject[]> {
  if (subjectCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return subjectCache
  }
  const rows = await db.select().from(subjects).where(eq(subjects.isActive, true))

  subjectCache = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: (r.name || {}) as Record<string, string>,
    categoryId: r.categoryId,
    isCoreSubject: r.isCoreSubject,
  }))
  cacheTimestamp = Date.now()
  return subjectCache
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[/\\()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findMatch(
  originalName: string,
  allSubjects: DbSubject[]
): { id: string; name: string; confidence: 'high' | 'medium' | 'low' } | null {
  const normalized = normalizeForComparison(originalName)

  // Strategy 1: Exact match in any locale
  for (const subj of allSubjects) {
    for (const locale of LOCALES) {
      const localeName = subj.name[locale]
      if (localeName && normalizeForComparison(localeName) === normalized) {
        return { id: subj.id, name: localeName, confidence: 'high' }
      }
    }
  }

  // Strategy 2: Case-insensitive startsWith or contains match
  for (const subj of allSubjects) {
    for (const locale of LOCALES) {
      const localeName = subj.name[locale]
      if (!localeName) continue
      const normLocal = normalizeForComparison(localeName)

      // Check if OCR text starts with subject name or vice versa
      if (normLocal.startsWith(normalized) || normalized.startsWith(normLocal)) {
        return { id: subj.id, name: localeName, confidence: 'medium' }
      }
    }
  }

  // Strategy 3: Fuzzy contains match (subject name appears within OCR text)
  for (const subj of allSubjects) {
    for (const locale of LOCALES) {
      const localeName = subj.name[locale]
      if (!localeName) continue
      const normLocal = normalizeForComparison(localeName)

      if (normLocal.length >= 3 && normalized.includes(normLocal)) {
        return { id: subj.id, name: localeName, confidence: 'low' }
      }
      if (normalized.length >= 3 && normLocal.includes(normalized)) {
        return { id: subj.id, name: localeName, confidence: 'low' }
      }
    }
  }

  return null
}

export async function matchSubjects(parsed: ParsedSubject[]): Promise<MatchedSubject[]> {
  const allSubjects = await loadSubjects()

  return parsed.map((p) => {
    const match = findMatch(p.originalName, allSubjects)
    if (match) {
      return {
        ...p,
        matchedSubjectId: match.id,
        matchedSubjectName: match.name,
        matchConfidence: match.confidence,
      }
    }
    return {
      ...p,
      matchConfidence: 'none' as const,
    }
  })
}
