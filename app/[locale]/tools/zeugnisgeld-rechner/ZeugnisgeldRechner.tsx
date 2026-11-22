'use client'

import { useMemo, useState } from 'react'
import { zeugnisgeldCopy } from '@/content/tools/zeugnisgeld-rechner'
import {
  DEFAULT_RULE,
  DEFAULT_SUBJECTS,
  GRADES,
  calculateZeugnisgeld,
  describeRule,
  formatEuro,
  isGrade,
  type Grade,
  type SubjectRow,
  type ZeugnisgeldModel,
  type ZeugnisgeldRule,
} from '@/lib/tools/zeugnisgeld'

const c = zeugnisgeldCopy.form
const MODELS: ZeugnisgeldModel[] = ['perGrade', 'improvement', 'flat']

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'

function toAmount(value: string): number {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function AmountInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  disabled?: boolean
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-sm text-neutral-600 dark:text-neutral-300 mb-1">{label}</span>
      <span className="relative block">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(toAmount(e.target.value))}
          className={`${inputClass} pr-8 disabled:opacity-50`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          {c.currency}
        </span>
      </span>
    </label>
  )
}

function GradeSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: Grade | null
  onChange: (g: Grade | null) => void
}) {
  return (
    <select
      id={id}
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => {
        const n = Number(e.target.value)
        onChange(e.target.value && isGrade(n) ? n : null)
      }}
      className={inputClass}
    >
      <option value="">{c.noGrade}</option>
      {GRADES.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  )
}

export function ZeugnisgeldRechner() {
  const [rule, setRule] = useState<ZeugnisgeldRule>(DEFAULT_RULE)
  const [rows, setRows] = useState<SubjectRow[]>(() =>
    DEFAULT_SUBJECTS.map((name) => ({ name, grade: null, previous: null }))
  )
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => calculateZeugnisgeld(rule, rows), [rule, rows])
  const ruleText = describeRule(rule)
  const improvement = rule.model === 'improvement'

  const update = (patch: Partial<ZeugnisgeldRule>) => setRule((r) => ({ ...r, ...patch }))
  const updateRow = (i: number, patch: Partial<SubjectRow>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const copyRule = async () => {
    try {
      await navigator.clipboard.writeText(ruleText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Model */}
      <fieldset>
        <legend className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
          {c.modelLegend}
        </legend>
        <div className="grid sm:grid-cols-3 gap-3">
          {MODELS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                rule.model === m
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name="zeugnisgeld-model"
                value={m}
                checked={rule.model === m}
                onChange={() => update({ model: m })}
                className="sr-only"
              />
              <span className="block font-semibold text-neutral-900 dark:text-white">
                {c.models[m].label}
              </span>
              <span className="block text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                {c.models[m].hint}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Amounts */}
      {rule.model === 'perGrade' && (
        <fieldset>
          <legend className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
            {c.perGradeLegend}
          </legend>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {GRADES.map((g, i) => (
              <AmountInput
                key={g}
                id={`zg-grade-${g}`}
                label={c.gradeLabel(g)}
                value={rule.perGrade[i]}
                onChange={(n) => {
                  const perGrade = [...rule.perGrade] as ZeugnisgeldRule['perGrade']
                  perGrade[i] = n
                  update({ perGrade })
                }}
              />
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {rule.model === 'improvement' && (
          <AmountInput
            id="zg-step"
            label={c.perStepLabel}
            value={rule.perStep}
            onChange={(n) => update({ perStep: n })}
          />
        )}
        {rule.model === 'flat' && (
          <AmountInput
            id="zg-flat"
            label={c.flatLabel}
            value={rule.flat}
            onChange={(n) => update({ flat: n })}
          />
        )}
        <div>
          <AmountInput
            id="zg-cap"
            label={c.capLabel}
            value={rule.cap ?? 0}
            disabled={rule.cap === null}
            onChange={(n) => update({ cap: n })}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={rule.cap === null}
              onChange={(e) => update({ cap: e.target.checked ? null : DEFAULT_RULE.cap })}
              className="accent-primary-600"
            />
            {c.capNone}
          </label>
        </div>
      </div>

      {/* Subjects */}
      <fieldset>
        <legend className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
          {c.subjectsLegend}
        </legend>
        <div
          className={`grid ${improvement ? 'grid-cols-[1fr_5rem_5rem_2rem]' : 'grid-cols-[1fr_5rem_2rem]'} gap-2 items-center text-xs text-neutral-500 dark:text-neutral-400 mb-2`}
        >
          <span>{c.subjectHeader}</span>
          {improvement && <span>{c.previousHeader}</span>}
          <span>{c.gradeHeader}</span>
          <span />
        </div>
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li
              key={i}
              className={`grid ${improvement ? 'grid-cols-[1fr_5rem_5rem_2rem]' : 'grid-cols-[1fr_5rem_2rem]'} gap-2 items-center`}
            >
              <input
                type="text"
                aria-label={c.subjectHeader}
                placeholder={c.subjectPlaceholder}
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                className={inputClass}
              />
              {improvement && (
                <GradeSelect
                  id={`zg-prev-${i}`}
                  label={`${c.previousHeader}: ${row.name}`}
                  value={row.previous}
                  onChange={(previous) => updateRow(i, { previous })}
                />
              )}
              <GradeSelect
                id={`zg-grade-row-${i}`}
                label={`${c.gradeHeader}: ${row.name}`}
                value={row.grade}
                onChange={(grade) => updateRow(i, { grade })}
              />
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                aria-label={c.removeSubject(row.name)}
                className="h-9 w-8 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { name: '', grade: null, previous: null }])}
          className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          {c.addSubject}
        </button>
      </fieldset>

      {/* Result */}
      <div
        className="rounded-2xl bg-primary-50 dark:bg-primary-900/20 p-6 text-center"
        aria-live="polite"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{c.resultLabel}</p>
        {result.counted > 0 ? (
          <>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {formatEuro(result.total)}
            </p>
            {result.capped && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
                {c.cappedNote(formatEuro(result.subtotal))}
              </p>
            )}
            {result.subjects.length > 0 && (
              <ul className="mt-4 text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                {result.subjects.map((s, i) => (
                  <li key={i} className="flex justify-between gap-4 max-w-xs mx-auto">
                    <span>
                      {s.name || c.subjectPlaceholder}
                      {improvement && ` (${c.breakdownSteps(s.steps)})`}
                    </span>
                    <span className="font-medium">{formatEuro(s.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-300">
            {improvement ? c.resultEmptyImprovement : c.resultEmpty}
          </p>
        )}
      </div>

      {/* Rule as a sentence */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
          {c.ruleHeading}
        </p>
        <p className="text-neutral-700 dark:text-neutral-300">{ruleText}</p>
        <button
          type="button"
          onClick={copyRule}
          className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          {copied ? c.copied : c.copyRule}
        </button>
      </div>
    </div>
  )
}
