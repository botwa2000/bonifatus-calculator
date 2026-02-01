/**
 * Button Component
 * Reusable button with variants, sizes, and states
 * Uses centralized theme from lib/design
 */

'use client'

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variantClasses = {
      primary: `
        bg-gradient-to-br from-primary-500 to-secondary-600
        text-white
        hover:from-primary-600 hover:to-secondary-700
        active:from-primary-700 active:to-secondary-800
        shadow-md hover:shadow-lg
      `,
      secondary: `
        bg-white dark:bg-neutral-800
        text-primary-600 dark:text-primary-300
        border-2 border-primary-500 dark:border-primary-600
        hover:bg-primary-50 dark:hover:bg-neutral-700
        active:bg-primary-100 dark:active:bg-neutral-600
        shadow-md hover:shadow-lg
      `,
      ghost: `
        bg-transparent
        text-primary-600
        hover:bg-primary-50
        active:bg-primary-100
      `,
      danger: `
        bg-gradient-to-br from-error-500 to-error-600
        text-white
        hover:from-error-600 hover:to-error-700
        active:from-error-700 active:to-error-800
        shadow-md hover:shadow-lg
      `,
    }

    // Size styles
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-lg
      transition-all duration-200
      outline-none
      focus-visible:ring-4 focus-visible:ring-primary-200
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md
      ${fullWidth ? 'w-full' : ''}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `

    return (
      <button ref={ref} disabled={disabled || isLoading} className={baseClasses} {...props}>
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span>{leftIcon}</span>}
            {children}
            {rightIcon && <span>{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
