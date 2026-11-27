'use client'

import { useState } from 'react'
import { getPathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

/**
 * "Continue with Google": the primary way in on the sign-in and sign-up pages. It
 * succeeds far more often than email + password (no password to forget, no code).
 */
export function GoogleSignInButton({
  label,
  next = '/dashboard',
}: {
  label: string
  /** Same-site path to open after signing in (default: the dashboard router). */
  next?: string
}) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    try {
      const { signIn } = await import('next-auth/react')
      await signIn('google', { callbackUrl: getPathname({ href: next, locale }) })
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      data-testid="google-sign-in"
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-600 hover:border-neutral-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

/** "or with email" between the Google button and the email form. */
export function OrWithEmailDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
      <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
    </div>
  )
}
