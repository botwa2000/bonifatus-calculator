import Tesseract from 'tesseract.js'

const LOCALE_TO_LANGS: Record<string, string> = {
  de: 'deu+eng',
  en: 'eng',
  fr: 'fra+eng',
  it: 'ita+eng',
  es: 'spa+eng',
  ru: 'rus+eng',
}

const COUNTRY_TO_LANGS: Record<string, string> = {
  DE: 'deu+eng',
  AT: 'deu+eng',
  CH: 'deu+fra+ita+eng',
  US: 'eng',
  GB: 'eng',
  FR: 'fra+eng',
  IT: 'ita+eng',
  ES: 'spa+eng',
  CA: 'eng+fra',
  BR: 'por+eng',
  JP: 'jpn+eng',
  AU: 'eng',
  IN: 'eng+hin',
  NL: 'nld+eng',
  RU: 'rus+eng',
}

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

function resolveLangs(locale?: string, countryCode?: string): string {
  if (countryCode && COUNTRY_TO_LANGS[countryCode]) {
    return COUNTRY_TO_LANGS[countryCode]
  }
  if (locale && LOCALE_TO_LANGS[locale]) {
    return LOCALE_TO_LANGS[locale]
  }
  return 'eng'
}

export async function recognizeText(
  imageBuffer: Buffer,
  options?: { locale?: string; countryCode?: string }
): Promise<OcrResult> {
  const langs = resolveLangs(options?.locale, options?.countryCode)

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

  const worker = await Tesseract.createWorker(langs)
  cachedWorker = worker
  cachedLangs = langs

  const { data } = await worker.recognize(imageBuffer)
  return extractResult(data)
}
