import { describe, expect, it } from 'vitest'
import { googleFailureReason, SIGNIN_CODE_UNVERIFIED, unverifiedUserId } from './signin-codes'

describe('unverifiedUserId', () => {
  const id = '3f1c2b9e-5d4a-4c8e-9b7a-0e1d2c3b4a59'
  it('reads the account id from an unconfirmed-account code', () => {
    expect(unverifiedUserId(`${SIGNIN_CODE_UNVERIFIED}:${id}`)).toBe(id)
  })
  it('ignores every other code', () => {
    for (const c of [undefined, null, '', 'credentials', 'rate_limited', SIGNIN_CODE_UNVERIFIED])
      expect(unverifiedUserId(c)).toBeNull()
    expect(unverifiedUserId(`${SIGNIN_CODE_UNVERIFIED}:../../x`)).toBeNull()
  })
})

describe('googleFailureReason', () => {
  it('maps the Auth.js OAuth error types', () => {
    expect(googleFailureReason({ type: 'InvalidCheck' })).toBe('invalid_check')
    expect(googleFailureReason({ type: 'OAuthAccountNotLinked' })).toBe('oauth_account_not_linked')
  })
  it('reads wrapped callback errors of the Google provider', () => {
    const cancelled = {
      type: 'CallbackRouteError',
      cause: { provider: 'google', parameters: new URLSearchParams('error=access_denied&state=x') },
    }
    expect(googleFailureReason(cancelled)).toBe('oauth_cancelled')
    expect(googleFailureReason({ type: 'CallbackRouteError', cause: { provider: 'google' } })).toBe(
      'oauth_callback'
    )
  })
  it('ignores everything else', () => {
    expect(
      googleFailureReason({ type: 'CallbackRouteError', cause: { provider: 'credentials' } })
    ).toBeNull()
    expect(googleFailureReason({ type: 'CredentialsSignin' })).toBeNull()
    expect(googleFailureReason(new Error('x'))).toBeNull()
    expect(googleFailureReason(null)).toBeNull()
  })
})
