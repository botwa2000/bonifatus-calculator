/**
 * FormField Component
 * Wrapper for form inputs with label and tooltip
 */

'use client'

import React from 'react'
import { Label } from './Label'

export interface FormFieldProps {
  label?: string
  tooltip?: string
  required?: boolean
  error?: string
  helperText?: string
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  tooltip,
  required = false,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label required={required} tooltip={tooltip}>
          {label}
        </Label>
      )}

      {children}

      {error && (
        <p className="text-sm text-error-600 flex items-center gap-1">
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

      {helperText && !error && <p className="text-sm text-neutral-500">{helperText}</p>}
    </div>
  )
}

FormField.displayName = 'FormField'
