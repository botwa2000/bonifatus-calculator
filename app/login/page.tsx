'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Turnstile } from '@/components/ui/Turnstile'

export default function LoginPage() {
  const router = useRouter()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const debugEnabled = process.env.NEXT_PUBLIC_TURNSTILE_DEBUG === 'true'
  const dbg = useCallback(
    (message: string, meta?: Record<string, unknown>) => {
      if (!debugEnabled) return
      console.info('[login-debug]', message, meta ?? '')
    },
    [debugEnabled]
  )

  const formDataRef = useRef({
    email: '',
    password: '',
  })
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileLoading, setTurnstileLoading] = useState(!!siteKey)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  const submitLogin = useCallback(
    async (token: string) => {
      setLoading(true)
      dbg('submitLogin start', { email: formDataRef.current.email })
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formDataRef.current,
            turnstileToken: token,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          dbg('submitLogin failed', { status: response.status, body: data })
          setError(data.error || 'Login failed')
          setTurnstileToken('')
          setLoading(false)
          return
        }

        router.push('/dashboard')
      } catch (err) {
        console.error('Login error:', err)
        setError('An unexpected error occurred. Please try again.')
        setTurnstileToken('')
        setLoading(false)
      }
    },
    [router, dbg]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    dbg('handleSubmit', {
      hasToken: Boolean(turnstileToken),
      turnstileLoading,
      emailPresent: Boolean(formData.email),
    })

    if (loading) return

    if (!siteKey) {
      setError('Bot protection is not configured. Please try again later.')
      return
    }

    if (!turnstileToken) {
      setError('Please complete the bot verification (checkbox).')
      dbg('handleSubmit blocked, missing token')
      return
    }

    await submitLogin(turnstileToken)
    // ask Turnstile to refresh token for any next submit
    setTurnstileToken('')
    setTurnstileLoading(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2 cursor-pointer">
              Bonifatus
            </h1>
          </Link>
          <p className="text-neutral-600 dark:text-neutral-400">
            Welcome back! Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            {/* Turnstile */}
            <div>
              <Turnstile
                siteKey={siteKey || ''}
                executeOnReady
                action="login"
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setTurnstileLoading(false)
                  setError('')
                  dbg('turnstile success', { hasToken: true })
                }}
                onReady={() => {
                  setTurnstileLoading(false)
                  dbg('turnstile ready')
                }}
                onError={() => {
                  setError('Security verification failed. Please refresh the page.')
                  setTurnstileToken('')
                  setTurnstileLoading(false)
                  dbg('turnstile error callback')
                }}
                onExpire={() => {
                  setTurnstileToken('')
                  setTurnstileLoading(true)
                  dbg('turnstile expired callback')
                }}
                theme="auto"
                size="normal"
              />
              {turnstileLoading && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-2">
                  Loading security verification...
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Forgot Password Link */}
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
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            By signing in, you agree to our{' '}
            <Link
              href="/terms"
              className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
