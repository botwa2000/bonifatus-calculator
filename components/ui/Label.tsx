/**
 * Label Component
 * Reusable form label with optional tooltip
 */

'use client'

import React from 'react'
import { Tooltip } from './Tooltip'

export interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  tooltip?: string
  className?: string
}

export const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  required = false,
  tooltip,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
      >
        {children}
        {required && <span className="text-error-500 ml-0.5">*</span>}
      </label>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
  )
}

Label.displayName = 'Label'
