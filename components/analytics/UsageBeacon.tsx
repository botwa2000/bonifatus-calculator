'use client'

/**
 * First-party usage beacon → POST /api/t (stored in our own database, never
 * sent to a third party). Runs alongside Google Analytics, which loads only
 * after analytics consent (components/analytics/Analytics.tsx).
 *
 * Without analytics consent nothing is stored on the device and no identifier
 * is sent — the server counts the visit with a daily-rotating anonymous hash.
 * With consent (cookie banner) a random ID in localStorage lets returning
 * visits be counted. Exposes window.bonifatusTrack(event, props) for buttons.
 */
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const CONSENT_KEY = 'bonifatus-cookie-consent'
const ID_KEY = 'bonifatus-usage-id'

type QueuedEvent = { e: string; s: string; p?: Record<string, unknown>; t: number }
type Acquisition = Record<string, string | undefined>

declare global {
  interface Window {
    bonifatusTrack?: (event: string, props?: Record<string, unknown>) => void
  }
}

function consented(): boolean {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')?.analytics === true
  } catch {
    return false
  }
}

function installId(): string | null {
  if (!consented()) return null
  try {
    let id = localStorage.getItem(ID_KEY)
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      id = crypto.randomUUID()
      localStorage.setItem(ID_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

// Route template: ids in paths (/parent/children/<uuid>) never leave the browser.
function screenOf(path: string): string {
  return path
    .split('/')
    .map((seg) => (/^[0-9a-f-]{16,}$/i.test(seg) || /^\d+$/.test(seg) ? ':id' : seg))
    .join('/')
}

export function UsageBeacon() {
  const pathname = usePathname()
  const queue = useRef<QueuedEvent[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const acq = useRef<Acquisition | null>(null)
  const started = useRef(false)

  useEffect(() => {
    const flush = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      if (!queue.current.length) return
      const payload: Record<string, unknown> = {
        iid: installId(),
        lang: (document.documentElement.lang || '').slice(0, 2),
        events: queue.current.splice(0, 50),
      }
      if (acq.current) {
        payload.acq = acq.current
        acq.current = null
      }
      const body = JSON.stringify(payload)
      try {
        if (navigator.sendBeacon?.('/api/t', new Blob([body], { type: 'text/plain' }))) return
      } catch {
        /* fall through */
      }
      fetch('/api/t', {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'text/plain' },
      }).catch(() => {})
    }

    const track = (event: string, props?: Record<string, unknown>) => {
      queue.current.push({ e: event, s: screenOf(location.pathname), p: props, t: Date.now() })
      if (queue.current.length >= 20) flush()
      else if (!timer.current) timer.current = setTimeout(flush, 2000)
    }
    window.bonifatusTrack = track

    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [])

  useEffect(() => {
    const track = window.bonifatusTrack
    if (!track) return
    if (!started.current) {
      started.current = true
      // A visit starts when the previous page was not ours (no storage needed).
      const ref = document.referrer || ''
      let internal = false
      try {
        internal =
          !!ref &&
          new URL(ref).hostname
            .replace(/^www\./, '')
            .endsWith(location.hostname.replace(/^www\./, ''))
      } catch {
        /* malformed referrer */
      }
      if (!internal) {
        const params = new URLSearchParams(location.search)
        const a: Acquisition = {
          utm_source: params.get('utm_source') || undefined,
          utm_medium: params.get('utm_medium') || undefined,
          utm_campaign: params.get('utm_campaign') || undefined,
          referrer: ref || undefined,
        }
        acq.current = a.utm_source || a.referrer ? a : null
        track('app_open')
      }
    }
    track('page_view')
    if (/\/invite$/.test(pathname)) track('invite_open')
  }, [pathname])

  return null
}
