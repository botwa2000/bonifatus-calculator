/**
 * Select Component
 * Reusable dropdown select with label and tooltip support
 */

'use client'

import React, { forwardRef } from 'react'
import { Label } from './Label'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  tooltip?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      tooltip,
      error,
      helperText,
      options,
      placeholder,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const selectClasses = `
      w-full px-4 py-3 rounded-lg
      border-2 transition-all duration-200
      outline-none appearance-none
      bg-white dark:bg-neutral-800
      ${
        error
          ? 'border-error-500 focus:ring-4 focus:ring-error-100'
          : 'border-neutral-200 dark:border-neutral-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
      }
      ${props.disabled ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed opacity-60' : 'dark:text-white'}
      ${className}
    `

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <div className="mb-2">
            <Label htmlFor={selectId} required={props.required} tooltip={tooltip}>
              {label}
            </Label>
          </div>
        )}

        <div className="relative">
          <select ref={ref} id={selectId} className={selectClasses} {...props}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {helperText && !error && <p className="mt-2 text-sm text-neutral-500">{helperText}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
