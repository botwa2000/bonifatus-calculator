/**
 * Alert Component
 * Reusable alert/notification banner for error, success, warning, info states
 */

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

export type AlertVariant = 'error' | 'success' | 'warning' | 'info'

export interface AlertProps {
  children: React.ReactNode
  variant?: AlertVariant
  onDismiss?: () => void
  className?: string
}

const variantClasses: Record<AlertVariant, string> = {
  error:
    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  success:
    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  warning:
    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  onDismiss,
  className = '',
}) => {
  const tc = useTranslations('common')
  return (
    <div
      className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label={tc('dismiss')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

Alert.displayName = 'Alert'
