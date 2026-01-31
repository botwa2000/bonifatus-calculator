'use client'

import { useEffect, useState, useMemo } from 'react'

type SecurityEvent = {
  id: string
  eventType: string
  severity: string
  userId: string | null
  ipAddress: string
  userAgent: string | null
  eventMetadata: unknown
  createdAt: string
}

const PAGE_SIZE = 20

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetch('/api/admin/security?limit=200')
      .then((r) => r.json())
      .then((d) => setEvents(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const eventTypes = useMemo(() => [...new Set(events.map((e) => e.eventType))], [events])

  const filtered = useMemo(() => {
    let result = events
    if (typeFilter !== 'all') result = result.filter((e) => e.eventType === typeFilter)
    if (severityFilter !== 'all') result = result.filter((e) => e.severity === severityFilter)
    return result
  }, [events, typeFilter, severityFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-neutral-500 dark:text-neutral-400">Loading security events...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">Security Events</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        >
          <option value="all">All Types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        >
          <option value="all">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">Time</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">Type</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                Severity
              </th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                User ID
              </th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                IP Address
              </th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                User Agent
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {pageEvents.map((e) => (
              <tr key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-neutral-300">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                  {e.eventType.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={e.severity} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                  {e.userId ? e.userId.slice(0, 8) + '...' : '-'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                  {e.ipAddress}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {e.userAgent || '-'}
                </td>
              </tr>
            ))}
            {pageEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-600 dark:text-white"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-600 dark:text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[severity] ?? 'bg-neutral-100 text-neutral-700'}`}
    >
      {severity}
    </span>
  )
}
