/**
 * Input Component
 * Reusable input field with label, error states, and icons
 * Uses centralized theme from lib/design
 */

'use client'

import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const inputClasses = `
      w-full px-4 py-3 rounded-lg
      border-2 transition-all duration-200
      outline-none
      ${
        error
          ? 'border-error-500 focus:ring-4 focus:ring-error-100'
          : 'border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
      }
      ${leftIcon ? 'pl-12' : ''}
      ${rightIcon ? 'pr-12' : ''}
      ${props.disabled ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-white'}
      ${className}
    `

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input ref={ref} id={inputId} className={inputClasses} {...props} />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input'
