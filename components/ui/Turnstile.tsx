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
  onError?: (reason?: string) => void
  onExpire?: () => void
  onReady?: () => void
  executeOnReady?: boolean
  action?: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'invisible'
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
          action?: string
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'invisible'
        }
      ) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
      execute: (widgetId: string) => void
    }
  }
}

export const Turnstile: React.FC<TurnstileProps> = ({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  onReady,
  executeOnReady,
  action,
  theme = 'light',
  size = 'normal',
}) => {
  const debugEnabled =
    process.env.NEXT_PUBLIC_TURNSTILE_DEBUG === 'true' || process.env.TURNSTILE_DEBUG === 'true'
  const instanceIdRef = useRef(
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  )
  const log = React.useCallback(
    (message: string, meta?: Record<string, unknown>) => {
      if (!debugEnabled) return
      console.info(`[turnstile-debug][${instanceIdRef.current}] ${message}`, meta ?? {})
    },
    [debugEnabled]
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const scriptLoadedRef = useRef(false)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)
  const onReadyRef = useRef(onReady)
  const executeOnReadyRef = useRef(executeOnReady)
  const isExecutingRef = useRef(false)
  const widgetExecutedRef = useRef(false)
  const renderStartRef = useRef<number | null>(null)
  const executeStartRef = useRef<number | null>(null)
  const executeAttemptsRef = useRef(0)
  const readyAtRef = useRef<number | null>(null)
  const executeTimerRef = useRef<number | null>(null)
  const executeOnce = React.useCallback(() => {
    // Invisible widgets auto-execute; skip manual execute to avoid race
    if (executeOnReadyRef.current && size === 'invisible') {
      log('execute skipped (auto invisible mode)', {
        widgetId: widgetIdRef.current,
      })
      return
    }
    if (!executeOnReadyRef.current) return
    if (widgetExecutedRef.current) return
    if (isExecutingRef.current) {
      log('execute skipped (already marked executing)', {
        widgetId: widgetIdRef.current,
        executeAttempt: executeAttemptsRef.current,
      })
      return
    }
    if (!widgetIdRef.current || !window.turnstile?.execute) {
      log('execute skipped (widget not ready)', {
        widgetId: widgetIdRef.current,
        hasTurnstile: Boolean(window.turnstile),
      })
      return
    }

    const attemptExecute = (delayMs: number) => {
      if (executeTimerRef.current) {
        window.clearTimeout(executeTimerRef.current)
      }
      executeTimerRef.current = window.setTimeout(() => {
        try {
          // Reset only after the first attempt to avoid stepping on Turnstile's initial start
          if (executeAttemptsRef.current > 0 && window.turnstile?.reset && widgetIdRef.current) {
            window.turnstile.reset(widgetIdRef.current)
            log('reset before execute', {
              executeAttempt: executeAttemptsRef.current,
            })
          }
          widgetExecutedRef.current = true
          isExecutingRef.current = true
          executeAttemptsRef.current += 1
          executeStartRef.current = Date.now()
          window.turnstile?.execute(widgetIdRef.current as string)
          log('execute triggered', {
            widgetId: widgetIdRef.current,
            executeAttempt: executeAttemptsRef.current,
            sinceRenderMs:
              renderStartRef.current !== null ? Date.now() - renderStartRef.current : undefined,
            sinceReadyMs: readyAtRef.current !== null ? Date.now() - readyAtRef.current : undefined,
          })
        } catch (error: unknown) {
          const msg =
            typeof error === 'object' && error && 'message' in error
              ? String((error as { message?: string }).message ?? '')
              : ''
          if (msg.includes('already executing')) {
            log('execute skipped (already executing)', {
              widgetId: widgetIdRef.current,
              executeAttempt: executeAttemptsRef.current,
            })
            isExecutingRef.current = false
            widgetExecutedRef.current = false
            if (executeAttemptsRef.current < 3) {
              attemptExecute(200)
            } else {
              onErrorRef.current?.('execute-already-executing')
            }
            return
          }
          widgetExecutedRef.current = false
          isExecutingRef.current = false
          if (executeAttemptsRef.current >= 2) {
            onErrorRef.current?.('execute-failed')
          }
          log('execute failed', {
            widgetId: widgetIdRef.current,
            error:
              typeof error === 'object' && error && 'message' in error
                ? String((error as { message?: string }).message ?? '')
                : 'unknown',
          })
        }
      }, delayMs)
    }

    // first attempt with a slightly larger delay to let Turnstile settle
    attemptExecute(executeAttemptsRef.current === 0 ? 150 : 50)
  }, [log, size])

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
    onExpireRef.current = onExpire
    onReadyRef.current = onReady
    executeOnReadyRef.current = executeOnReady
  }, [onSuccess, onError, onExpire, onReady, executeOnReady])

  useEffect(() => {
    if (!containerRef.current) return

    // Load Turnstile script if not already loaded
    const loadTurnstile = () => {
      log('init', {
        executeOnReady: Boolean(executeOnReady),
        size,
        action,
        theme,
      })
      renderStartRef.current = Date.now()
      if (window.turnstile) {
        log('script already loaded')
        renderTurnstile()
        return
      }

      const existing = document.getElementById(
        'turnstile-shared-script'
      ) as HTMLScriptElement | null
      if (existing) {
        log('script tag already present')
        if (scriptLoadedRef.current || existing.dataset.loaded === 'true') {
          renderTurnstile()
          return
        }
        existing.onload = () => {
          scriptLoadedRef.current = true
          log('script loaded (existing)')
          renderTurnstile()
        }
        existing.onerror = () => {
          log('script failed to load (existing)')
          onErrorRef.current?.('script-failed-existing')
        }
        return
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.id = 'turnstile-shared-script'
      script.onload = () => {
        scriptLoadedRef.current = true
        log('script loaded')
        renderTurnstile()
      }
      script.onerror = () => {
        log('script failed to load')
        onErrorRef.current?.('script-failed')
      }
      document.head.appendChild(script)
    }

    const renderTurnstile = () => {
      if (!containerRef.current || !window.turnstile) return

      try {
        if (widgetIdRef.current) {
          log('widget already rendered', { widgetId: widgetIdRef.current })
          return
        }
        executeAttemptsRef.current = 0
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            widgetExecutedRef.current = false
            isExecutingRef.current = false
            const execDuration =
              executeStartRef.current !== null ? Date.now() - executeStartRef.current : undefined
            executeStartRef.current = null
            log('widget success', {
              widgetId: widgetIdRef.current,
              executeAttempt: executeAttemptsRef.current,
              sinceReadyMs:
                readyAtRef.current !== null ? Date.now() - readyAtRef.current : undefined,
              executeDurationMs: execDuration,
            })
            onSuccessRef.current(token)
          },
          'error-callback': () => {
            widgetExecutedRef.current = false
            isExecutingRef.current = false
            const execDuration =
              executeStartRef.current !== null ? Date.now() - executeStartRef.current : undefined
            executeStartRef.current = null
            executeAttemptsRef.current = 0
            log('widget error-callback', {
              widgetId: widgetIdRef.current,
              executeAttempt: executeAttemptsRef.current,
              sinceReadyMs:
                readyAtRef.current !== null ? Date.now() - readyAtRef.current : undefined,
              executeDurationMs: execDuration,
            })
            onErrorRef.current?.('widget-error-callback')
          },
          'expired-callback': () => {
            widgetExecutedRef.current = false
            isExecutingRef.current = false
            log('widget expired-callback', {
              widgetId: widgetIdRef.current,
              executeAttempt: executeAttemptsRef.current,
              sinceReadyMs:
                readyAtRef.current !== null ? Date.now() - readyAtRef.current : undefined,
            })
            onExpireRef.current?.()
            executeOnce()
          },
          action,
          theme,
          size: executeOnReady ? 'invisible' : size,
        })
        log('widget rendered', {
          widgetId: widgetIdRef.current,
          renderDurationMs:
            renderStartRef.current !== null ? Date.now() - renderStartRef.current : undefined,
        })
        readyAtRef.current = Date.now()
        log('widget ready', {
          widgetId: widgetIdRef.current,
          renderDurationMs:
            renderStartRef.current !== null
              ? readyAtRef.current - renderStartRef.current
              : undefined,
        })
        onReadyRef.current?.()
        executeOnce()
      } catch (error) {
        log('render error', {
          error:
            typeof error === 'object' && error && 'message' in error
              ? String((error as { message?: string }).message ?? '')
              : 'unknown',
        })
        isExecutingRef.current = false
        onErrorRef.current?.('render-error')
      }
    }

    loadTurnstile()

    // Cleanup
    return () => {
      if (executeTimerRef.current) {
        window.clearTimeout(executeTimerRef.current)
        executeTimerRef.current = null
      }
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (error) {
          log('remove widget failed', {
            error:
              typeof error === 'object' && error && 'message' in error
                ? String((error as { message?: string }).message ?? '')
                : 'unknown',
          })
        }
        widgetIdRef.current = null
        widgetExecutedRef.current = false
        isExecutingRef.current = false
      }
    }
  }, [siteKey, theme, size, action, executeOnReady, log, executeOnce])

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
