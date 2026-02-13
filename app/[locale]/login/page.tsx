'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Turnstile } from '@/components/ui/Turnstile'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslations } from 'next-intl'
import { dbg, dbgWarn, dbgError } from '@/lib/debug'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  dbg('login', 'page rendered', { hasSiteKey: !!siteKey })

  const formDataRef = useRef({ email: '', password: '' })
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileLoading, setTurnstileLoading] = useState(!!siteKey)
  const [showPassword, setShowPassword] = useState(false)
  const turnstileStartRef = useRef<number | null>(null)
  const fallbackVisible = useRef(false)
  const [, forceRender] = useState(0)
  const [turnstileFailed, setTurnstileFailed] = useState(false)
  const fallbackTimerRef = useRef<number | null>(null)
  const visibleFallbackTimerRef = useRef<number | null>(null)
  const fallbackTimeoutMs = 45000
  const visibleFallbackTimeoutMs = 30000

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    if (visibleFallbackTimerRef.current) {
      clearTimeout(visibleFallbackTimerRef.current)
      visibleFallbackTimerRef.current = null
    }
  }

  const triggerFallback = () => {
    clearFallbackTimer()
    fallbackVisible.current = true
    setTurnstileToken('')
    setStatusMessage(t('pleaseCheckBox'))
    setTurnstileLoading(false)
    forceRender((v) => v + 1)
    dbg('login', 'turnstile fallback to visible widget')
    visibleFallbackTimerRef.current = window.setTimeout(() => {
      dbg('login', 'visible turnstile also timed out, allowing login without token')
      setTurnstileFailed(true)
      setStatusMessage('')
    }, visibleFallbackTimeoutMs)
  }

  useEffect(() => {
    return () => {
      clearFallbackTimer()
    }
  }, [])
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  const submitLogin = async (token: string) => {
    setLoading(true)
    dbg('login', 'submitLogin start', {
      email: formDataRef.current.email,
      hasToken: !!token,
      turnstileFailed,
    })
    try {
      const { signIn } = await import('next-auth/react')
      dbg('login', 'calling signIn credentials')
      const result = await signIn('credentials', {
        redirect: false,
        email: formDataRef.current.email,
        password: formDataRef.current.password,
        turnstileToken: token,
      })
      dbg('login', 'signIn result', {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
      })
      if (result?.error) {
        dbgWarn('login', 'signIn returned error', { error: result.error })
        setError(result.error === 'CredentialsSignin' ? t('invalidCredentials') : result.error)
        setTurnstileToken('')
        setLoading(false)
        return
      }
      dbg('login', 'login success — navigating to /dashboard')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      dbgError('login', 'submitLogin threw', { error: String(err) })
      setError(t('unexpectedError'))
      setTurnstileToken('')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatusMessage('')
    dbg('login', 'handleSubmit', {
      hasToken: Boolean(turnstileToken),
      turnstileLoading,
      turnstileFailed,
      emailPresent: Boolean(formData.email),
    })
    if (loading) return
    if (!siteKey) {
      setError(t('botProtectionNotConfigured'))
      return
    }
    if (!turnstileToken && !turnstileFailed) {
      setStatusMessage(fallbackVisible.current ? t('pleaseCheckBox') : t('verifyingNotRobot'))
      dbgWarn('login', 'handleSubmit blocked — missing token', {
        fallbackVisible: fallbackVisible.current,
      })
      return
    }
    await submitLogin(turnstileToken)
    setTurnstileToken('')
    setTurnstileLoading(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex flex-col">
      <AppHeader variant="public" />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Image
              src="/images/logo-icon.svg"
              alt="Bonifatus"
              width={64}
              height={64}
              className="mx-auto mb-3 rounded-full"
            />
            <p className="text-neutral-600 dark:text-neutral-400">{t('welcomeBack')}</p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                  <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                </div>
              )}
              {statusMessage && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 flex items-center gap-2 text-sm text-primary-700 dark:text-primary-200">
                  <svg
                    className="w-4 h-4 animate-spin text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{statusMessage}</span>
                </div>
              )}
              {turnstileFailed && (
                <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4 text-sm text-warning-700 dark:text-warning-300">
                  {t('botProtectionUnavailable')}
                </div>
              )}

              <div>
                <Turnstile
                  key={fallbackVisible.current ? 'turnstile-visible' : 'turnstile-invisible'}
                  siteKey={siteKey || ''}
                  executeOnReady={!fallbackVisible.current}
                  action="login"
                  size={fallbackVisible.current ? 'normal' : 'invisible'}
                  onSuccess={(token) => {
                    dbg('login', 'turnstile onSuccess', { tokenLength: token.length })
                    setTurnstileToken(token)
                    setTurnstileLoading(false)
                    setTurnstileFailed(false)
                    setError('')
                    setStatusMessage('')
                    clearFallbackTimer()
                    fallbackVisible.current = false
                    forceRender((v) => v + 1)
                    turnstileStartRef.current = null
                  }}
                  onReady={() => {
                    dbg('login', 'turnstile onReady', { fallbackVisible: fallbackVisible.current })
                    setTurnstileLoading(false)
                    turnstileStartRef.current = Date.now()
                    if (fallbackVisible.current) {
                      setStatusMessage(t('pleaseCheckBox'))
                      clearFallbackTimer()
                      return
                    }
                    setStatusMessage(t('securityCheck'))
                    clearFallbackTimer()
                    fallbackTimerRef.current = window.setTimeout(() => {
                      if (!turnstileToken) triggerFallback()
                    }, fallbackTimeoutMs)
                  }}
                  onError={(reason) => {
                    dbgWarn('login', 'turnstile onError', {
                      reason,
                      wasFallbackVisible: fallbackVisible.current,
                    })
                    if (fallbackVisible.current) {
                      setTurnstileFailed(true)
                      setError('')
                      setStatusMessage('')
                      setTurnstileLoading(false)
                      clearFallbackTimer()
                      return
                    }
                    setError(t('securityFailed'))
                    setTurnstileToken('')
                    setTurnstileLoading(false)
                    setStatusMessage(t('pleaseCheckBox'))
                    clearFallbackTimer()
                    fallbackVisible.current = true
                    forceRender((v) => v + 1)
                    turnstileStartRef.current = null
                    visibleFallbackTimerRef.current = window.setTimeout(() => {
                      setTurnstileFailed(true)
                      setStatusMessage('')
                      setError('')
                    }, visibleFallbackTimeoutMs)
                  }}
                  onExpire={() => {
                    dbg('login', 'turnstile onExpire — re-verifying')
                    setTurnstileToken('')
                    setTurnstileLoading(true)
                    setStatusMessage(t('reVerifying'))
                    clearFallbackTimer()
                    fallbackVisible.current = false
                    forceRender((v) => v + 1)
                    turnstileStartRef.current = Date.now()
                  }}
                  theme="auto"
                />
                {turnstileLoading && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-2">
                    {t('loadingVerification')}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  {t('emailLabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder={t('passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    {t('rememberMe')}
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? t('signingIn') : t('signIn')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('noAccount')}{' '}
                <Link
                  href="/register"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold"
                >
                  {t('signUpLink')}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              {t('agreeBySignIn')}{' '}
              <Link
                href="/terms"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                {t('termsOfService')}
              </Link>{' '}
              {t('and')}{' '}
              <Link
                href="/privacy"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                {t('privacyPolicy')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
