/**
 * Password Input Component
 * Input with show/hide toggle and strength indicator
 * Uses centralized theme from lib/design
 */

'use client'

import React, { useState } from 'react'
import { Input, InputProps } from './Input'
import { calculatePasswordStrength, type PasswordStrength } from '@/lib/auth/password-validation'

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showStrengthIndicator?: boolean
  onStrengthChange?: (strength: PasswordStrength, score: number) => void
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showStrengthIndicator = true,
  onStrengthChange,
  value,
  onChange,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [strength, setStrength] = useState<{ strength: PasswordStrength; score: number } | null>(
    null
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value

    if (showStrengthIndicator && password) {
      const { strength: passwordStrength, score } = calculatePasswordStrength(password)
      setStrength({ strength: passwordStrength, score })
      onStrengthChange?.(passwordStrength, score)
    } else {
      setStrength(null)
    }

    onChange?.(e)
  }

  const strengthConfig = {
    weak: {
      label: 'Weak',
      color: 'bg-error-500',
      textColor: 'text-error-600',
      width: 'w-1/4',
    },
    fair: {
      label: 'Fair',
      color: 'bg-warning-500',
      textColor: 'text-warning-600',
      width: 'w-2/4',
    },
    good: {
      label: 'Good',
      color: 'bg-info-500',
      textColor: 'text-info-600',
      width: 'w-3/4',
    },
    strong: {
      label: 'Strong',
      color: 'bg-success-500',
      textColor: 'text-success-600',
      width: 'w-full',
    },
    'very-strong': {
      label: 'Very Strong',
      color: 'bg-success-600',
      textColor: 'text-success-700',
      width: 'w-full',
    },
  }

  const currentStrength = strength ? strengthConfig[strength.strength] : null

  return (
    <div className="w-full">
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={handleChange}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        }
      />

      {showStrengthIndicator && strength && value && (
        <div className="mt-3 space-y-2">
          {/* Strength bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${currentStrength?.color} transition-all duration-300 ${currentStrength?.width}`}
              />
            </div>
            <span className={`text-sm font-medium ${currentStrength?.textColor}`}>
              {currentStrength?.label}
            </span>
          </div>

          {/* Score percentage */}
          <div className="text-xs text-neutral-500">Password strength: {strength.score}%</div>
        </div>
      )}
    </div>
  )
}
