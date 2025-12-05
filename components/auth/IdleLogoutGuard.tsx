'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

const WARNING_MS = 9 * 60 * 1000 // show warning after 9 minutes of inactivity
const LOGOUT_MS = 10 * 60 * 1000 // auto-logout after 10 minutes
const IDLE_FLAG_KEY = 'bonifatus-idle-logout'

export function IdleLogoutGuard() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [hasSession, setHasSession] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [countdownMs, setCountdownMs] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const lastActiveRef = useRef<number>(Date.now())
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }

  const resetCountdown = () => {
    setCountdownMs(LOGOUT_MS - (Date.now() - lastActiveRef.current))
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    countdownIntervalRef.current = setInterval(() => {
      setCountdownMs(Math.max(0, LOGOUT_MS - (Date.now() - lastActiveRef.current)))
    }, 500)
  }

  const handleLogout = async () => {
    try {
      sessionStorage.setItem(IDLE_FLAG_KEY, '1')
    } catch {
      // noop
    }
    clearTimers()
    setShowWarning(false)
    setCountdownMs(null)
    await supabase.auth.signOut()
    router.push('/login?timeout=1')
    router.refresh()
  }

  const resetTimers = () => {
    if (!hasSession) return
    lastActiveRef.current = Date.now()
    clearTimers()
    setShowWarning(false)
    setCountdownMs(null)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      resetCountdown()
    }, WARNING_MS)
    logoutTimerRef.current = setTimeout(() => {
      handleLogout()
    }, LOGOUT_MS)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(IDLE_FLAG_KEY)) {
      setNotice('You were signed out due to inactivity. Please sign in again.')
      sessionStorage.removeItem(IDLE_FLAG_KEY)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const active = Boolean(data.session)
      setHasSession(active)
      if (active) {
        resetTimers()
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const active = Boolean(session)
      setHasSession(active)
      if (active) {
        resetTimers()
      } else {
        clearTimers()
        setShowWarning(false)
        setCountdownMs(null)
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          sessionStorage.removeItem(IDLE_FLAG_KEY)
        } catch {
          // noop
        }
      }
    })
    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasSession) return
    const onActivity = () => {
      lastActiveRef.current = Date.now()
      resetTimers()
    }
    const events: Array<keyof DocumentEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
      'visibilitychange',
    ]
    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }))
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession])

  if (!hasSession) return null

  return (
    <>
      {notice && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg dark:border-amber-900/40 dark:bg-amber-950/70 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-amber-500" />
            <div className="space-y-1">
              <p className="font-semibold">Session expired</p>
              <p>{notice}</p>
            </div>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="mt-2 text-xs font-semibold text-amber-800 underline dark:text-amber-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Are you still there?
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
              We will sign you out soon
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              To protect your account, you&apos;ll be logged out after inactivity. Click stay signed
              in to continue working.{' '}
              {countdownMs !== null && (
                <span className="font-semibold text-primary-600 dark:text-primary-300">
                  {Math.ceil(countdownMs / 1000)}s remaining
                </span>
              )}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={handleLogout}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 dark:border-neutral-700 dark:text-white dark:hover:border-neutral-600 sm:w-auto"
              >
                Sign out now
              </button>
              <button
                onClick={() => resetTimers()}
                className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:shadow-lg hover:scale-105 sm:w-auto"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
