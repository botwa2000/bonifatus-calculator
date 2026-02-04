/**
 * Tooltip Component
 * Small info icon with hover/click popup
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface TooltipProps {
  content: string
  children?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-800 dark:border-t-neutral-700 border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-800 dark:border-b-neutral-700 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-800 dark:border-l-neutral-700 border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-neutral-800 dark:border-r-neutral-700 border-y-transparent border-l-transparent',
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors text-xs font-medium"
        aria-label="More information"
      >
        {children || '?'}
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]}`}
        >
          <div className="px-3 py-2 text-xs text-white bg-neutral-800 dark:bg-neutral-700 rounded-lg shadow-lg max-w-xs whitespace-normal">
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            style={{ content: '""' }}
          />
        </div>
      )}
    </div>
  )
}

Tooltip.displayName = 'Tooltip'
