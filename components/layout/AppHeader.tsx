'use client'

import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

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

const localeNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Fran\u00e7ais',
  it: 'Italiano',
  es: 'Espa\u00f1ol',
  ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
}

function LocaleDropdown() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('switchLanguage')}
        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path
            strokeLinecap="round"
            strokeWidth={2}
            d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 py-1 z-50">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                router.replace(pathname, { locale: loc })
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                loc === locale
                  ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900/30 dark:text-primary-200'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {localeNames[loc] || loc.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppHeader(props: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
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
      document.cookie = 'next-auth.session-token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie =
        '__Secure-next-auth.session-token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    router.push('/')
    router.refresh()
  }

  if (props.variant === 'public') {
    return (
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo-icon.svg"
              alt="Bonifatus"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Bonifatus
            </span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-4 items-center">
            <Link
              href="/faq"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              {t('faq')}
            </Link>
            <Link
              href="/about"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              {t('about')}
            </Link>
            <Link
              href="/contact"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              {t('contact')}
            </Link>
            <LocaleDropdown />
            {props.isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href="/profile"
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
                >
                  {t('profile')}
                </Link>
                <Link
                  href="/settings"
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all"
                >
                  {t('settings')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all"
                >
                  {t('signUp')}
                </Link>
              </>
            )}
          </nav>
          {/* Mobile controls */}
          <div className="flex items-center gap-2 sm:hidden">
            <LocaleDropdown />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
            <Link
              href="/faq"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
            >
              {t('faq')}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
            >
              {t('about')}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
            >
              {t('contact')}
            </Link>
            {props.isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
                >
                  {t('profile')}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
                >
                  {t('settings')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition"
                >
                  {t('signUp')}
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
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/logo-icon.svg"
              alt="Bonifatus"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent hidden sm:inline">
              Bonifatus
            </span>
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
          <Link
            href="/profile"
            className="hidden items-center gap-2 sm:flex rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-200 text-sm font-bold">
              {(userName || t('user'))[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex flex-col text-right leading-tight">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {userName || t('user')}
              </span>
              {userRole && (
                <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {userRole}
                </span>
              )}
            </div>
          </Link>
          <LocaleDropdown />
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="hidden sm:inline-flex rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-primary-400 hover:text-primary-700 disabled:opacity-60 dark:border-neutral-700 dark:text-white dark:hover:border-primary-500 dark:hover:text-primary-200"
          >
            {signingOut ? t('signingOut') : t('logout')}
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
        <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
          <p className="font-semibold text-neutral-900 dark:text-white">{userName || t('user')}</p>
          {userRole && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">{userRole}</p>
          )}
        </div>
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
            {signingOut ? t('signingOut') : t('logout')}
          </button>
        </nav>
      </div>
    </header>
  )
}
