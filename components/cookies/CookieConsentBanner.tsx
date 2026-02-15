'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const CONSENT_KEY = 'bonifatus-cookie-consent'

type CookieConsent = {
  essential: boolean
  analytics: boolean
  timestamp: number
}

function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CookieConsent
  } catch {
    return null
  }
}

function storeConsent(consent: CookieConsent) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  } catch {
    // storage unavailable
  }
}

export function CookieConsentBanner() {
  const t = useTranslations('cookies')
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [showReopenBtn, setShowReopenBtn] = useState(false)

  useEffect(() => {
    const consent = getStoredConsent()
    if (!consent) {
      setVisible(true)
    } else {
      setShowReopenBtn(true)
    }
  }, [])

  const handleAcceptAll = () => {
    storeConsent({ essential: true, analytics: true, timestamp: Date.now() })
    setVisible(false)
    setShowDetails(false)
    setShowReopenBtn(true)
  }

  const handleEssentialOnly = () => {
    storeConsent({ essential: true, analytics: false, timestamp: Date.now() })
    setVisible(false)
    setShowDetails(false)
    setShowReopenBtn(true)
  }

  const handleSavePreferences = () => {
    storeConsent({ essential: true, analytics: analyticsEnabled, timestamp: Date.now() })
    setVisible(false)
    setShowDetails(false)
    setShowReopenBtn(true)
  }

  const handleReopen = () => {
    const consent = getStoredConsent()
    if (consent) {
      setAnalyticsEnabled(consent.analytics)
    }
    setShowReopenBtn(false)
    setVisible(true)
    setShowDetails(true)
  }

  if (!visible && !showReopenBtn) return null

  return (
    <>
      {/* Re-open preferences button */}
      {showReopenBtn && !visible && (
        <button
          onClick={handleReopen}
          aria-label={t('manageCookies')}
          className="fixed bottom-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg
            className="w-5 h-5 text-neutral-600 dark:text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3c-1.2 0-2.4.3-3.3.8A3.5 3.5 0 005 7a3.5 3.5 0 00-2 3.2c0 1 .4 2 1.1 2.7A4 4 0 003 16a4 4 0 004 4h10a4 4 0 004-4 4 4 0 00-1-2.6 3.5 3.5 0 00.5-1.8A3.5 3.5 0 0018 8.5a3.5 3.5 0 00-2.8-3.4A5 5 0 0012 3z"
            />
            <circle cx="8" cy="14" r="1" fill="currentColor" />
            <circle cx="12" cy="11" r="1" fill="currentColor" />
            <circle cx="15" cy="15" r="1" fill="currentColor" />
          </svg>
        </button>
      )}

      {/* Banner */}
      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t('bannerTitle')}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  {t('bannerDescription')}{' '}
                  <Link
                    href="/cookies"
                    className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('learnMore')}
                  </Link>
                </p>
              </div>
            </div>

            {/* Detail panel */}
            {showDetails && (
              <div className="mb-4 space-y-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4">
                {/* Essential */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {t('categoryEssential')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('categoryEssentialDesc')}
                    </p>
                  </div>
                  <span className="rounded-full bg-success-100 dark:bg-success-900/30 px-2.5 py-0.5 text-xs font-semibold text-success-700 dark:text-success-300">
                    {t('alwaysOn')}
                  </span>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {t('categoryAnalytics')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('categoryAnalyticsDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      analyticsEnabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
              {!showDetails ? (
                <>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="order-3 sm:order-1 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    {t('managePreferences')}
                  </button>
                  <button
                    onClick={handleEssentialOnly}
                    className="order-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {t('essentialOnly')}
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="order-1 sm:order-3 px-4 py-2 rounded-lg bg-primary-600 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                  >
                    {t('acceptAll')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    {t('back')}
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                  >
                    {t('savePreferences')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
