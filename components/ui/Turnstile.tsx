/**
 * Cloudflare Turnstile Component
 * Invisible bot protection widget
 * Uses centralized theme from lib/design
 */

'use client'

import React, { useEffect, useRef } from 'react'

export interface TurnstileProps {
  siteKey: string
  onSuccess: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact'
        }
      ) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}

export const Turnstile: React.FC<TurnstileProps> = ({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
}) => {
  const debugEnabled =
    process.env.NEXT_PUBLIC_TURNSTILE_DEBUG === 'true' || process.env.TURNSTILE_DEBUG === 'true'
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Load Turnstile script if not already loaded
    const loadTurnstile = () => {
      if (window.turnstile) {
        if (debugEnabled) console.info('[turnstile-debug] script already loaded')
        renderTurnstile()
        return
      }

      if (document.getElementById('turnstile-shared-script')) {
        if (debugEnabled) console.info('[turnstile-debug] script tag already present')
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.id = 'turnstile-shared-script'
      script.onload = () => {
        if (debugEnabled) console.info('[turnstile-debug] script loaded')
        renderTurnstile()
      }
      script.onerror = () => {
        if (debugEnabled) console.error('[turnstile-debug] script failed to load')
        onError?.()
      }
      document.head.appendChild(script)
    }

    const renderTurnstile = () => {
      if (!containerRef.current || !window.turnstile) return

      try {
        if (widgetIdRef.current) {
          if (debugEnabled) console.info('[turnstile-debug] removing previous widget')
          window.turnstile.remove(widgetIdRef.current)
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onSuccess,
          'error-callback': onError,
          'expired-callback': onExpire,
          theme,
          size,
        })
        if (debugEnabled)
          console.info('[turnstile-debug] widget rendered', { widgetId: widgetIdRef.current })
      } catch (error) {
        console.error('Failed to render Turnstile:', error)
        if (debugEnabled) console.error('[turnstile-debug] render error', error)
        onError?.()
      }
    }

    loadTurnstile()

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (error) {
          console.error('Failed to remove Turnstile widget:', error)
        }
      }
    }
  }, [siteKey, onSuccess, onError, onExpire, theme, size])

  return <div ref={containerRef} className="flex justify-center my-4" />
}

/**
 * Turnstile Loading Placeholder
 * Shows while Turnstile widget is loading
 */
export const TurnstileLoading: React.FC = () => {
  return (
    <div className="flex justify-center items-center my-4 p-6 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
      <div className="flex items-center gap-2 text-neutral-500">
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm">Loading security verification...</span>
      </div>
    </div>
  )
}
