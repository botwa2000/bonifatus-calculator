'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/components/providers/ThemeProvider'

type NavItem = { label: string; href: string }

type AppHeaderProps =
  | {
      variant: 'public'
      isAuthed?: boolean
    }
  | {
      variant: 'auth'
      navItems: NavItem[]
      userName?: string | null
      userRole?: string | null
    }

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
  const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'
  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${label}`}
      className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  )
}

export function AppHeader(props: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    const baseHref = href.split('#')[0] || '/'
    if (!pathname) return false
    if (href.startsWith('#')) return false
    return pathname.startsWith(baseHref)
  }

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await signOut({ redirect: false })
    } catch {
      // signOut may fail if CSRF fetch is blocked — clear cookie manually
      document.cookie = 'next-auth.session-token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie =
        '__Secure-next-auth.session-token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    // Always redirect regardless of signOut outcome
    router.push('/login')
    router.refresh()
  }

  if (props.variant === 'public') {
    return (
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
          >
            Bonifatus
          </Link>
          <nav className="flex gap-4 items-center">
            <a
              href="#features"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              Benefits
            </a>
            <ThemeToggle />
            {props.isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    )
  }

  const { navItems, userName, userRole } = props

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
          >
            Bonifatus
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden flex-col text-right leading-tight sm:flex">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {userName || 'User'}
            </span>
            {userRole && (
              <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {userRole}
              </span>
            )}
          </div>
          <Link
            href="/settings"
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="hidden sm:inline-flex rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-primary-400 hover:text-primary-700 disabled:opacity-60 dark:border-neutral-700 dark:text-white dark:hover:border-primary-500 dark:hover:text-primary-200"
          >
            {signingOut ? 'Signing out\u2026' : 'Logout'}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <div
        className={`sm:hidden border-t border-neutral-200 dark:border-neutral-800 ${mobileOpen ? '' : 'hidden'}`}
      >
        <nav className="flex flex-col px-4 py-2 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive(item.href)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-left text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 disabled:opacity-60"
          >
            {signingOut ? 'Signing out\u2026' : 'Logout'}
          </button>
        </nav>
      </div>
    </header>
  )
}
