'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Turnstile } from '@/components/ui/Turnstile'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslations } from 'next-intl'

type RegistrationStep = 'form' | 'verification'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [step, setStep] = useState<RegistrationStep>('form')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    role: 'parent' as 'parent' | 'child',
  })
  const [verificationData, setVerificationData] = useState({ userId: '', code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileLoading, setTurnstileLoading] = useState(true)
  const [passwordStrength, setPasswordStrength] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePassword = (password: string) => {
    if (password.length < 12) {
      setPasswordStrength(t('passwordMinLength'))
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordStrength(t('passwordUppercase'))
      return false
    }
    if (!/[a-z]/.test(password)) {
      setPasswordStrength(t('passwordLowercase'))
      return false
    }
    if (!/[0-9]/.test(password)) {
      setPasswordStrength(t('passwordNumber'))
      return false
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setPasswordStrength(t('passwordSpecial'))
      return false
    }
    setPasswordStrength(t('strongPassword'))
    return true
  }

  const calculateAge = (dob: string) => {
    const parsed = new Date(dob)
    if (Number.isNaN(parsed.getTime())) return 0
    const today = new Date()
    let age = today.getFullYear() - parsed.getFullYear()
    const m = today.getMonth() - parsed.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) age -= 1
    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.dateOfBirth) {
      setError(t('dobRequired'))
      return
    }
    const age = calculateAge(formData.dateOfBirth)
    if (age < 5 || age > 150) {
      setError(t('dobInvalid'))
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsNoMatch'))
      return
    }
    if (!validatePassword(formData.password)) {
      setError(passwordStrength)
      return
    }
    if (!turnstileToken) {
      setError(t('completeVerification'))
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          role: formData.role,
          turnstileToken,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }
      if (data.verificationEmailSent === false) {
        setError(t('accountCreatedEmailFailed'))
      }
      setVerificationData({ ...verificationData, userId: data.userId })
      setStep('verification')
      setLoading(false)
    } catch {
      setError(t('unexpectedError'))
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      router.push('/login?verified=true')
    } catch {
      setError(t('unexpectedError'))
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: verificationData.userId, purpose: 'email_verification' }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to resend code')
        setLoading(false)
        return
      }
      alert(t('codeResent'))
      setLoading(false)
    } catch {
      setError(t('unexpectedError'))
      setLoading(false)
    }
  }

  if (step === 'verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex flex-col">
        <AppHeader variant="public" />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <p className="text-neutral-600 dark:text-neutral-400">{t('verifyEmail')}</p>
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
                  {t('checkEmail')}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('sentCode')} <strong>{formData.email}</strong>
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
                    {t('verificationCode')}
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
                  {loading ? t('verifying') : t('verifyEmailBtn')}
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('noCode')}{' '}
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold disabled:opacity-50 transition-colors duration-normal"
                  >
                    {t('resend')}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const eyeOpenSvg = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  )
  const eyeClosedSvg = (
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
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex flex-col">
      <AppHeader variant="public" />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <p className="text-neutral-600 dark:text-neutral-400">{t('createAccount')}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                  <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  {t('iAmA')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(['parent', 'child'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`p-4 rounded-lg border-2 transition-all duration-normal relative ${formData.role === role ? 'border-primary-600 bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500/50' : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 bg-white dark:bg-neutral-800'}`}
                    >
                      {formData.role === role && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="text-2xl mb-2">{role === 'parent' ? '👨‍👩‍👧‍👦' : '🎓'}</div>
                      <div
                        className={`font-semibold ${formData.role === role ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-900 dark:text-white'}`}
                      >
                        {role === 'parent' ? t('parent') : t('student')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  {t('fullName')}
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
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  {t('dateOfBirth')}
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                />
                {formData.dateOfBirth && (
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {t('ageYears', { age: calculateAge(formData.dateOfBirth) })}
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
                  className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
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
                    minLength={12}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (e.target.value) validatePassword(e.target.value)
                    }}
                    className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                    placeholder={t('createPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                  >
                    {showPassword ? eyeOpenSvg : eyeClosedSvg}
                  </button>
                </div>
                {formData.password && (
                  <p
                    className={`mt-2 text-sm ${passwordStrength === t('strongPassword') ? 'text-success-600 dark:text-success-400' : 'text-neutral-600 dark:text-neutral-400'}`}
                  >
                    {passwordStrength}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  {t('confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-normal outline-none"
                    placeholder={t('confirmPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                  >
                    {showConfirmPassword ? eyeOpenSvg : eyeClosedSvg}
                  </button>
                </div>
              </div>
              <div>
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                  onSuccess={(token) => {
                    setTurnstileToken(token)
                    setTurnstileLoading(false)
                  }}
                  onError={() => {
                    setError(t('securityRefresh'))
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
                    {tCommon('loading_security')}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !turnstileToken || turnstileLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading
                  ? t('creatingAccount')
                  : turnstileLoading
                    ? t('loadingVerification')
                    : t('createAccountBtn')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('hasAccount')}{' '}
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors duration-normal"
                >
                  {t('signInLink')}
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              {t('agreeByCreate')}{' '}
              <Link
                href="/terms"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-normal"
              >
                {t('termsOfService')}
              </Link>{' '}
              {t('and')}{' '}
              <Link
                href="/privacy"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-normal"
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
