'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

type ThemeChoice = 'light' | 'dark' | 'system'

interface ProfileClientProps {
  userId: string
  email: string
  fullName: string
  themePreference: ThemeChoice
  role: 'parent' | 'child'
}

export default function ProfileClient({
  userId,
  email,
  fullName,
  themePreference,
  role,
}: ProfileClientProps) {
  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables')
    }
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }, [])
  const router = useRouter()

  const [name, setName] = useState(fullName)
  const [newEmail, setNewEmail] = useState(email)
  const [newPassword, setNewPassword] = useState('')
  const [theme, setTheme] = useState<ThemeChoice>(themePreference)
  const [statusMessage, setStatusMessage] = useState('')
  const [saving, setSaving] = useState({
    profile: false,
    email: false,
    password: false,
    theme: false,
    deleting: false,
  })

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
    // respect previously chosen theme if it exists
    const stored = (localStorage.getItem('theme') as ThemeChoice | null) || themePreference
    setTheme(stored)
    applyTheme(stored)
  }, [themePreference])

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving((prev) => ({ ...prev, profile: true }))
    setStatusMessage('')

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: name.trim() || undefined })
      .eq('id', userId)

    if (error) {
      setStatusMessage(error.message || 'Failed to update profile')
    } else {
      setStatusMessage('Profile updated')
    }

    setSaving((prev) => ({ ...prev, profile: false }))
  }

  const handleEmailChange = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newEmail || newEmail === email) {
      setStatusMessage('Enter a new email to update.')
      return
    }

    setSaving((prev) => ({ ...prev, email: true }))
    setStatusMessage('')

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })

    if (error) {
      setStatusMessage(error.message || 'Failed to start email change')
    } else {
      setStatusMessage('Check your new inbox to confirm the email change.')
    }

    setSaving((prev) => ({ ...prev, email: false }))
  }

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setStatusMessage('Password must be at least 6 characters.')
      return
    }

    setSaving((prev) => ({ ...prev, password: true }))
    setStatusMessage('')

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setStatusMessage(error.message || 'Failed to update password')
    } else {
      setStatusMessage('Password updated. You may need to log in again on other devices.')
      setNewPassword('')
    }

    setSaving((prev) => ({ ...prev, password: false }))
  }

  const handleThemeChange = async (choice: ThemeChoice) => {
    setTheme(choice)
    applyTheme(choice)
    setSaving((prev) => ({ ...prev, theme: true }))
    setStatusMessage('')

    const { error } = await supabase
      .from('user_profiles')
      .update({ theme_preference: choice })
      .eq('id', userId)

    if (error) {
      setStatusMessage(error.message || 'Failed to save theme preference')
    } else {
      setStatusMessage(`Theme set to ${choice}.`)
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
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
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
                Update your display name and email.
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
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Email address</span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Changing email sends a confirmation link to the new address.
              </p>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving.profile}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg transition-all disabled:opacity-60"
              >
                {saving.profile ? 'Saving...' : 'Save profile'}
              </button>
              <button
                type="button"
                onClick={handleEmailChange}
                disabled={saving.email}
                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500 transition-colors disabled:opacity-60"
              >
                {saving.email ? 'Sending...' : 'Change email'}
              </button>
            </div>
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
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
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
