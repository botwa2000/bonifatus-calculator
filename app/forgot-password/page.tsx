'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Turnstile } from '@/components/ui/Turnstile'

type Step = 'email' | 'code' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileLoading, setTurnstileLoading] = useState(true)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send reset code')
        setLoading(false)
        return
      }
      setStep('code')
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        setLoading(false)
        return
      }
      setStep('done')
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
              Password Reset
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2 cursor-pointer">
                Bonifatus
              </h1>
            </Link>
            <p className="text-neutral-600 dark:text-neutral-400">
              Enter the code sent to your email and choose a new password
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                  <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                </div>
              )}
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="000000"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={12}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="New password (12+ characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2 cursor-pointer">
              Bonifatus
            </h1>
          </Link>
          <p className="text-neutral-600 dark:text-neutral-400">
            Enter your email to receive a password reset code
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
          <form onSubmit={handleSendCode} className="space-y-6">
            {error && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setTurnstileLoading(false)
                }}
                onError={() => {
                  setError('Security verification failed. Please refresh the page.')
                  setTurnstileToken('')
                  setTurnstileLoading(false)
                }}
                onExpire={() => {
                  setTurnstileToken('')
                  setTurnstileLoading(true)
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
            <button
              type="submit"
              disabled={loading || !turnstileToken || turnstileLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading
                ? 'Sending...'
                : turnstileLoading
                  ? 'Loading verification...'
                  : 'Send Reset Code'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
