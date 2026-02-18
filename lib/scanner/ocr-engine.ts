import Tesseract from 'tesseract.js'
import type { ScanParserConfig } from '@/lib/db/queries/scan-config'

export type OcrResult = {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
  }>
}

function extractResult(data: Tesseract.Page): OcrResult {
  // Tesseract.js runtime exposes words on data but the TS types are incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any
  const rawWords = Array.isArray(raw.words) ? raw.words : []
  const words: OcrResult['words'] = rawWords.map((w: { text: string; confidence: number }) => ({
    text: w.text,
    confidence: w.confidence,
  }))
  return { text: data.text, confidence: data.confidence, words }
}

let cachedWorker: Tesseract.Worker | null = null
let cachedLangs: string | null = null

function resolveLangs(
  config: Pick<ScanParserConfig, 'localeLanguages' | 'countryLanguages'>,
  locale?: string,
  countryCode?: string
): string {
  if (countryCode && config.countryLanguages[countryCode]) {
    return config.countryLanguages[countryCode]
  }
  if (locale && config.localeLanguages[locale]) {
    return config.localeLanguages[locale]
  }
  return 'eng'
}

export async function recognizeText(
  imageBuffer: Buffer,
  options: { locale?: string; countryCode?: string },
  config: Pick<ScanParserConfig, 'localeLanguages' | 'countryLanguages'>
): Promise<OcrResult> {
  const langs = resolveLangs(config, options?.locale, options?.countryCode)

  // Reuse worker if language matches
  if (cachedWorker && cachedLangs === langs) {
    const { data } = await cachedWorker.recognize(imageBuffer)
    return extractResult(data)
  }

  // Terminate old worker if exists
  if (cachedWorker) {
    await cachedWorker.terminate()
    cachedWorker = null
    cachedLangs = null
  }

  const worker = await Tesseract.createWorker(langs, 1, {
    cachePath: process.env.TESSDATA_CACHE,
  })
  cachedWorker = worker
  cachedLangs = langs

  const { data } = await worker.recognize(imageBuffer)
  return extractResult(data)
}
