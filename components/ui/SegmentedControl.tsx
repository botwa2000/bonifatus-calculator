/**
 * SegmentedControl Component
 * Reusable tab/toggle control for switching between modes
 */

'use client'

import React from 'react'

export interface SegmentedControlOption {
  value: string
  label: React.ReactNode
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`flex gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 w-fit ${className}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            value === opt.value
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

SegmentedControl.displayName = 'SegmentedControl'
