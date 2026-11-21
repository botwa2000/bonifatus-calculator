'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

/**
 * Mails a new code. The server answers the same for any id and enforces its own
 * cooldown, within which the previous code stays valid.
 */
async function resendCode(userId: string): Promise<boolean> {
  const response = await fetch('/api/auth/resend-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, purpose: 'email_verification' }),
  })
  return response.ok
}

/**
 * Six-digit code entry for an unconfirmed address, used right after sign-up and when
 * a sign-in with the right password meets an unconfirmed account. On success it signs
 * in with the same email + password and opens the dashboard.
 */
export function EmailCodeVerification({
  userId,
  email,
  password,
  sendCodeOnOpen = false,
  notice,
  initialError,
}: {
  userId: string
  email: string
  password: string
  /** Request a fresh code on arrival (from sign-in, the sign-up code may have expired). */
  sendCodeOnOpen?: boolean
  /** Shown above the form, e.g. why the user landed here. */
  notice?: string
  initialError?: string
}) {
  const router = useRouter()
  const t = useTranslations('auth')
  const [code, setCode] = useState('')
  const [error, setError] = useState(initialError ?? '')
  const [loading, setLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const sentOnOpen = useRef(false)

  useEffect(() => {
    if (!sendCodeOnOpen || sentOnOpen.current) return
    sentOnOpen.current = true
    resendCode(userId)
      .then((ok) => {
        if (!ok) setError(t('resendFailed'))
      })
      .catch(() => setError(t('resendFailed')))
  }, [sendCodeOnOpen, userId, t])

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code, purpose: 'email_verification' }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || t('verificationFailed'))
        setLoading(false)
        return
      }
      try {
        const { signIn } = await import('next-auth/react')
        const result = await signIn('credentials', { redirect: false, email, password })
        if (result?.ok && !result.error) {
          router.push('/dashboard')
          return
        }
      } catch {
        // Auto sign-in failed: fall through to the sign-in page.
      }
      router.push('/login?verified=true')
    } catch {
      setError(t('unexpectedError'))
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setResendSuccess(false)
    setLoading(true)
    try {
      if (await resendCode(userId)) setResendSuccess(true)
      else setError(t('resendFailed'))
    } catch {
      setError(t('unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-testid="email-code-verification">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-info-100 dark:bg-info-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-info-600 dark:text-info-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          {t('checkEmail')}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('sentCode')} <strong>{email}</strong>
        </p>
      </div>
      <form onSubmit={handleVerification} className="space-y-6">
        {notice && (
          <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
            <p className="text-sm text-info-700 dark:text-info-300">{notice}</p>
          </div>
        )}
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
          </div>
        )}
        {resendSuccess && (
          <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
            <p className="text-sm text-success-600 dark:text-success-400">{t('codeResent')}</p>
          </div>
        )}
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            {t('verificationCode')}
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
            placeholder="000000"
          />
        </div>
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? t('verifying') : t('verifyEmailBtn')}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('noCode')}{' '}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold disabled:opacity-50 transition-colors duration-normal"
          >
            {t('resend')}
          </button>
        </p>
      </div>
    </div>
  )
}
