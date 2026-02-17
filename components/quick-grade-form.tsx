'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveLocalized } from '@/lib/i18n'

type GradingSystem = {
  id: string
  name: string | Record<string, string> | null
  scaleType: string
  gradeDefinitions: Array<{ grade?: string }> | null
}

type Subject = {
  id: string
  name: string | Record<string, string>
}

type QuickGrade = {
  id: string
  subjectId: string
  gradeValue: string
  bonusPoints: number | null
  note: string | null
  createdAt: string | null
  subjectName: string | Record<string, string> | null
}

// resolveLocalized imported from @/lib/i18n

export function QuickGradeForm() {
  const locale = useLocale()
  const t = useTranslations('quickGrade')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [systems, setSystems] = useState<GradingSystem[]>([])
  const [recentGrades, setRecentGrades] = useState<QuickGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [subjectId, setSubjectId] = useState('')
  const [gradeValue, setGradeValue] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [defaultSystemId, setDefaultSystemId] = useState<string | undefined>()
  const [defaultClassLevel, setDefaultClassLevel] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        const [configRes, gradesRes] = await Promise.all([
          fetch('/api/config/calculator'),
          fetch('/api/grades/quick/list'),
        ])
        const configData = await configRes.json()
        const gradesData = await gradesRes.json()

        if (configData.success) {
          setSubjects(configData.subjects || [])
          setSystems(configData.gradingSystems || [])
          const storedDefault =
            typeof window !== 'undefined'
              ? localStorage.getItem(`calculator-default-system-${configData.userEmail || 'guest'}`)
              : null
          setDefaultSystemId(storedDefault || configData.gradingSystems?.[0]?.id)
        }
        if (gradesData.success) {
          setRecentGrades(gradesData.grades?.slice(0, 10) || [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedSystem = systems.find((s) => s.id === defaultSystemId) || systems[0]

  const handleSave = async () => {
    if (!subjectId || !gradeValue || !selectedSystem) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/grades/quick/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          gradingSystemId: selectedSystem.id,
          classLevel: defaultClassLevel,
          gradeValue,
          note: note || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save')
        return
      }
      setMessage(`+${Number(data.quickGrade.bonusPoints).toFixed(2)} pts`)
      setGradeValue('')
      setNote('')
      // Refresh list
      const listRes = await fetch('/api/grades/quick/list')
      const listData = await listRes.json()
      if (listData.success) {
        setRecentGrades(listData.grades?.slice(0, 10) || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/grades/quick/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRecentGrades((prev) => prev.filter((g) => g.id !== id))
      }
    } catch {
      // ignore
    }
  }

  if (loading) return null

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3">
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{t('title')}</h3>
      <div className="flex flex-wrap gap-2 items-end">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white flex-1 min-w-[140px]"
        >
          <option value="">{t('subject')}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {resolveLocalized(s.name, locale)}
            </option>
          ))}
        </select>
        {selectedSystem?.gradeDefinitions?.length ? (
          <select
            value={gradeValue}
            onChange={(e) => setGradeValue(e.target.value)}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white w-24"
          >
            <option value="">{t('grade')}</option>
            {selectedSystem.gradeDefinitions.map((g) => (
              <option key={g.grade ?? ''} value={g.grade ?? ''}>
                {g.grade ?? ''}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={gradeValue}
            onChange={(e) => setGradeValue(e.target.value)}
            placeholder={t('grade')}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white w-24"
          />
        )}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('noteOptional')}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white flex-1 min-w-[100px]"
        />
        <input
          type="number"
          min={1}
          max={12}
          value={defaultClassLevel}
          onChange={(e) => setDefaultClassLevel(Number(e.target.value) || 1)}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white w-16"
          title={t('classLevel')}
        />
        <button
          onClick={handleSave}
          disabled={saving || !subjectId || !gradeValue}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-button disabled:opacity-60"
        >
          {saving ? t('saving') : t('log')}
        </button>
      </div>
      {error && <p className="text-xs text-error-600">{error}</p>}
      {message && <p className="text-xs text-success-600 font-semibold">{message}</p>}
      {recentGrades.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('recentQuickGrades')}</p>
          {recentGrades.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{resolveLocalized(g.subjectName, locale)}</span>
                <span>{g.gradeValue}</span>
                {g.note && <span className="text-neutral-500">({g.note})</span>}
                <span className="text-primary-600 dark:text-primary-300 font-semibold">
                  +{Number(g.bonusPoints ?? 0).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(g.id)}
                className="text-neutral-400 hover:text-error-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
