import { db } from '@/lib/db/client'
import { scanConfig } from '@/drizzle/schema/scanConfig'
import { subjects } from '@/drizzle/schema/grades'
import { eq } from 'drizzle-orm'

export type ScanParserConfig = {
  skipKeywords: string[]
  behavioralGrades: Set<string>
  ocrSubstitutions: [string, string][]
  umlautMap: Record<string, string>
  schoolTypeKeywords: string[]
  termKeywords: Record<string, string>
  monthNames: Record<string, string>
  studentNameLabels: string[]
  schoolNameLabels: string[]
  localeLanguages: Record<string, string>
  countryLanguages: Record<string, string>
  supportedLocales: string[]
}

export type DbSubjectWithAliases = {
  id: string
  code: string | null
  name: Record<string, string>
  aliases: string[]
  categoryId: string | null
  isCoreSubject: boolean | null
}

// Cached data
let configCache: ScanParserConfig | null = null
let subjectCache: DbSubjectWithAliases[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function isCacheValid(): boolean {
  return cacheTimestamp > 0 && Date.now() - cacheTimestamp < CACHE_TTL
}

function asStringArray(val: unknown): string[] {
  return Array.isArray(val) ? (val as string[]) : []
}

function asStringRecord(val: unknown): Record<string, string> {
  return val && typeof val === 'object' && !Array.isArray(val)
    ? (val as Record<string, string>)
    : {}
}

function asTupleArray(val: unknown): [string, string][] {
  if (!Array.isArray(val)) return []
  return val.filter((item) => Array.isArray(item) && item.length === 2) as [string, string][]
}

export async function loadScanConfig(): Promise<ScanParserConfig> {
  if (configCache && isCacheValid()) return configCache

  const rows = await db.select().from(scanConfig)
  const m: Record<string, unknown> = {}
  for (const row of rows) {
    m[row.key] = row.data
  }

  configCache = {
    skipKeywords: asStringArray(m['skip_keywords']),
    behavioralGrades: new Set(asStringArray(m['behavioral_grades'])),
    ocrSubstitutions: asTupleArray(m['ocr_substitutions']),
    umlautMap: asStringRecord(m['umlaut_map']),
    schoolTypeKeywords: asStringArray(m['school_type_keywords']),
    termKeywords: asStringRecord(m['term_keywords']),
    monthNames: asStringRecord(m['month_names']),
    studentNameLabels: asStringArray(m['student_name_labels']),
    schoolNameLabels: asStringArray(m['school_name_labels']),
    localeLanguages: asStringRecord(m['locale_languages']),
    countryLanguages: asStringRecord(m['country_languages']),
    supportedLocales: asStringArray(m['supported_locales']),
  }
  cacheTimestamp = Date.now()
  return configCache
}

export async function loadSubjectsWithAliases(): Promise<DbSubjectWithAliases[]> {
  if (subjectCache && isCacheValid()) return subjectCache

  const rows = await db.select().from(subjects).where(eq(subjects.isActive, true))

  subjectCache = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: (r.name || {}) as Record<string, string>,
    aliases: Array.isArray(r.aliases) ? (r.aliases as string[]) : [],
    categoryId: r.categoryId,
    isCoreSubject: r.isCoreSubject,
  }))
  cacheTimestamp = Date.now()
  return subjectCache
}
