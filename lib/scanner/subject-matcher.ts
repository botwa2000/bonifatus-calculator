import { dbg } from '@/lib/debug'
import type { ParsedSubject } from './text-parser'
import { generateOcrVariants, normalizeUmlauts } from './ocr-corrections'
import {
  loadSubjectsWithAliases,
  type DbSubjectWithAliases,
  type ScanParserConfig,
} from '@/lib/db/queries/scan-config'

export type MatchedSubject = ParsedSubject & {
  matchedSubjectId?: string
  matchedSubjectName?: string
  matchConfidence: 'high' | 'medium' | 'low' | 'none'
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[/\\().\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshteinDistance(a: string, b: string): number {
  const la = a.length
  const lb = b.length
  const dp: number[] = Array.from({ length: lb + 1 }, (_, i) => i)
  for (let i = 1; i <= la; i++) {
    let prev = i - 1
    dp[0] = i
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j]
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1])
      }
      prev = tmp
    }
  }
  return dp[lb]
}

function findMatch(
  originalName: string,
  allSubjects: DbSubjectWithAliases[],
  config: ScanParserConfig
): { id: string; name: string; confidence: 'high' | 'medium' | 'low'; method: string } | null {
  const normalized = normalizeForComparison(originalName)
  const locales = config.supportedLocales

  // Strategy 0: Alias lookup — check each subject's DB-stored aliases array
  for (const subj of allSubjects) {
    for (const alias of subj.aliases) {
      if (normalizeForComparison(alias) === normalized) {
        const name = subj.name['de'] || subj.name['en'] || originalName
        return { id: subj.id, name, confidence: 'high', method: 'alias' }
      }
    }
  }

  // Strategy 1: Exact match in any locale
  for (const subj of allSubjects) {
    for (const locale of locales) {
      const localeName = subj.name[locale]
      if (localeName && normalizeForComparison(localeName) === normalized) {
        return { id: subj.id, name: localeName, confidence: 'high', method: 'exact' }
      }
    }
  }

  // Strategy 2: Case-insensitive startsWith or contains match
  for (const subj of allSubjects) {
    for (const locale of locales) {
      const localeName = subj.name[locale]
      if (!localeName) continue
      const normLocal = normalizeForComparison(localeName)

      if (normLocal.startsWith(normalized) || normalized.startsWith(normLocal)) {
        return { id: subj.id, name: localeName, confidence: 'medium', method: 'prefix' }
      }
    }
  }

  // Strategy 3: Fuzzy contains match (subject name appears within OCR text)
  for (const subj of allSubjects) {
    for (const locale of locales) {
      const localeName = subj.name[locale]
      if (!localeName) continue
      const normLocal = normalizeForComparison(localeName)

      if (normLocal.length >= 3 && normalized.includes(normLocal)) {
        return { id: subj.id, name: localeName, confidence: 'low', method: 'contains' }
      }
      if (normalized.length >= 3 && normLocal.includes(normalized)) {
        return { id: subj.id, name: localeName, confidence: 'low', method: 'contains' }
      }
    }
  }

  // Strategy 3.5: OCR-corrected matching — try variants of the OCR text
  const ocrConfig = { ocrSubstitutions: config.ocrSubstitutions, umlautMap: config.umlautMap }
  const variants = generateOcrVariants(originalName, ocrConfig)
  for (const variant of variants) {
    if (variant === originalName) continue
    const normVariant = normalizeForComparison(variant)
    const normVariantUmlaut = normalizeForComparison(normalizeUmlauts(variant, config.umlautMap))
    for (const subj of allSubjects) {
      for (const locale of locales) {
        const localeName = subj.name[locale]
        if (!localeName) continue
        const normLocal = normalizeForComparison(localeName)
        const normLocalUmlaut = normalizeForComparison(
          normalizeUmlauts(localeName, config.umlautMap)
        )
        if (normLocal === normVariant || normLocalUmlaut === normVariantUmlaut) {
          return { id: subj.id, name: localeName, confidence: 'medium', method: 'ocr-corrected' }
        }
        if (normLocal.startsWith(normVariant) || normVariant.startsWith(normLocal)) {
          return { id: subj.id, name: localeName, confidence: 'medium', method: 'ocr-corrected' }
        }
      }
    }
  }

  // Strategy 4: Levenshtein fuzzy match (checks both locale names AND aliases)
  let bestMatch: { id: string; name: string; dist: number } | null = null
  const levThreshold = (a: string, b: string) => Math.floor(Math.min(a.length, b.length) * 0.3)

  for (const subj of allSubjects) {
    // Check locale names
    for (const locale of locales) {
      const localeName = subj.name[locale]
      if (!localeName) continue
      const normLocal = normalizeForComparison(localeName)
      if (normLocal.length < 4 || normalized.length < 4) continue

      const dist = levenshteinDistance(normalized, normLocal)
      if (dist <= levThreshold(normalized, normLocal) && (!bestMatch || dist < bestMatch.dist)) {
        bestMatch = { id: subj.id, name: localeName, dist }
      }
    }
    // Check aliases (critical for compound names like "Katholische Religionslehre")
    for (const alias of subj.aliases) {
      const normAlias = normalizeForComparison(alias)
      if (normAlias.length < 4 || normalized.length < 4) continue

      const dist = levenshteinDistance(normalized, normAlias)
      if (dist <= levThreshold(normalized, normAlias) && (!bestMatch || dist < bestMatch.dist)) {
        const name = subj.name['de'] || subj.name['en'] || alias
        bestMatch = { id: subj.id, name, dist }
      }
    }
  }
  if (bestMatch) {
    return { id: bestMatch.id, name: bestMatch.name, confidence: 'low', method: 'levenshtein' }
  }

  return null
}

export async function matchSubjects(
  parsed: ParsedSubject[],
  config: ScanParserConfig
): Promise<MatchedSubject[]> {
  const allSubjects = await loadSubjectsWithAliases()

  const results: MatchedSubject[] = parsed.map((p) => {
    const match = findMatch(p.originalName, allSubjects, config)
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

  dbg('scanner', 'subject match results', {
    results: results.map((s) => {
      const match = findMatch(s.originalName, allSubjects, config)
      return {
        ocr: s.originalName,
        grade: s.grade,
        matched: s.matchedSubjectName ?? '(no match)',
        confidence: s.matchConfidence,
        method: match?.method ?? 'none',
      }
    }),
  })

  return results
}
