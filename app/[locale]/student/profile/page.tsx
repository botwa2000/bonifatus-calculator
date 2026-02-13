'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { useTranslations } from 'next-intl'

type ParentConnection = {
  id: string
  parent_id: string
  child_id: string
  invitation_status: string
  invited_at?: string
  responded_at?: string | null
  parent?: { id: string; full_name: string; role?: string }
}

export default function StudentProfilePage() {
  const t = useTranslations('studentProfile')
  const tc = useTranslations('common')
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connections, setConnections] = useState<ParentConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const loadConnections = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connections/list')
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || tc('error'))
      setConnections(data.asChild || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [])

  useEffect(() => {
    if (!scanning) {
      ;(readerRef.current as unknown as { reset?: () => void })?.reset?.()
      return
    }

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    setScanError(null)

    reader.decodeFromVideoDevice(undefined, videoRef.current as HTMLVideoElement, (result, err) => {
      if (result?.getText()) {
        setCode(result.getText().trim())
        setScanning(false)
      } else if (err && err.name !== 'NotFoundException') {
        setScanError(t('scanError'))
      }
    })

    return () => {
      ;(reader as unknown as { reset?: () => void })?.reset?.()
    }
  }, [scanning, t])

  const redeem = async () => {
    setRedeeming(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/connections/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || tc('error'))
      setMessage(t('linkedSuccess'))
      setCode('')
      loadConnections()
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('error'))
    } finally {
      setRedeeming(false)
    }
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '\u2014'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '\u2014'
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const remove = async (relationshipId: string) => {
    setRemovingId(relationshipId)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/connections/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || tc('error'))
      setConnections((prev) => prev.filter((c) => c.id !== relationshipId))
      setMessage(t('connectionRemoved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('error'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">{t('header')}</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t('title')}</h1>
        <p className="text-neutral-600 dark:text-neutral-300">{t('description')}</p>
      </header>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 text-error-700 px-4 py-3">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-success-200 bg-success-50 text-success-700 px-4 py-3">
          {message}
        </div>
      )}

      <div
        id="connect-parent"
        className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-neutral-800 dark:text-white">
            {t('enterOrScan')}
          </label>
          <button
            type="button"
            onClick={() => setScanning((prev) => !prev)}
            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
          >
            {scanning ? t('stopScanning') : t('scanQr')}
          </button>
        </div>

        {scanning && (
          <div className="space-y-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs text-neutral-600 dark:text-neutral-300">
              {t('scanInstructions')}
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <video ref={videoRef} className="h-full w-full object-cover" />
            </div>
            {scanError && <p className="text-xs text-error-600 dark:text-error-400">{scanError}</p>}
          </div>
        )}

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          placeholder="123456"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-lg tracking-widest text-center"
        />
        <div className="flex gap-2">
          <button
            onClick={redeem}
            disabled={redeeming || code.trim().length !== 6}
            className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold py-2 shadow-button disabled:opacity-60"
          >
            {redeeming ? t('linking') : t('linkParent')}
          </button>
          <button
            type="button"
            onClick={loadConnections}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-800 dark:text-white"
          >
            {tc('refresh')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('linkedParents')}
          </h2>
          <button
            onClick={loadConnections}
            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
          >
            {tc('refresh')}
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-neutral-500">{tc('loading')}</p>
        ) : connections.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('noLinkedParents')}</p>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 dark:border-neutral-800 px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/70"
              >
                <div className="space-y-0.5">
                  <p className="text-sm text-neutral-500 uppercase tracking-wide">
                    {t('parentLabel')}
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {conn.parent?.full_name?.trim() ||
                      `Parent ${conn.parent_id?.slice(0, 6) ?? ''}\u2026`}
                  </p>
                  <div className="flex gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold text-primary-600 dark:text-primary-300">
                      {conn.invitation_status || 'accepted'}
                    </span>
                    <span>
                      {t('connected', { date: formatDate(conn.responded_at || conn.invited_at) })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{t('relationshipId', { id: conn.id })}</p>
                </div>
                <button
                  onClick={() => remove(conn.id)}
                  disabled={removingId === conn.id}
                  className="text-sm font-semibold text-error-600 hover:text-error-700 disabled:opacity-60"
                >
                  {removingId === conn.id ? t('removing') : tc('remove')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
