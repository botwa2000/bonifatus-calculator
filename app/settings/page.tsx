'use client'

import Link from 'next/link'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <header className="space-y-2">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Account</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Settings</h1>
      </header>

      {/* Appearance */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Appearance</h2>
        <div className="flex flex-col gap-2">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <label
              key={t}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
                theme === t
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={t}
                checked={theme === t}
                onChange={() => setTheme(t)}
                className="accent-primary-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                  {t}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t === 'system'
                    ? 'Follow your operating system preference'
                    : t === 'light'
                      ? 'Always use light theme'
                      : 'Always use dark theme'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Subscription */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Subscription</h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">Bonifatus Free</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Core calculator, progress tracking, and family connections
            </p>
          </div>
          <span className="rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 px-3 py-1 text-xs font-semibold">
            Active
          </span>
        </div>
        <button
          disabled
          className="w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
        >
          Upgrade to Pro — Coming soon
        </button>
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Account</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/profile"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-neutral-600 transition"
          >
            Edit profile
          </Link>
          <Link
            href="/forgot-password"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-neutral-600 transition"
          >
            Change password
          </Link>
        </div>
      </section>
    </>
  )
}
