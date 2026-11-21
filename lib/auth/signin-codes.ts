/**
 * `code` values the web credentials sign-in returns besides the generic
 * "CredentialsSignin" (shared by auth.ts and the login page, so no server imports).
 * Neither says whether an email has an account: an unconfirmed account is only named
 * after the right password, and the throttle is checked before the address is looked up.
 */
export const SIGNIN_CODE_UNVERIFIED = 'email_unverified'
export const SIGNIN_CODE_RATE_LIMITED = 'rate_limited'

/** The account id carried by an "email_unverified:<id>" code, else null. */
export function unverifiedUserId(code: string | null | undefined): string | null {
  const prefix = `${SIGNIN_CODE_UNVERIFIED}:`
  if (!code?.startsWith(prefix)) return null
  const id = code.slice(prefix.length)
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null
}
