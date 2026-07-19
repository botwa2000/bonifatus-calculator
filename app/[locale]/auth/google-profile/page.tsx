'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { AppHeader } from '@/components/layout/AppHeader'

export default function GoogleProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const t = useTranslations('auth')

  const [role, setRole] = useState<'parent' | 'child'>('parent')
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.name) setFullName(session.user.name)
  }, [session])

  // If already set up, redirect
  useEffect(() => {
    if (session && !session.user.needsSetup) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/google-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, fullName, dateOfBirth }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || t('googleProfileError'))
        return
      }
      await update()
      router.push(role === 'parent' ? '/parent/dashboard' : '/student/dashboard')
    } catch {
      setError(t('googleProfileErrorUnexpected'))
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
              {t('googleProfileTitle')}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              {t('googleProfileSubtitle')}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                  <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                </div>
              )}

              {/* Role */}
              <div>
                <p className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  {t('googleProfileRolePrompt')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(['parent', 'child'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                        role === r
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-300'
                      }`}
                    >
                      <span className="text-2xl">{r === 'parent' ? '👨‍👩‍👧' : '🎓'}</span>
                      <span>
                        {r === 'parent'
                          ? t('googleProfileRoleParent')
                          : t('googleProfileRoleChild')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  {t('googleProfileNameLabel')}
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder={t('googleProfileNamePlaceholder')}
                />
              </div>

              {/* Date of birth */}
              <div>
                <label
                  htmlFor="dob"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  {t('googleProfileDobLabel')}
                </label>
                <input
                  id="dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? t('googleProfileSubmitting') : t('googleProfileSubmit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
