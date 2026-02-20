'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveLocalized } from '@/lib/i18n'
import { SubjectCombobox } from '@/components/ui'

type GradingSystem = {
  id: string
  name: string | Record<string, string> | null
  scaleType: string
  gradeDefinitions: Array<{ grade?: string }> | null
}

type Subject = {
  id: string
  name: string | Record<string, string>
  categoryId?: string
}

type Category = {
  id: string
  name: string | Record<string, string>
}

type QuickGrade = {
  id: string
  subjectId: string
  gradeValue: string
  bonusPoints: number | null
  note: string | null
  settlementStatus: string
  createdAt: string | null
  subjectName: string | Record<string, string> | null
}

// resolveLocalized imported from @/lib/i18n

export function QuickGradeForm() {
  const locale = useLocale()
  const t = useTranslations('quickGrade')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [systems, setSystems] = useState<GradingSystem[]>([])
  const [recentGrades, setRecentGrades] = useState<QuickGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unsettled'>('all')

  const [subjectId, setSubjectId] = useState('')
  const [gradeValue, setGradeValue] = useState('')
  const [note, setNote] = useState('')
  const [testDate, setTestDate] = useState('')
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
          setCategories(configData.categories || [])
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
          gradedAt: testDate || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save')
        return
      }
      const bp = Number(data.quickGrade.bonusPoints)
      setMessage(`${bp >= 0 ? '+' : ''}${bp.toFixed(2)} pts`)
      setGradeValue('')
      setNote('')
      setTestDate('')
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

  const filteredGrades =
    filter === 'unsettled'
      ? recentGrades.filter((g) => g.settlementStatus === 'unsettled')
      : recentGrades

  const unsettledCount = recentGrades.filter((g) => g.settlementStatus === 'unsettled').length
  const unsettledPoints = recentGrades
    .filter((g) => g.settlementStatus === 'unsettled')
    .reduce((sum, g) => sum + Number(g.bonusPoints ?? 0), 0)

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          {t('noteTracker')}
        </h3>
        {unsettledCount > 0 && (
          <span className="text-xs rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5">
            {t('unsettledCount', { count: unsettledCount, points: unsettledPoints.toFixed(2) })}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <SubjectCombobox
          subjects={subjects}
          categories={categories}
          value={subjectId}
          onChange={(id) => setSubjectId(id)}
          placeholder={t('subject')}
          locale={locale}
          compact
          className="flex-1 min-w-[140px]"
        />
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
          type="date"
          value={testDate}
          onChange={(e) => setTestDate(e.target.value)}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white w-36"
          title={t('testDate')}
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
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('noteOptional')}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white flex-1 min-w-[200px]"
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('recentQuickGrades')}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                  filter === 'all'
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t('filterAll')}
              </button>
              <button
                onClick={() => setFilter('unsettled')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                  filter === 'unsettled'
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t('filterUnsettled')}
              </button>
            </div>
          </div>
          {filteredGrades.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    g.settlementStatus === 'settled' ? 'bg-success-500' : 'bg-amber-500'
                  }`}
                  title={g.settlementStatus === 'settled' ? t('settled') : t('unsettled')}
                />
                <span className="font-semibold">{resolveLocalized(g.subjectName, locale)}</span>
                <span>{g.gradeValue}</span>
                {g.note && <span className="text-neutral-500">({g.note})</span>}
                <span className="text-primary-600 dark:text-primary-300 font-semibold">
                  {Number(g.bonusPoints ?? 0) >= 0 ? '+' : ''}
                  {Number(g.bonusPoints ?? 0).toFixed(2)}
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
