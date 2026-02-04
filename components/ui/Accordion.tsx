/**
 * Accordion Component
 * Collapsible section with header and content
 */

'use client'

import React from 'react'

export interface AccordionProps {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  className?: string
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  open,
  onToggle,
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      >
        {title}
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

Accordion.displayName = 'Accordion'
