import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { preprocessImage } from '@/lib/scanner/image-preprocessor'
import { recognizeText } from '@/lib/scanner/ocr-engine'
import { parseOcrText } from '@/lib/scanner/text-parser'
import { matchSubjects } from '@/lib/scanner/subject-matcher'
import { loadScanConfig } from '@/lib/db/queries/scan-config'

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

    // Pipeline: load config → preprocess → OCR → parse → match
    const scanConfig = await loadScanConfig()
    const preprocessed = await preprocessImage(imageBuffer)
    const ocrResult = await recognizeText(preprocessed, {
      locale: locale || 'en',
      countryCode: gradingSystemCountry,
    })
    const parsed = parseOcrText(ocrResult.text, ocrResult.confidence, scanConfig)
    const matched = await matchSubjects(parsed.subjects)

    return NextResponse.json({
      success: true,
      subjects: matched,
      metadata: parsed.metadata,
      overallConfidence: parsed.overallConfidence,
      subjectCount: matched.length,
      matchedCount: matched.filter((s) => s.matchedSubjectId).length,
      debugInfo: {
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
      },
    })
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json({ success: false, error: 'Failed to process image' }, { status: 500 })
  }
}
