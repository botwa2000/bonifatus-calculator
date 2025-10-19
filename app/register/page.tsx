'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type RegistrationStep = 'form' | 'verification'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<RegistrationStep>('form')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    role: 'parent' as 'parent' | 'child',
  })
  const [verificationData, setVerificationData] = useState({
    userId: '',
    code: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [passwordStrength, setPasswordStrength] = useState('')

  const validatePassword = (password: string) => {
    if (password.length < 12) {
      setPasswordStrength('Password must be at least 12 characters')
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordStrength('Password must contain an uppercase letter')
      return false
    }
    if (!/[a-z]/.test(password)) {
      setPasswordStrength('Password must contain a lowercase letter')
      return false
    }
    if (!/[0-9]/.test(password)) {
      setPasswordStrength('Password must contain a number')
      return false
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setPasswordStrength('Password must contain a special character')
      return false
    }
    setPasswordStrength('Strong password')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (!validatePassword(formData.password)) {
      setError(passwordStrength)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          role: formData.role,
          turnstileToken: turnstileToken || 'dev-token', // For development
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Store userId for verification step
      setVerificationData({ ...verificationData, userId: data.userId })
      setStep('verification')
      setLoading(false)
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: verificationData.userId,
          code: verificationData.code,
          purpose: 'email_verification',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed')
        setLoading(false)
        return
      }

      // Redirect to dashboard or login
      router.push('/login?verified=true')
    } catch (err) {
      console.error('Verification error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: verificationData.userId,
          purpose: 'email_verification',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to resend code')
        setLoading(false)
        return
      }

      setError('')
      alert('Verification code resent! Check your email.')
      setLoading(false)
    } catch (err) {
      console.error('Resend error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (step === 'verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2 cursor-pointer">
                Bonifatus
              </h1>
            </Link>
            <p className="text-neutral-600 dark:text-neutral-400">Verify your email address</p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
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
                Check your email
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                We&apos;ve sent a 6-digit verification code to <strong>{formData.email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-6">
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
                  value={verificationData.code}
                  onChange={(e) =>
                    setVerificationData({ ...verificationData, code: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationData.code.length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold disabled:opacity-50 transition-colors duration-normal"
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2 cursor-pointer">
              Bonifatus
            </h1>
          </Link>
          <p className="text-neutral-600 dark:text-neutral-400">Create your free account</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'parent' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-normal ${
                    formData.role === 'parent'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                  }`}
                >
                  <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                  <div className="font-semibold text-neutral-900 dark:text-white">Parent</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'child' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-normal ${
                    formData.role === 'child'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🎓</div>
                  <div className="font-semibold text-neutral-900 dark:text-white">Student</div>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                placeholder="John Doe"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
              />
            </div>

            {/* Email */}
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
                className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={12}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  if (e.target.value) validatePassword(e.target.value)
                }}
                className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                placeholder="Create a strong password"
              />
              {formData.password && (
                <p
                  className={`mt-2 text-sm ${
                    passwordStrength === 'Strong password'
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {passwordStrength}
                </p>
              )}
            </div>

            {/* Confirm Password */}
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
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                placeholder="Confirm your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors duration-normal"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            By creating an account, you agree to our{' '}
            <Link
              href="/terms"
              className="underline hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-normal"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-normal"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
