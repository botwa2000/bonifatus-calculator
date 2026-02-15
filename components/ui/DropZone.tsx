/**
 * DropZone Component
 * Reusable drag-and-drop file upload area with camera capture support
 */

'use client'

import React, { useRef, useState, useCallback } from 'react'

export interface DropZoneProps {
  onFile: (file: File) => void
  accept?: string
  maxSize?: number
  icon?: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
  error?: string
  className?: string
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFile,
  accept = 'image/*',
  icon,
  title,
  subtitle,
  actions,
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
      // Reset so the same file can be selected again
      e.target.value = ''
    },
    [onFile]
  )

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
        dragOver
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
          : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
      } ${className}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="space-y-3">
        {icon && <div className="text-4xl">{icon}</div>}
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</p>
        {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
        {actions && (
          <div
            className="flex flex-col sm:flex-row gap-2 justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

DropZone.displayName = 'DropZone'
