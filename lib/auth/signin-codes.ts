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

/** Auth.js error types that only the Google (OAuth) flow raises → action_log.reason. */
const GOOGLE_FAILURES: Record<string, string> = {
  OAuthCallbackError: 'oauth_callback',
  OAuthAccountNotLinked: 'oauth_account_not_linked',
  OAuthSignInError: 'oauth_sign_in',
  OAuthProfileParseError: 'oauth_profile',
  InvalidCheck: 'invalid_check',
}

/** Refusal reason of a failed Google sign-in, or null when the error is not one. */
export function googleFailureReason(error: unknown): string | null {
  const e = error as {
    type?: string
    cause?: { provider?: string; parameters?: URLSearchParams }
  } | null
  if (!e?.type) return null
  if (GOOGLE_FAILURES[e.type]) return GOOGLE_FAILURES[e.type]
  // Errors in the OAuth callback (state check, an error answer from Google) arrive
  // wrapped, with the provider on the cause.
  if (e.type === 'CallbackRouteError' && e.cause?.provider === 'google') {
    const answer =
      e.cause.parameters instanceof URLSearchParams ? e.cause.parameters.get('error') : null
    return answer === 'access_denied' ? 'oauth_cancelled' : 'oauth_callback'
  }
  return null
}
