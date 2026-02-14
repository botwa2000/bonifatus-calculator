'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type Connection = {
  id: string
  parent_id: string
  child_id: string
  invitation_status: string
  invited_at: string
  responded_at?: string | null
  child?: { id: string; full_name: string; role?: string }
}

export type Invite = {
  id: string
  code: string
  status: string
  expires_at: string
  created_at?: string
  child_id?: string | null
}

export type ChildGradeSummary = {
  savedTerms: number
  totalBonus: number
  lastUpdated?: string
}

export type TermPreview = {
  id: string
  school_year: string
  term_type: string
  term_name?: string | null
  total_bonus_points: number
  created_at: string
  subject_count: number
  subject_grades: Array<{
    id: string
    grade_value: string | null
    grade_normalized_100: number | null
    subject_weight: number | null
    bonus_points: number | null
    subjects?: { name?: string | Record<string, string> | null } | null
  }>
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
    subject_grades?: Array<{
      id: string
      grade_value: string | null
      grade_normalized_100: number | null
      subject_weight: number | null
      bonus_points: number | null
      subjects?: { name?: string | Record<string, string> | null } | null
    }>
  }>
}

type GradesResponse = {
  success: boolean
  children?: GradesChild[]
  error?: string
}

export function useParentData() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [gradeSummaries, setGradeSummaries] = useState<Record<string, ChildGradeSummary>>({})
  const [gradePreviews, setGradePreviews] = useState<Record<string, TermPreview[]>>({})
  const [gradesLoaded, setGradesLoaded] = useState(false)
  const [allChildTerms, setAllChildTerms] = useState<
    Array<{ childId: string; childName: string; term: GradesChild['terms'][0] }>
  >([])

  const loadConnections = useCallback(async () => {
    setLoading(true)
    setGradesLoaded(false)
    setError(null)
    try {
      const [connRes, gradesRes] = await Promise.all([
        fetch('/api/connections/list'),
        fetch('/api/parent/children/grades'),
      ])
      const [connJson, gradesJson] = await Promise.all([
        connRes.json(),
        gradesRes.json() as Promise<GradesResponse>,
      ])

      if (!connRes.ok || !connJson.success) {
        throw new Error(connJson.error || 'Failed to load connections')
      }
      setConnections(connJson.asParent || [])
      setInvites(connJson.invites || [])

      if (gradesRes.ok && gradesJson.success) {
        const summaries: Record<string, ChildGradeSummary> = {}
        const previews: Record<string, TermPreview[]> = {}
        const flatTerms: Array<{
          childId: string
          childName: string
          term: GradesChild['terms'][0]
        }> = []

        ;(gradesJson.children || []).forEach((child: GradesChild) => {
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
          const childName = child.child?.full_name || 'Child'
          summaries[childKey] = { savedTerms: terms.length, totalBonus, lastUpdated }
          previews[childKey] = terms
            .slice()
            .sort(
              (a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            .slice(0, 3)
            .map((t) => ({
              id: t.id,
              school_year: t.school_year,
              term_type: t.term_type,
              term_name: t.term_name,
              total_bonus_points: Number(t.total_bonus_points ?? 0),
              created_at: t.created_at,
              subject_count: (t.subject_grades || []).length,
              subject_grades: (t.subject_grades || []) as TermPreview['subject_grades'],
            }))

          terms.forEach((term) => {
            flatTerms.push({ childId: childKey, childName, term })
          })
        })
        setGradeSummaries(summaries)
        setGradePreviews(previews)
        setAllChildTerms(flatTerms)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections')
    } finally {
      setLoading(false)
      setGradesLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  const handleCreateInvite = useCallback(async () => {
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/connections/invite', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create invite')
      }
      setInvites((prev) => [data.invite, ...prev])
      setMessage('New invite generated.')
      return data.invite as Invite
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite')
      return null
    }
  }, [])

  const handleRemove = useCallback(async (relationshipId: string) => {
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
    }
  }, [])

  const activeInvites = useMemo(
    () =>
      invites.filter(
        (i) => i.status === 'pending' && new Date(i.expires_at).getTime() > Date.now()
      ),
    [invites]
  )

  const hasConnections = connections.length > 0

  const recentActivity = useMemo(() => {
    return allChildTerms
      .slice()
      .sort((a, b) => new Date(b.term.created_at).getTime() - new Date(a.term.created_at).getTime())
      .slice(0, 5)
  }, [allChildTerms])

  const combinedBonus = useMemo(() => {
    return Object.values(gradeSummaries).reduce((acc, s) => acc + s.totalBonus, 0)
  }, [gradeSummaries])

  return {
    connections,
    invites,
    loading,
    error,
    message,
    setError,
    setMessage,
    gradeSummaries,
    gradePreviews,
    gradesLoaded,
    allChildTerms,
    loadConnections,
    handleCreateInvite,
    handleRemove,
    activeInvites,
    hasConnections,
    recentActivity,
    combinedBonus,
  }
}
