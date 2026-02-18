/**
 * OCR correction utilities for common misreadings in report card text.
 */

// Common OCR substitution pairs: [wrong, correct]
const OCR_SUBSTITUTIONS: [string, string][] = [
  ['rn', 'm'],
  ['m', 'rn'],
  ['vv', 'w'],
  ['l', 'I'],
  ['I', 'l'],
  ['0', 'O'],
  ['O', '0'],
  ['|', 'l'],
  ['1', 'l'],
  ['5', 'S'],
  ['S', '5'],
  ['8', 'B'],
  ['ii', 'ü'],
  ['ue', 'ü'],
  ['ae', 'ä'],
  ['oe', 'ö'],
  ['ss', 'ß'],
]

// Umlaut normalization map for comparison
const UMLAUT_MAP: Record<string, string> = {
  ä: 'a',
  ö: 'o',
  ü: 'u',
  Ä: 'A',
  Ö: 'O',
  Ü: 'U',
  ß: 'ss',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  à: 'a',
  â: 'a',
  ù: 'u',
  û: 'u',
  î: 'i',
  ï: 'i',
  ô: 'o',
  ñ: 'n',
  ç: 'c',
}

/**
 * Normalize accented/umlaut characters to ASCII equivalents for comparison.
 */
export function normalizeUmlauts(text: string): string {
  let result = ''
  for (const ch of text) {
    result += UMLAUT_MAP[ch] ?? ch
  }
  return result
}

/**
 * Generate OCR-corrected variants of input text by applying common substitutions.
 * Returns 5-8 alternate spellings including the original.
 */
export function generateOcrVariants(text: string): string[] {
  const variants = new Set<string>()
  variants.add(text)
  variants.add(normalizeUmlauts(text))

  for (const [wrong, correct] of OCR_SUBSTITUTIONS) {
    if (text.includes(wrong)) {
      variants.add(text.replace(wrong, correct))
    }
    const lower = text.toLowerCase()
    if (lower.includes(wrong.toLowerCase())) {
      const idx = lower.indexOf(wrong.toLowerCase())
      const variant = text.slice(0, idx) + correct + text.slice(idx + wrong.length)
      variants.add(variant)
    }
  }

  // Limit to 8 variants
  return [...variants].slice(0, 8)
}

/**
 * Apply most-likely OCR corrections to a metadata field (student name, school name).
 * Fixes common character substitutions and normalizes whitespace.
 */
export function correctOcrText(text: string): string {
  let corrected = text.trim()

  // Fix common OCR artifacts
  corrected = corrected.replace(/\|/g, 'l')
  corrected = corrected.replace(/(\w)0(\w)/g, '$1O$2') // mid-word 0→O
  corrected = corrected.replace(/([A-Z])1([a-z])/g, '$1l$2') // capital + 1 + lower → l

  // Normalize multiple spaces
  corrected = corrected.replace(/\s+/g, ' ')

  return corrected
}

/**
 * Capitalize a proper name that may have been mangled by OCR.
 * E.g. "mAX müLLER" → "Max Müller"
 */
export function capitalizeProperName(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
