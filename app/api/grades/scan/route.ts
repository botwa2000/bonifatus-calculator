import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { preprocessImage, splitColumns, forceSplitCenter } from '@/lib/scanner/image-preprocessor'
import { recognizeText, type OcrResult } from '@/lib/scanner/ocr-engine'
import { parseOcrText } from '@/lib/scanner/text-parser'
import { matchSubjects } from '@/lib/scanner/subject-matcher'
import { loadScanConfig } from '@/lib/db/queries/scan-config'

// School type keywords → country code mapping for auto-detection
const SCHOOL_COUNTRY_MAP: Array<{ keywords: string[]; country: string }> = [
  {
    keywords: [
      'gymnasium',
      'realschule',
      'hauptschule',
      'gesamtschule',
      'grundschule',
      'oberschule',
      'mittelschule',
      'förderschule',
      'sekundarschule',
      'gemeinschaftsschule',
      'stadtteilschule',
      'zeugnis',
      'jahrgangsstufe',
      'halbjahr',
    ],
    country: 'DE',
  },
  {
    keywords: ['volksschule', 'neue mittelschule', 'bundesgymnasium', 'bundesrealgymnasium'],
    country: 'AT',
  },
  {
    keywords: ['kantonsschule', 'sekundarschule a', 'primarschule'],
    country: 'CH',
  },
  { keywords: ['lycée', 'collège', 'école primaire', 'bulletin'], country: 'FR' },
  { keywords: ['liceo', 'scuola media', 'scuola primaria', 'pagella'], country: 'IT' },
  { keywords: ['colegio', 'instituto', 'escuela', 'boletín'], country: 'ES' },
  { keywords: ['школа', 'гимназия', 'лицей', 'аттестат'], country: 'RU' },
]

function detectCountryFromMetadata(
  metadata: { schoolName?: string; termType?: string },
  rawText: string,
  _schoolTypeKeywords: string[]
): string | null {
  const searchText = [metadata.schoolName ?? '', rawText].join(' ').toLowerCase()

  for (const entry of SCHOOL_COUNTRY_MAP) {
    for (const kw of entry.keywords) {
      if (searchText.includes(kw)) {
        return entry.country
      }
    }
  }
  return null
}

// In-memory rate limiter: userId → { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const MAX_SCANS_PER_HOUR = 20
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const now = Date.now()
  const userLimit = rateLimits.get(user.id)
  if (userLimit) {
    if (now < userLimit.resetAt) {
      if (userLimit.count >= MAX_SCANS_PER_HOUR) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Try again later.' },
          { status: 429 }
        )
      }
      userLimit.count++
    } else {
      rateLimits.set(user.id, { count: 1, resetAt: now + 3600000 })
    }
  } else {
    rateLimits.set(user.id, { count: 1, resetAt: now + 3600000 })
  }

  try {
    const body = await req.json()
    const { image, locale, gradingSystemCountry } = body as {
      image?: string
      locale?: string
      gradingSystemCountry?: string
    }

    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    // Decode base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image too large. Maximum 10MB.' },
        { status: 400 }
      )
    }

    // Pipeline: load config → preprocess → full OCR (for metadata) → split OCR (for subjects)
    const config = await loadScanConfig()
    const preprocessed = await preprocessImage(imageBuffer)
    const ocrOpts = { locale: locale || 'en', countryCode: gradingSystemCountry }

    // Always OCR the full image first — metadata (school name, student name, year)
    // comes from full-width headers that get cut by column splitting.
    const fullOcr = await recognizeText(preprocessed, ocrOpts, config)
    const fullParsed = parseOcrText(fullOcr.text, fullOcr.confidence, config)
    let ocrResult = fullOcr
    let parsed = fullParsed
    let columnSplitUsed = false

    // Try column splitting for better subject extraction
    const columns = await splitColumns(preprocessed)
    if (columns) {
      const leftOcr = await recognizeText(columns[0], ocrOpts, config)
      const rightOcr = await recognizeText(columns[1], ocrOpts, config)
      const splitOcr: OcrResult = {
        text: leftOcr.text + '\n' + rightOcr.text,
        confidence: (leftOcr.confidence + rightOcr.confidence) / 2,
        words: [...leftOcr.words, ...rightOcr.words],
      }
      const splitParsed = parseOcrText(splitOcr.text, splitOcr.confidence, config)

      if (splitParsed.subjects.length > fullParsed.subjects.length) {
        // Use split subjects but keep full-image metadata (headers span full width)
        ocrResult = splitOcr
        parsed = { ...splitParsed, metadata: fullParsed.metadata }
        columnSplitUsed = true
      }
    }

    // Fallback: if still few subjects and no split used, try forced center split.
    if (!columnSplitUsed && parsed.subjects.length < 8) {
      const forcedColumns = await forceSplitCenter(preprocessed)
      if (forcedColumns) {
        const leftOcr = await recognizeText(forcedColumns[0], ocrOpts, config)
        const rightOcr = await recognizeText(forcedColumns[1], ocrOpts, config)
        const splitOcr: OcrResult = {
          text: leftOcr.text + '\n' + rightOcr.text,
          confidence: (leftOcr.confidence + rightOcr.confidence) / 2,
          words: [...leftOcr.words, ...rightOcr.words],
        }
        const splitParsed = parseOcrText(splitOcr.text, splitOcr.confidence, config)

        if (splitParsed.subjects.length > parsed.subjects.length) {
          ocrResult = splitOcr
          parsed = { ...splitParsed, metadata: fullParsed.metadata }
          columnSplitUsed = true
        }
      }
    }

    const allMatched = await matchSubjects(parsed.subjects, config)

    // Filter out garbage: unmatched subjects that don't look like real subject names
    const matched = allMatched.filter((s) => {
      // Keep all matched subjects (any confidence except "none")
      if (s.matchedSubjectId) return true
      // For unmatched: require minimum quality indicators
      const name = s.originalName
      if (name.length < 5) return false
      // Must contain at least one 5+ letter word
      if (!/[a-zA-ZÀ-ÿß]{5,}/.test(name)) return false
      // Reject if more than half the characters are non-alpha (noise)
      const alphaCount = (name.match(/[a-zA-ZÀ-ÿß]/g) || []).length
      if (alphaCount < name.length * 0.6) return false
      return true
    })

    // Auto-detect country from school metadata
    const suggestedCountryCode = detectCountryFromMetadata(
      parsed.metadata,
      ocrResult.text,
      config.schoolTypeKeywords
    )

    return NextResponse.json({
      success: true,
      subjects: matched,
      metadata: parsed.metadata,
      overallConfidence: parsed.overallConfidence,
      subjectCount: matched.length,
      matchedCount: matched.filter((s) => s.matchedSubjectId).length,
      suggestedCountryCode,
      debugInfo: {
        columnSplitUsed,
        rawLines: ocrResult.text
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean),
        parsedSubjects: parsed.subjects.map((s) => ({
          name: s.originalName,
          grade: s.grade,
        })),
        matchDetails: matched.map((s) => ({
          ocr: s.originalName,
          matched: s.matchedSubjectName ?? '(none)',
          confidence: s.matchConfidence,
        })),
        suggestedCountryCode,
      },
    })
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json({ success: false, error: 'Failed to process image' }, { status: 500 })
  }
}
