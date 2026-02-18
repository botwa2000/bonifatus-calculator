import { db } from '@/lib/db/client'
import { scanConfig } from '@/drizzle/schema/scanConfig'
import { subjects } from '@/drizzle/schema/grades'
import { eq } from 'drizzle-orm'

export type ScanParserConfig = {
  skipKeywords: string[]
  behavioralGrades: Set<string>
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

export async function loadScanConfig(): Promise<ScanParserConfig> {
  if (configCache && isCacheValid()) return configCache

  const rows = await db.select().from(scanConfig)
  const configMap: Record<string, unknown> = {}
  for (const row of rows) {
    configMap[row.key] = row.data
  }

  configCache = {
    skipKeywords: Array.isArray(configMap['skip_keywords'])
      ? (configMap['skip_keywords'] as string[])
      : [],
    behavioralGrades: new Set(
      Array.isArray(configMap['behavioral_grades'])
        ? (configMap['behavioral_grades'] as string[])
        : []
    ),
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
