/**
 * Resolve a localized value from a JSONB field.
 * Fallback chain: requested locale -> English -> first available -> empty string.
 */
export function resolveLocalized(
  value: string | Record<string, string> | null | undefined,
  locale: string = 'en'
): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[locale] || value['en'] || Object.values(value)[0] || ''
}
