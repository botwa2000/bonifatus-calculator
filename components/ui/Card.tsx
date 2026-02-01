/**
 * Card Component
 * Reusable card container with consistent styling
 * Uses centralized theme from lib/design
 */

import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const baseClasses = `
    bg-white dark:bg-neutral-900 rounded-2xl shadow-md border border-neutral-100 dark:border-neutral-800
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer' : ''}
    ${className}
  `

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-2xl font-semibold text-neutral-900 dark:text-white ${className}`}>
      {children}
    </h3>
  )
}

export interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-neutral-600 dark:text-neutral-300 leading-relaxed ${className}`}>
      {children}
    </p>
  )
}

export interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>
}

export interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={`mt-6 ${className}`}>{children}</div>
}
