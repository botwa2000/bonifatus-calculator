'use client'

import { useEffect, useState } from 'react'

type ParentConnection = {
  id: string
  parent_id: string
  child_id: string
  invitation_status: string
  parent?: { id: string; full_name: string; role?: string }
}

export default function StudentProfilePage() {
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connections, setConnections] = useState<ParentConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadConnections = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connections/list')
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load')
      setConnections(data.asChild || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [])

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
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to link')
      setMessage('Linked! Your parent can now view your results.')
      setCode('')
      loadConnections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link')
    } finally {
      setRedeeming(false)
    }
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove')
      setConnections((prev) => prev.filter((c) => c.id !== relationshipId))
      setMessage('Connection removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Student profile</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Manage connections</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Enter a 6-digit code from your parent to link accounts. You can remove the connection at
          any time.
        </p>
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

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-3">
        <label className="block text-sm font-semibold text-neutral-800 dark:text-white">
          Enter code
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          placeholder="123456"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-lg tracking-widest text-center"
        />
        <button
          onClick={redeem}
          disabled={redeeming || code.trim().length !== 6}
          className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold py-2 shadow-button disabled:opacity-60"
        >
          {redeeming ? 'Linking...' : 'Link parent'}
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Linked parents</h2>
          <button
            onClick={loadConnections}
            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : connections.length === 0 ? (
          <p className="text-sm text-neutral-500">No linked parents yet.</p>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {conn.parent?.full_name || 'Parent'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Status: {conn.invitation_status || 'accepted'}
                  </p>
                </div>
                <button
                  onClick={() => remove(conn.id)}
                  disabled={removingId === conn.id}
                  className="text-sm text-error-600 hover:text-error-700 disabled:opacity-60"
                >
                  {removingId === conn.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
