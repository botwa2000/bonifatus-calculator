'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { resolveLocalized } from '@/lib/i18n'

type ThemeChoice = 'light' | 'dark' | 'system'
type Tab = 'personal' | 'security' | 'school' | 'connections' | 'danger'

type ParentConnection = {
  id: string
  parentId: string
  childId: string
  invitationStatus: string
  invitedAt?: string
  respondedAt?: string | null
  parent?: { id: string; fullName: string }
  child?: { id: string; fullName: string }
}

interface ProfileClientProps {
  email: string
  fullName: string
  dateOfBirth: string | null
  themePreference: ThemeChoice
  role: 'parent' | 'child'
  schoolName?: string | null
  avatarUrl?: string | null
  defaultGradingSystemId?: string | null
  defaultClassLevel?: number | null
  gradingSystems: Array<{
    id: string
    name: string | Record<string, string>
    code: string | null
  }>
}

export default function ProfileClient({
  email,
  fullName,
  dateOfBirth,
  themePreference,
  role,
  schoolName: initialSchoolName,
  avatarUrl: initialAvatarUrl,
  defaultGradingSystemId: initialGradingSystemId,
  defaultClassLevel: initialClassLevel,
  gradingSystems,
}: ProfileClientProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('profile')
  const tn = useTranslations('nav')
  const ta = useTranslations('auth')
  const tc = useTranslations('common')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'personal', label: t('tabPersonal') },
    { key: 'security', label: t('tabSecurity') },
    ...(role === 'child' ? [{ key: 'school' as Tab, label: t('tabSchool') }] : []),
    { key: 'connections', label: t('tabConnections') },
    { key: 'danger', label: t('tabDanger') },
  ]

  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [name, setName] = useState(fullName)
  const [schoolNameVal, setSchoolNameVal] = useState(initialSchoolName || '')
  const [dob, setDob] = useState(dateOfBirth || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [theme, setTheme] = useState<ThemeChoice>(themePreference)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info')
  const [passwordStrength, setPasswordStrength] = useState('')
  const [saving, setSaving] = useState({
    profile: false,
    password: false,
    theme: false,
    deleting: false,
    avatar: false,
    email: false,
    emailVerify: false,
    school: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || '')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailChangeStep, setEmailChangeStep] = useState<'idle' | 'code_sent' | 'done'>('idle')

  // School & Grading
  const [gradingSystemId, setGradingSystemId] = useState(initialGradingSystemId || '')
  const [classLevel, setClassLevel] = useState(initialClassLevel || 1)

  // Connections
  const [connections, setConnections] = useState<ParentConnection[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(true)
  const [connectCode, setConnectCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const showStatus = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatusMessage(msg)
    setStatusType(type)
    setTimeout(() => setStatusMessage(''), 5000)
  }, [])

  // Load connections
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/connections/list')
        const data = await res.json()
        if (data.success) {
          setConnections(role === 'child' ? data.asChild || [] : data.asParent || [])
        }
      } catch {
        /* ignore */
      } finally {
        setConnectionsLoading(false)
      }
    }
    load()
  }, [role])

  const applyTheme = (choice: ThemeChoice) => {
    const root = document.documentElement
    if (choice === 'dark') root.classList.add('dark')
    else if (choice === 'light') root.classList.remove('dark')
    else {
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
      setPasswordStrength(ta('passwordMinLength'))
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordStrength(ta('passwordUppercase'))
      return false
    }
    if (!/[a-z]/.test(password)) {
      setPasswordStrength(ta('passwordLowercase'))
      return false
    }
    if (!/[0-9]/.test(password)) {
      setPasswordStrength(ta('passwordNumber'))
      return false
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setPasswordStrength(ta('passwordSpecial'))
      return false
    }
    setPasswordStrength(ta('strongPassword'))
    return true
  }

  const calculateAge = (value: string | null) => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - parsed.getFullYear()
    const m = today.getMonth() - parsed.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) age -= 1
    if (age < 0 || age > 150) return null
    return age
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving((prev) => ({ ...prev, profile: true }))
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim() || undefined,
          dateOfBirth: dob || null,
          schoolName: role === 'child' ? schoolNameVal.trim() || null : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showStatus(data.error || ta('unexpectedError'), 'error')
      } else {
        showStatus(t('profileUpdated'), 'success')
      }
    } catch {
      showStatus(ta('unexpectedError'), 'error')
    }
    setSaving((prev) => ({ ...prev, profile: false }))
  }

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newPassword || !confirmPassword) {
      showStatus(ta('passwordsNoMatch'), 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showStatus(ta('passwordsNoMatch'), 'error')
      return
    }
    if (!validatePassword(newPassword)) {
      showStatus(passwordStrength, 'error')
      return
    }

    setSaving((prev) => ({ ...prev, password: true }))
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showStatus(data.error || ta('unexpectedError'), 'error')
      } else {
        showStatus(t('passwordUpdated'), 'success')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordStrength('')
      }
    } catch {
      showStatus(ta('unexpectedError'), 'error')
    }
    setSaving((prev) => ({ ...prev, password: false }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showStatus('File too large (max 5MB)', 'error')
      return
    }
    setSaving((prev) => ({ ...prev, avatar: true }))
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setAvatarUrl(data.avatarUrl + '?t=' + Date.now())
        showStatus(t('avatarUpdated'), 'success')
      } else {
        showStatus(data.error || ta('unexpectedError'), 'error')
      }
    } catch {
      showStatus(ta('unexpectedError'), 'error')
    }
    setSaving((prev) => ({ ...prev, avatar: false }))
  }

  const handleEmailChangeRequest = async () => {
    if (!newEmail || !newEmail.includes('@')) return
    setSaving((prev) => ({ ...prev, email: true }))
    try {
      const res = await fetch('/api/profile/change-email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setEmailChangeStep('code_sent')
        showStatus(t('verificationCodeSent'), 'success')
      } else {
        showStatus(data.error || ta('unexpectedError'), 'error')
      }
    } catch {
      showStatus(ta('unexpectedError'), 'error')
    }
    setSaving((prev) => ({ ...prev, email: false }))
  }

  const handleEmailChangeVerify = async () => {
    if (emailCode.length !== 6) return
    setSaving((prev) => ({ ...prev, emailVerify: true }))
    try {
      const res = await fetch('/api/profile/change-email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode }),
      })
      const data = await res.json()
      if (data.success) {
        setEmailChangeStep('done')
        showStatus(t('emailChanged'), 'success')
        setNewEmail('')
        setEmailCode('')
      } else {
        showStatus(data.error || ta('unexpectedError'), 'error')
      }
    } catch {
      showStatus(ta('unexpectedError'), 'error')
    }
    setSaving((prev) => ({ ...prev, emailVerify: false }))
  }

  const handleSaveSchool = async () => {
    setSaving((prev) => ({ ...prev, school: true }))
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: schoolNameVal.trim() || null,
          defaultGradingSystemId: gradingSystemId || null,
          defaultClassLevel: classLevel,
        }),
      })
      if (res.ok) showStatus(t('profileUpdated'), 'success')
      else showStatus(ta('unexpectedError'), 'error')
    } catch {
      showStatus(ta('unexpectedError'), 'error')
    }
    setSaving((prev) => ({ ...prev, school: false }))
  }

  const handleDeleteAccount = async () => {
    setSaving((prev) => ({ ...prev, deleting: true }))
    try {
      const response = await fetch('/api/profile/delete', { method: 'POST' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || ta('unexpectedError'))
      }
      showStatus(t('accountDeleted'), 'success')
      await signOut({ redirect: false })
      router.push('/')
      router.refresh()
    } catch (error) {
      showStatus(error instanceof Error ? error.message : ta('unexpectedError'), 'error')
    } finally {
      setSaving((prev) => ({ ...prev, deleting: false }))
    }
  }

  const handleRedeem = async () => {
    setRedeeming(true)
    try {
      const res = await fetch('/api/connections/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: connectCode.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        showStatus('Connected successfully!', 'success')
        setConnectCode('')
        const listRes = await fetch('/api/connections/list')
        const listData = await listRes.json()
        if (listData.success)
          setConnections(role === 'child' ? listData.asChild || [] : listData.asParent || [])
      } else {
        showStatus(data.error || tc('error'), 'error')
      }
    } catch {
      showStatus(tc('error'), 'error')
    }
    setRedeeming(false)
  }

  const handleRemoveConnection = async (id: string) => {
    setRemovingId(id)
    try {
      const res = await fetch('/api/connections/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipId: id }),
      })
      const data = await res.json()
      if (data.success) {
        setConnections((prev) => prev.filter((c) => c.id !== id))
        showStatus('Connection removed.', 'success')
      } else {
        showStatus(data.error || tc('error'), 'error')
      }
    } catch {
      showStatus(tc('error'), 'error')
    }
    setRemovingId(null)
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '\u2014'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '\u2014'
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const cardClass =
    'rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-card'
  const inputClass =
    'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'
  const btnPrimary =
    'px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg transition-all disabled:opacity-60'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-200 text-2xl font-bold border-2 border-primary-200 dark:border-primary-800">
                  {(name || 'U')[0]?.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={saving.avatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity"
              >
                {saving.avatar ? '...' : t('uploadAvatar')}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                {t('roleProfile', { role })}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                {t('title')}
              </h1>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
          >
            {tn('dashboard')}
          </Link>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm transition-all ${
              statusType === 'success'
                ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-200'
                : statusType === 'error'
                  ? 'border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-200'
                  : 'border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900/20 text-info-800 dark:text-info-200'
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-200 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveProfile} className={cardClass}>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('basicInfo')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('basicInfoDesc')}
                </p>
              </div>
              <label className="block space-y-1">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('fullName')}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('dateOfBirth')}
                </span>
                <input
                  type="date"
                  value={dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputClass}
                />
                {calculateAge(dob) !== null && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('ageYears', { age: calculateAge(dob)! })}
                  </p>
                )}
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('emailAddress')}
                </span>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                />
              </label>
              <button type="submit" disabled={saving.profile} className={btnPrimary}>
                {saving.profile ? t('savingProfile') : t('saveProfile')}
              </button>
            </form>

            {/* Theme */}
            <div className={cardClass}>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('themeTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('themeDesc')}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {(['light', 'dark', 'system'] as ThemeChoice[]).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => {
                      setTheme(choice)
                      applyTheme(choice)
                      fetch('/api/profile/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ themePreference: choice }),
                      })
                    }}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      theme === choice
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white border-transparent shadow-button'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500'
                    }`}
                  >
                    {choice === 'system'
                      ? t('systemDefault')
                      : choice.charAt(0).toUpperCase() + choice.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <form onSubmit={handlePasswordChange} className={cardClass}>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('passwordTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('passwordDesc')}
                </p>
              </div>
              <label className="block space-y-1">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('newPassword')}
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      validatePassword(e.target.value)
                    }}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm"
                  >
                    {showPassword ? tc('hidePassword') : tc('showPassword')}
                  </button>
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('confirmPassword')}
                </span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm"
                  >
                    {showConfirmPassword ? tc('hidePassword') : tc('showPassword')}
                  </button>
                </div>
              </label>
              {passwordStrength && (
                <p
                  className={`text-xs ${passwordStrength === ta('strongPassword') ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}
                >
                  {passwordStrength}
                </p>
              )}
              <button type="submit" disabled={saving.password} className={btnPrimary}>
                {saving.password ? t('updatingPassword') : t('updatePassword')}
              </button>
            </form>

            {/* Email Change */}
            <div className={cardClass}>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('emailChangeTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('emailChangeDesc')}
                </p>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {t('emailAddress')}: <strong>{email}</strong>
              </p>
              {emailChangeStep === 'idle' && (
                <>
                  <label className="block space-y-1">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {t('newEmail')}
                    </span>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@example.com"
                      className={inputClass}
                    />
                  </label>
                  <button
                    onClick={handleEmailChangeRequest}
                    disabled={saving.email || !newEmail.includes('@')}
                    className={btnPrimary}
                  >
                    {saving.email ? t('sendingCode') : t('sendVerificationCode')}
                  </button>
                </>
              )}
              {emailChangeStep === 'code_sent' && (
                <>
                  <label className="block space-y-1">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {t('enterVerificationCode')}
                    </span>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="123456"
                      className={`${inputClass} text-center text-lg tracking-widest`}
                    />
                  </label>
                  <button
                    onClick={handleEmailChangeVerify}
                    disabled={saving.emailVerify || emailCode.length !== 6}
                    className={btnPrimary}
                  >
                    {saving.emailVerify ? t('verifyingCode') : t('verifyAndChange')}
                  </button>
                  <button
                    onClick={() => {
                      setEmailChangeStep('idle')
                      setEmailCode('')
                    }}
                    className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    {tc('cancel')}
                  </button>
                </>
              )}
              {emailChangeStep === 'done' && (
                <p className="text-sm text-success-600 dark:text-success-400 font-semibold">
                  {t('emailChanged')}
                </p>
              )}
            </div>

            {/* OAuth - Coming Soon */}
            <div className={cardClass}>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('oauthTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('oauthDesc')}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  disabled
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('googleConnect')} — {tc('comingSoon')}
                </button>
                <button
                  disabled
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                    />
                  </svg>
                  {t('appleConnect')} — {tc('comingSoon')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* School Tab (child only) */}
        {activeTab === 'school' && role === 'child' && (
          <div className={cardClass}>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {t('schoolAndGrading')}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('schoolAndGradingDesc')}
              </p>
            </div>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {t('schoolName')}
              </span>
              <input
                type="text"
                value={schoolNameVal}
                onChange={(e) => setSchoolNameVal(e.target.value)}
                placeholder={t('noSchoolSet')}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {t('defaultGradingSystem')}
              </span>
              <select
                value={gradingSystemId}
                onChange={(e) => setGradingSystemId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t('selectGradingSystem')}</option>
                {gradingSystems.map((gs) => (
                  <option key={gs.id} value={gs.id}>
                    {resolveLocalized(gs.name, locale)}
                    {gs.code ? ` (${gs.code})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {t('defaultClassLevel')}
              </span>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(Number(e.target.value))}
                className={inputClass}
              >
                {Array.from({ length: 13 }, (_, i) => i + 1).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={handleSaveSchool} disabled={saving.school} className={btnPrimary}>
              {saving.school ? tc('saving') : tc('save')}
            </button>
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div className={cardClass}>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('connectedAccounts')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('connectedAccountsDesc')}
                </p>
              </div>

              {/* Redeem code (child only) */}
              {role === 'child' && (
                <div className="flex gap-2">
                  <input
                    value={connectCode}
                    onChange={(e) => setConnectCode(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                    className={`flex-1 ${inputClass} text-center text-lg tracking-widest`}
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming || connectCode.trim().length !== 6}
                    className={btnPrimary}
                  >
                    {redeeming ? '...' : tc('save')}
                  </button>
                </div>
              )}

              {connectionsLoading ? (
                <p className="text-sm text-neutral-500">{tc('loading')}</p>
              ) : connections.length === 0 ? (
                <p className="text-sm text-neutral-500">{t('noConnections')}</p>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => {
                    const otherPerson = role === 'child' ? conn.parent : conn.child
                    const otherName = otherPerson?.fullName || 'Unknown'
                    const otherRole = role === 'child' ? 'Parent' : 'Child'

                    return (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between rounded-xl border border-neutral-100 dark:border-neutral-800 px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/70"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold">
                            {otherName[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {otherName}
                            </p>
                            <div className="flex gap-3 text-xs text-neutral-500">
                              <span className="font-semibold text-primary-600 dark:text-primary-300">
                                {otherRole}
                              </span>
                              <span>{conn.invitationStatus}</span>
                              <span>{formatDate(conn.respondedAt || conn.invitedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveConnection(conn.id)}
                          disabled={removingId === conn.id}
                          className="text-sm font-semibold text-error-600 hover:text-error-700 disabled:opacity-60"
                        >
                          {removingId === conn.id ? '...' : tc('remove')}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="rounded-2xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/10 p-6 space-y-4 shadow-card">
            <div>
              <h2 className="text-lg font-semibold text-error-700 dark:text-error-300">
                {t('dangerZone')}
              </h2>
              <p className="text-sm text-error-600 dark:text-error-200">{t('dangerDesc')}</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={saving.deleting}
              className="w-full px-4 py-2 rounded-lg bg-error-600 text-white font-semibold hover:bg-error-700 transition-colors disabled:opacity-60"
            >
              {saving.deleting ? t('deleting') : t('deleteAccount')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
