'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

type NavItem = { label: string; href: string }

type AppHeaderProps = {
  navItems: NavItem[]
  userName?: string | null
  userRole?: string | null
}

export function AppHeader({ navItems, userName, userRole }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

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
      router.push('/login')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

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
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-primary-400 hover:text-primary-700 disabled:opacity-60 dark:border-neutral-700 dark:text-white dark:hover:border-primary-500 dark:hover:text-primary-200"
          >
            {signingOut ? 'Signing out\u2026' : 'Logout'}
          </button>
        </div>
      </div>
      <div className="sm:hidden border-t border-neutral-200 dark:border-neutral-800">
        <nav className="flex overflow-x-auto px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mr-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive(item.href)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
