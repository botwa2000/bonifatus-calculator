'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

type ThemeChoice = 'light' | 'dark' | 'system'

interface ProfileClientProps {
  email: string
  fullName: string
  dateOfBirth: string | null
  themePreference: ThemeChoice
  role: 'parent' | 'child'
}

export default function ProfileClient({
  email,
  fullName,
  dateOfBirth,
  themePreference,
  role,
}: ProfileClientProps) {
  const router = useRouter()

  const [name, setName] = useState(fullName)
  const [dob, setDob] = useState(dateOfBirth || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [theme, setTheme] = useState<ThemeChoice>(themePreference)
  const [statusMessage, setStatusMessage] = useState('')
  const [passwordStrength, setPasswordStrength] = useState('')
  const [saving, setSaving] = useState({
    profile: false,
    password: false,
    theme: false,
    deleting: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const applyTheme = (choice: ThemeChoice) => {
    const root = document.documentElement
    if (choice === 'dark') {
      root.classList.add('dark')
    } else if (choice === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
    localStorage.setItem('theme', choice)
  }

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as ThemeChoice | null) || themePreference
    setTheme(stored)
    applyTheme(stored)
  }, [themePreference])

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

  const calculateAge = (value: string | null) => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - parsed.getFullYear()
    const m = today.getMonth() - parsed.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
      age -= 1
    }
    if (age < 0 || age > 150) return null
    return age
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving((prev) => ({ ...prev, profile: true }))
    setStatusMessage('')

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim() || undefined,
          dateOfBirth: dob || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatusMessage(data.error || 'Failed to update profile')
      } else {
        setStatusMessage('Profile updated')
      }
    } catch {
      setStatusMessage('Failed to update profile')
    }

    setSaving((prev) => ({ ...prev, profile: false }))
  }

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newPassword || !confirmPassword) {
      setStatusMessage('Please enter and confirm your new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage('Passwords do not match.')
      return
    }
    if (!validatePassword(newPassword)) {
      setStatusMessage(passwordStrength)
      return
    }

    setSaving((prev) => ({ ...prev, password: true }))
    setStatusMessage('')

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatusMessage(data.error || 'Failed to update password')
      } else {
        setStatusMessage('Password updated.')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordStrength('')
      }
    } catch {
      setStatusMessage('Failed to update password')
    }

    setSaving((prev) => ({ ...prev, password: false }))
  }

  const handleThemeChange = async (choice: ThemeChoice) => {
    setTheme(choice)
    applyTheme(choice)
    setSaving((prev) => ({ ...prev, theme: true }))
    setStatusMessage('')

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: choice }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatusMessage(data.error || 'Failed to save theme preference')
      } else {
        setStatusMessage(`Theme set to ${choice}.`)
      }
    } catch {
      setStatusMessage('Failed to save theme preference')
    }

    setSaving((prev) => ({ ...prev, theme: false }))
  }

  const handleDeleteAccount = async () => {
    setSaving((prev) => ({ ...prev, deleting: true }))
    setStatusMessage('')
    try {
      const response = await fetch('/api/profile/delete', { method: 'POST' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete account')
      }
      setStatusMessage('Account deleted. Signing you out...')
      await signOut({ redirect: false })
      router.push('/')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account'
      setStatusMessage(message)
    } finally {
      setSaving((prev) => ({ ...prev, deleting: false }))
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-4 py-3 shadow-sm">
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
          >
            &larr; Back to homepage
          </Link>
          <div className="flex gap-3 text-sm">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-md transition-all"
            >
              Profile
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
              {role} profile
            </p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Your profile</h1>
            <p className="text-neutral-600 dark:text-neutral-300">
              Manage your account, security, and preferences.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
          >
            Logout
          </button>
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900/20 px-4 py-3 text-sm text-info-800 dark:text-info-200">
            {statusMessage}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-card"
          >
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Basic info</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Update your display name.
              </p>
            </div>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Full name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Date of birth</span>
              <input
                type="date"
                value={dob}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {calculateAge(dob) !== null && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Age: {calculateAge(dob)} years
                </p>
              )}
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Email address</span>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Email cannot be changed at this time.
              </p>
            </label>
            <button
              type="submit"
              disabled={saving.profile}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg transition-all disabled:opacity-60"
            >
              {saving.profile ? 'Saving...' : 'Save profile'}
            </button>
          </form>

          <form
            onSubmit={handlePasswordChange}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-card"
          >
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Password</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Set a new password to keep your account secure.
              </p>
            </div>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">New password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 pr-12 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Confirm password
              </span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 pr-12 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            {passwordStrength && (
              <p
                className={`text-xs ${
                  passwordStrength === 'Strong password'
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-error-600 dark:text-error-400'
                }`}
              >
                {passwordStrength}
              </p>
            )}
            <button
              type="submit"
              disabled={saving.password}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg transition-all disabled:opacity-60"
            >
              {saving.password ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Theme preference
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Choose light or dark mode.
                </p>
              </div>
              {saving.theme && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Saving...</span>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              {(['light', 'dark', 'system'] as ThemeChoice[]).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleThemeChange(choice)}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    theme === choice
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white border-transparent shadow-button'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500'
                  }`}
                >
                  {choice === 'system'
                    ? 'System default'
                    : choice.charAt(0).toUpperCase() + choice.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/10 p-6 space-y-4 shadow-card">
            <div>
              <h2 className="text-lg font-semibold text-error-700 dark:text-error-300">
                Danger zone
              </h2>
              <p className="text-sm text-error-600 dark:text-error-200">
                Permanently delete your account and data.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={saving.deleting}
              className="w-full px-4 py-2 rounded-lg bg-error-600 text-white font-semibold hover:bg-error-700 transition-colors disabled:opacity-60"
            >
              {saving.deleting ? 'Deleting...' : 'Delete account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
