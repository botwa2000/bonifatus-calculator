'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), { ssr: false })

type Connection = {
  id: string
  parent_id: string
  child_id: string
  invitation_status: string
  invited_at: string
  responded_at?: string | null
  child?: { id: string; full_name: string; role?: string }
}

type Invite = {
  id: string
  code: string
  status: string
  expires_at: string
  created_at?: string
  child_id?: string | null
}

type ChildGradeSummary = {
  savedTerms: number
  totalBonus: number
  lastUpdated?: string
}

type TermPreview = {
  id: string
  school_year: string
  term_type: string
  term_name?: string | null
  total_bonus_points: number
  created_at: string
  subject_count: number
}

type GradesChild = {
  relationshipId: string
  child?: { id: string; full_name?: string | null }
  terms: Array<{
    id: string
    school_year: string
    term_type: string
    term_name?: string | null
    total_bonus_points: number | null
    created_at: string
    subject_grades?: Array<unknown>
  }>
}

type GradesResponse = {
  success: boolean
  children?: GradesChild[]
  error?: string
}

export default function ParentChildrenPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [activeCode, setActiveCode] = useState<Invite | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [gradeSummaries, setGradeSummaries] = useState<Record<string, ChildGradeSummary>>({})
  const [gradePreviews, setGradePreviews] = useState<Record<string, TermPreview[]>>({})

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const activeInvites = useMemo(
    () => invites.filter((i) => i.status === 'pending' && new Date(i.expires_at).getTime() > nowMs),
    [invites, nowMs]
  )

  const loadConnections = async () => {
    setLoading(true)
    setError(null)
    try {
      const [connRes, gradesRes] = await Promise.all([
        fetch('/api/connections/list'),
        fetch('/api/parent/children/grades'),
      ])
      const [connJson, gradesJson] = await Promise.all([connRes.json(), gradesRes.json() as Promise<GradesResponse>])

      if (!connRes.ok || !connJson.success) {
        throw new Error(connJson.error || 'Failed to load connections')
      }
      setConnections(connJson.asParent || [])
      setInvites(connJson.invites || [])
      const newestPending = (connJson.invites || []).find(
        (i: Invite) => i.status === 'pending' && new Date(i.expires_at) > new Date()
      )
      setActiveCode(newestPending || null)

      if (gradesRes.ok && (gradesJson as GradesResponse).success) {
        const summaries: Record<string, ChildGradeSummary> = {}
        const previews: Record<string, TermPreview[]> = {}
        ;((gradesJson as GradesResponse).children || []).forEach((child: GradesChild) => {
          const terms = child.terms || []
          const totalBonus = terms.reduce(
            (acc: number, term) => acc + (Number(term.total_bonus_points) || 0),
            0
          )
          const lastUpdated = terms
            .map((t) => t.created_at)
            .filter(Boolean)
            .sort()
            .pop()
          const childKey = child.child?.id || child.relationshipId
          summaries[childKey] = {
            savedTerms: terms.length,
            totalBonus,
            lastUpdated,
          }
          previews[childKey] = terms
            .slice()
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 3)
            .map((t) => ({
              id: t.id,
              school_year: t.school_year,
              term_type: t.term_type,
              term_name: t.term_name,
              total_bonus_points: Number(t.total_bonus_points ?? 0),
              created_at: t.created_at,
              subject_count: (t.subject_grades || []).length,
            }))
        })
        setGradeSummaries(summaries)
        setGradePreviews(previews)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [])

  const handleCreateInvite = async () => {
    setCreating(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/connections/invite', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create invite')
      }
      setActiveCode(data.invite)
      setInvites((prev) => [data.invite, ...prev])
      setMessage('New invite generated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setCreating(false)
    }
  }

  const handleRemove = async (relationshipId: string) => {
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove connection')
      }
      setConnections((prev) => prev.filter((c) => c.id !== relationshipId))
      setMessage('Connection removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove connection')
    } finally {
      setRemovingId(null)
    }
  }

  const hasConnections = connections.length > 0

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Parent access</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">View children</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          See which children are linked to your account. If no one is connected yet, share a 6-digit
          code or QR for them to join.
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

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Connected children
              </h2>
              <button
                onClick={loadConnections}
                className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-neutral-500">Loading...</p>
            ) : !hasConnections ? (
              <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-6 space-y-3 text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  No children are linked yet. Generate a 6-digit invite code and share it to get
                  started.
                </p>
                <button
                  onClick={handleCreateInvite}
                  disabled={creating}
                  className="inline-flex justify-center rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-sm font-semibold text-white shadow-button disabled:opacity-60"
                >
                  {creating ? 'Generating...' : 'Generate invite'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="rounded-xl border border-neutral-100 dark:border-neutral-800 px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/70"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {connection.child?.full_name || 'Child'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                          <span className="font-semibold text-primary-600 dark:text-primary-300">
                            {connection.invitation_status || 'accepted'}
                          </span>
                          <span>Connected: {formatDate(connection.responded_at || connection.invited_at)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 px-2 py-1">
                            {gradeSummaries[connection.child_id]?.savedTerms ?? 0} saved results
                          </span>
                          <span className="rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-1">
                            Bonus {Number(gradeSummaries[connection.child_id]?.totalBonus ?? 0).toFixed(2)}
                          </span>
                          <span className="rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 px-2 py-1">
                            Updated {formatDate(gradeSummaries[connection.child_id]?.lastUpdated)}
                          </span>
                        </div>
                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              Saved results
                            </p>
                            <a
                              className="text-xs font-semibold text-primary-600 dark:text-primary-300 hover:underline"
                              href="https://www.bonifatus.com/parent/dashboard"
                            >
                              View all
                            </a>
                          </div>
                          {(gradePreviews[connection.child_id] || []).length === 0 ? (
                            <p className="text-xs text-neutral-500">No saved results yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {(gradePreviews[connection.child_id] || []).map((term) => (
                                <div
                                  key={term.id}
                                  className="flex items-center justify-between rounded-md border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-xs"
                                >
                                  <div>
                                    <p className="font-semibold text-neutral-900 dark:text-white">
                                      {term.school_year} · {term.term_type}
                                      {term.term_name ? ` · ${term.term_name}` : ''}
                                    </p>
                                    <p className="text-neutral-500">
                                      {term.subject_count} subjects · Bonus {term.total_bonus_points.toFixed(2)}
                                    </p>
                                  </div>
                                  <span className="text-neutral-500">{formatDate(term.created_at)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center">
                        <a
                          href="/parent/dashboard"
                          className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm font-semibold text-neutral-800 dark:text-white hover:border-primary-400 hover:text-primary-700 dark:hover:border-primary-400 dark:hover:text-primary-200"
                        >
                          Insights
                        </a>
                        <button
                          onClick={() => handleRemove(connection.id)}
                          disabled={removingId === connection.id}
                          className="rounded-lg border border-error-200 bg-error-50 px-3 py-1.5 text-sm font-semibold text-error-700 hover:bg-error-100 disabled:opacity-60 dark:border-error-800 dark:bg-error-950 dark:text-error-200"
                        >
                          {removingId === connection.id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Pending invites
              </h2>
              <span className="text-xs text-neutral-500">{activeInvites.length} active</span>
            </div>
            {activeInvites.length === 0 ? (
              <p className="text-sm text-neutral-500">No pending invites.</p>
            ) : (
              <div className="space-y-2">
                {activeInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        Code {invite.code}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Expires {new Date(invite.expires_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-500">{invite.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Invite a child
            </h2>
            <button
              onClick={handleCreateInvite}
              disabled={creating}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-button disabled:opacity-60"
            >
              {creating ? 'Creating...' : 'Generate code'}
            </button>
          </div>
          {activeCode ? (
            <div className="space-y-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                Share this 6-digit code with your child. It expires{' '}
                {new Date(activeCode.expires_at).toLocaleString()}.
              </div>
              <div className="text-4xl font-bold tracking-widest text-center text-primary-600 dark:text-primary-300">
                {activeCode.code}
              </div>
              <div className="flex items-center justify-center">
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-white">
                  <QRCode value={activeCode.code} size={160} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(activeCode.code)
                    setMessage('Code copied to clipboard.')
                  }}
                  className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-800 dark:text-white"
                >
                  Copy code
                </button>
                <button
                  onClick={handleCreateInvite}
                  disabled={creating}
                  className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-800 dark:text-white"
                >
                  New code
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Generate a code or QR to quickly link a child. They can enter the code on their
              profile page.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
