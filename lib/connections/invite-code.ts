/**
 * Parent → child invite codes.
 *
 * 10 symbols from Crockford's base32 alphabet (no I, L, O, U): 50 bits of entropy.
 * Codes are valid for 7 days and work once, so a 6-digit code (20 bits) would be
 * guessable; together with the redeem limits (lib/connections/redeem-limits.ts) the
 * chance of hitting any live code by guessing is negligible.
 *
 * Stored and compared in canonical form (10 upper-case symbols, no separator).
 * Shown to people as "ABCDE-FGHJK". Input forgives what children type: lower case,
 * spaces, dashes, and the look-alikes O → 0, I/L → 1.
 */
export const INVITE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const INVITE_CODE_LENGTH = 10
export const INVITE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000

const CANONICAL = new RegExp(`^[${INVITE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`)

/** Web Crypto, so this module also loads in the browser (for normalize/format). */
export function generateInviteCode(): string {
  // 32 symbols divide 256 evenly, so masking a random byte is unbiased.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH))
  return Array.from(bytes, (b) => INVITE_ALPHABET[b & 31]).join('')
}

/** Canonical form of what someone typed or scanned, or null if it cannot be a code. */
export function normalizeInviteCode(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 40) return null
  const code = input.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1')
  return CANONICAL.test(code) ? code : null
}

/** "ABCDEFGHJK" → "ABCDE-FGHJK" for display and the share text. */
export function formatInviteCode(code: string): string {
  return code.length === INVITE_CODE_LENGTH ? `${code.slice(0, 5)}-${code.slice(5)}` : code
}
