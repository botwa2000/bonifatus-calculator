'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Turnstile } from '@/components/ui/Turnstile'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslations } from 'next-intl'
import { dbg, dbgWarn, dbgError } from '@/lib/debug'

function GoogleSignInButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    try {
      const { signIn } = await import('next-auth/react')
      await signIn('google', { callbackUrl: '/dashboard' })
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      {label}
    </button>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  dbg('login', 'page rendered', { hasSiteKey: !!siteKey })

  const formDataRef = useRef({ email: '', password: '' })
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileLoading, setTurnstileLoading] = useState(!!siteKey)
  const [showPassword, setShowPassword] = useState(false)
  const turnstileStartRef = useRef<number | null>(null)
  const fallbackVisible = useRef(false)
  const [, forceRender] = useState(0)
  const [turnstileFailed, setTurnstileFailed] = useState(false)
  const pendingSubmitRef = useRef(false)
  const fallbackTimerRef = useRef<number | null>(null)
  const visibleFallbackTimerRef = useRef<number | null>(null)
  const fallbackTimeoutMs = 8000
  const visibleFallbackTimeoutMs = 15000

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
    setLoading(false)
    forceRender((v) => v + 1)
    dbg('login', 'turnstile fallback to visible widget')
    visibleFallbackTimerRef.current = window.setTimeout(() => {
      dbg('login', 'visible turnstile also timed out, allowing login without token')
      setTurnstileFailed(true)
      setStatusMessage('')
      if (pendingSubmitRef.current) {
        pendingSubmitRef.current = false
        void submitLogin('')
      }
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      setSuccessMessage(t('emailVerifiedLogin'))
    }
    if (params.get('timeout') === '1') {
      setError(t('sessionExpiredLogin'))
    }
    const authError = params.get('error')
    if (authError) {
      if (authError === 'OAuthAccountNotLinked') {
        setError(t('oauthAccountNotLinked'))
      } else {
        setError(t('unexpectedError'))
      }
    }
  }, [t])

  // Sync browser-autofilled values into React state.
  // Runs repeatedly to catch autofill that may arrive at different timings,
  // and also on every animationstart (Chrome fires a special animation on
  // autofilled inputs).
  useEffect(() => {
    const sync = () => {
      const emailEl = document.getElementById('email') as HTMLInputElement | null
      const passwordEl = document.getElementById('password') as HTMLInputElement | null
      if (emailEl?.value && !formDataRef.current.email) {
        setFormData((prev) => ({ ...prev, email: emailEl.value }))
      }
      if (passwordEl?.value && !formDataRef.current.password) {
        setFormData((prev) => ({ ...prev, password: passwordEl.value }))
      }
    }
    const t1 = setTimeout(sync, 100)
    const t2 = setTimeout(sync, 500)
    const t3 = setTimeout(sync, 1500)

    // Chrome triggers an animation on autofilled inputs — use it as a signal
    const handleAnimation = (e: AnimationEvent) => {
      if (e.animationName === 'onAutoFillStart') sync()
    }
    document.addEventListener('animationstart', handleAnimation, true)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      document.removeEventListener('animationstart', handleAnimation, true)
    }
  }, [])

  // When the user focuses an input, immediately sync DOM value → React state
  // so that any browser-autofilled value becomes editable right away.
  const syncOnFocus = (field: 'email' | 'password') => {
    const el = document.getElementById(field) as HTMLInputElement | null
    if (el && el.value && el.value !== formDataRef.current[field]) {
      setFormData((prev) => ({ ...prev, [field]: el.value }))
    }
  }

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
      // Navigate to the intended destination (or /dashboard by default).
      // Do NOT call router.refresh() here — it races with router.push()
      // and causes the middleware to see two concurrent navigations.
      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      dbg('login', 'login success — navigating', { redirectTo })
      router.push(redirectTo as '/')
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
      pendingSubmitRef.current = true
      setLoading(true)
      setStatusMessage(fallbackVisible.current ? t('pleaseCheckBox') : t('verifyingNotRobot'))
      dbg('login', 'handleSubmit queued — waiting for token', {
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
              {successMessage && (
                <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
                  <p className="text-sm text-success-600 dark:text-success-400">{successMessage}</p>
                </div>
              )}
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
                    if (pendingSubmitRef.current) {
                      pendingSubmitRef.current = false
                      submitLogin(token)
                    }
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
                      if (pendingSubmitRef.current) {
                        pendingSubmitRef.current = false
                        void submitLogin('')
                      }
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
                      if (pendingSubmitRef.current) {
                        pendingSubmitRef.current = false
                        void submitLogin('')
                      }
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
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onFocus={() => syncOnFocus('email')}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
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
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onFocus={() => syncOnFocus('password')}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
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

            {/* Google Sign-In */}
            <div className="mt-6">
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  {t('orDivider')}
                </span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <GoogleSignInButton label={t('continueWithGoogle')} />
            </div>

            <div className="mt-4 text-center">
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
