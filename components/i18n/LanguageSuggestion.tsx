'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

export interface LanguageSuggestionStrings {
  message: string
  switch: string
  dismiss: string
}

const DISMISS_KEY = 'language-suggestion-dismissed'

function preferredLocale(): Locale | null {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const primary = tag.toLowerCase().split('-')[0]
    const match = routing.locales.find((l) => l === primary)
    if (match) return match
  }
  return null
}

/**
 * Prefixed URLs always show their own language — we never redirect someone who opened
 * /en/… on purpose. When the browser prefers another locale that this page exists in
 * (per its hreflang links), offer the switch instead, worded in the visitor's language.
 */
export function LanguageSuggestion({
  strings,
}: {
  strings: Record<Locale, LanguageSuggestionStrings>
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [suggested, setSuggested] = useState<Locale | null>(null)

  useEffect(() => {
    const preferred = preferredLocale()
    if (!preferred || preferred === locale) return setSuggested(null)
    const exists = document.querySelector(`link[rel="alternate"][hreflang="${preferred}"]`)
    if (!exists) return setSuggested(null)
    try {
      if (localStorage.getItem(DISMISS_KEY) === preferred) return setSuggested(null)
    } catch {
      // Storage unavailable (private mode) — still offer the switch.
    }
    setSuggested(preferred)
  }, [locale, pathname])

  if (!suggested) return null
  const s = strings[suggested]

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, suggested)
    } catch {
      // Not persisted; hidden for this page view only.
    }
    setSuggested(null)
  }

  return (
    <div
      lang={suggested}
      className="bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <span className="text-neutral-700 dark:text-neutral-200">{s.message}</span>
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: suggested })}
          className="font-semibold text-primary-700 dark:text-primary-300 hover:underline"
        >
          {s.switch}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={s.dismiss}
          className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
