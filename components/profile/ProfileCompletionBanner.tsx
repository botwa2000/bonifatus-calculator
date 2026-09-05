'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

type ProfileStatus = {
  hasName: boolean
  hasBirthday: boolean
  hasSchool: boolean
  hasGrading: boolean
}

type Props = {
  role: 'student' | 'parent'
}

const SESSION_DISMISS_KEY = 'bonifatus-profile-banner-dismissed'

export function ProfileCompletionBanner({ role }: Props) {
  const t = useTranslations('profileCompletion')
  const [status, setStatus] = useState<ProfileStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === '1') {
        setDismissed(true)
        return
      }
    } catch {}

    async function load() {
      try {
        const res = await fetch('/api/profile/update')
        const data = await res.json()
        if (!res.ok || !data.success) return
        const p = data.profile
        setStatus({
          hasName: !!p.fullName,
          hasBirthday: !!p.dateOfBirth,
          hasSchool: !!(p.schoolName || p.schoolTown),
          hasGrading: !!p.defaultGradingSystemId,
        })
      } catch {}
    }
    load()
  }, [])

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
    } catch {}
    setDismissed(true)
  }

  if (dismissed || !status) return null

  const items =
    role === 'student'
      ? [
          { key: 'name', done: status.hasName, label: t('itemName'), href: '/profile' },
          { key: 'birthday', done: status.hasBirthday, label: t('itemBirthday'), href: '/profile' },
          { key: 'school', done: status.hasSchool, label: t('itemSchool'), href: '/settings' },
          { key: 'grading', done: status.hasGrading, label: t('itemGrading'), href: '/settings' },
        ]
      : [{ key: 'name', done: status.hasName, label: t('itemName'), href: '/profile' }]

  const incomplete = items.filter((i) => !i.done)
  if (incomplete.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t('title')}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">{t('subtitle')}</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label={t('dismiss')}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            {item.done ? (
              <div className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 text-white"
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
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 dark:border-amber-600 flex-shrink-0" />
            )}
            {item.done ? (
              <span className="text-sm text-neutral-500 dark:text-neutral-400 line-through">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
