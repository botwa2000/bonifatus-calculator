'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { resolveLocalized } from '@/lib/i18n'

type SubjectItem = {
  id: string
  name: string | Record<string, string>
  categoryId?: string
  isCoreSubject?: boolean
}

type CategoryItem = {
  id: string
  name: string | Record<string, string>
}

export type SubjectComboboxProps = {
  subjects: SubjectItem[]
  categories: CategoryItem[]
  value?: string
  onChange: (subjectId: string, subjectLabel: string, isCoreSubject?: boolean) => void
  disabledSubjectIds?: Set<string>
  placeholder?: string
  disabled?: boolean
  locale?: string
  compact?: boolean
  className?: string
}

export function SubjectCombobox({
  subjects,
  categories,
  value,
  onChange,
  disabledSubjectIds,
  placeholder = 'Search subject...',
  disabled = false,
  locale = 'en',
  compact = false,
  className = '',
}: SubjectComboboxProps) {
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    const subj = subjects.find((s) => s.id === value)
    return subj ? resolveLocalized(subj.name, locale) : ''
  }, [value, subjects, locale])

  const grouped = useMemo(() => {
    const lowerFilter = filter.trim().toLowerCase()
    const result: Array<{
      categoryId: string
      categoryName: string
      items: Array<{ id: string; label: string; disabled: boolean }>
    }> = []

    for (const cat of categories) {
      const catName = resolveLocalized(cat.name, locale)
      const items = subjects
        .filter((s) => s.categoryId === cat.id)
        .map((s) => ({
          id: s.id,
          label: resolveLocalized(s.name, locale),
          disabled: disabledSubjectIds?.has(s.id) && s.id !== value ? true : false,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      const filtered = lowerFilter
        ? items.filter((item) => item.label.toLowerCase().includes(lowerFilter))
        : items

      if (filtered.length) {
        result.push({ categoryId: cat.id, categoryName: catName, items: filtered })
      }
    }
    return result
  }, [subjects, categories, filter, locale, disabledSubjectIds, value])

  const flatItems = useMemo(() => {
    const items: Array<{ id: string; label: string; disabled: boolean }> = []
    for (const group of grouped) {
      for (const item of group.items) {
        items.push(item)
      }
    }
    return items
  }, [grouped])

  const handleSelect = useCallback(
    (itemId: string, itemLabel: string) => {
      const subj = subjects.find((s) => s.id === itemId)
      onChange(itemId, itemLabel, subj?.isCoreSubject ?? false)
      setFilter('')
      setOpen(false)
      setHighlightIndex(-1)
    },
    [onChange, subjects]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setOpen(true)
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightIndex((prev) => {
            let next = prev + 1
            while (next < flatItems.length && flatItems[next].disabled) next++
            return next < flatItems.length ? next : prev
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightIndex((prev) => {
            let next = prev - 1
            while (next >= 0 && flatItems[next].disabled) next--
            return next >= 0 ? next : prev
          })
          break
        case 'Enter':
          e.preventDefault()
          if (highlightIndex >= 0 && highlightIndex < flatItems.length) {
            const item = flatItems[highlightIndex]
            if (!item.disabled) {
              handleSelect(item.id, item.label)
            }
          }
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          setHighlightIndex(-1)
          break
      }
    },
    [open, flatItems, highlightIndex, handleSelect]
  )

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-combobox-item]')
    const el = items[highlightIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHighlightIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const paddingClass = compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'
  const dropdownPadding = compact ? 'px-2 py-1.5' : 'px-3 py-2'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value)
          setHighlightIndex(-1)
          if (!open) setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={selectedLabel || placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 ${paddingClass} text-neutral-900 dark:text-white focus:border-primary-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
      />
      {open && (
        <div
          ref={listRef}
          className={`absolute z-50 w-full mt-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg max-h-72 overflow-y-auto ${dropdownPadding}`}
        >
          {grouped.length === 0 && (
            <div className="text-xs text-neutral-500 px-2 py-1">No matches</div>
          )}
          {grouped.map((group) => (
            <div key={group.categoryId} className="mb-2 last:mb-0">
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-2 py-1 sticky top-0 bg-white dark:bg-neutral-800">
                {group.categoryName}
              </div>
              {group.items.map((item) => {
                const flatIdx = flatItems.indexOf(item)
                const isHighlighted = flatIdx === highlightIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-combobox-item
                    onClick={() => {
                      if (!item.disabled) handleSelect(item.id, item.label)
                    }}
                    disabled={item.disabled}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      isHighlighted
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200'
                        : 'text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''} ${
                      item.id === value ? 'font-semibold' : ''
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
