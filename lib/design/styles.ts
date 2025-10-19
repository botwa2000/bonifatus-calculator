/**
 * Bonifatus Design System - Style Utilities
 * Reusable style classes and utility functions
 * Import these instead of hardcoding styles
 */

import { theme } from './theme'

/**
 * Common CSS classes as JavaScript objects (for inline styles or CSS-in-JS)
 * These can be spread into className or style props
 */
export const styles = {
  // Button Styles
  button: {
    base: {
      fontFamily: theme.typography.fontFamily.sans,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      lineHeight: theme.typography.lineHeight.normal,
      borderRadius: theme.borderRadius.lg,
      transition: `all ${theme.transitions.duration.normal} ${theme.transitions.timing.easeInOut}`,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      border: 'none',
      outline: 'none',
    },

    sizes: {
      sm: {
        padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
        fontSize: theme.typography.fontSize.sm,
      },
      md: {
        padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
        fontSize: theme.typography.fontSize.base,
      },
      lg: {
        padding: `${theme.spacing[4]} ${theme.spacing[8]}`,
        fontSize: theme.typography.fontSize.lg,
      },
    },

    variants: {
      primary: {
        background: theme.gradients.primary,
        color: theme.colors.text.inverse,
        boxShadow: theme.shadows.button,
      },
      secondary: {
        background: theme.colors.background.light,
        color: theme.colors.primary[600],
        border: `2px solid ${theme.colors.primary[500]}`,
        boxShadow: theme.shadows.button,
      },
      ghost: {
        background: 'transparent',
        color: theme.colors.primary[600],
        border: 'none',
      },
      danger: {
        background: theme.gradients.error,
        color: theme.colors.text.inverse,
        boxShadow: theme.shadows.button,
      },
    },
  },

  // Input Styles
  input: {
    base: {
      fontFamily: theme.typography.fontFamily.sans,
      fontSize: theme.typography.fontSize.base,
      lineHeight: theme.typography.lineHeight.normal,
      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
      borderRadius: theme.borderRadius.lg,
      border: `2px solid ${theme.colors.border.light}`,
      backgroundColor: theme.colors.background.light,
      color: theme.colors.text.primary,
      transition: `all ${theme.transitions.duration.normal} ${theme.transitions.timing.easeInOut}`,
      outline: 'none',
      width: '100%',
    },

    focus: {
      borderColor: theme.colors.primary[500],
      boxShadow: theme.shadows.inputFocus,
    },

    error: {
      borderColor: theme.colors.error[500],
      boxShadow: `0 0 0 3px ${theme.colors.error[100]}`,
    },

    disabled: {
      backgroundColor: theme.colors.neutral[100],
      color: theme.colors.text.disabled,
      cursor: 'not-allowed',
    },
  },

  // Card Styles
  card: {
    base: {
      backgroundColor: theme.colors.background.light,
      borderRadius: theme.borderRadius['2xl'],
      boxShadow: theme.shadows.card,
      padding: theme.spacing[6],
      border: `1px solid ${theme.colors.border.light}`,
    },

    hover: {
      boxShadow: theme.shadows.lg,
      transform: 'translateY(-2px)',
      transition: `all ${theme.transitions.duration.normal} ${theme.transitions.timing.easeOut}`,
    },
  },

  // Container Styles
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `0 ${theme.spacing[6]}`,
  },

  // Typography Styles
  text: {
    h1: {
      fontSize: theme.typography.fontSize['4xl'],
      fontWeight: theme.typography.fontWeight.bold,
      lineHeight: theme.typography.lineHeight.tight,
      color: theme.colors.text.primary,
    },

    h2: {
      fontSize: theme.typography.fontSize['3xl'],
      fontWeight: theme.typography.fontWeight.bold,
      lineHeight: theme.typography.lineHeight.tight,
      color: theme.colors.text.primary,
    },

    h3: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.semibold,
      lineHeight: theme.typography.lineHeight.snug,
      color: theme.colors.text.primary,
    },

    h4: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.semibold,
      lineHeight: theme.typography.lineHeight.snug,
      color: theme.colors.text.primary,
    },

    body: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.normal,
      lineHeight: theme.typography.lineHeight.relaxed,
      color: theme.colors.text.secondary,
    },

    small: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.normal,
      lineHeight: theme.typography.lineHeight.normal,
      color: theme.colors.text.tertiary,
    },

    caption: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.normal,
      lineHeight: theme.typography.lineHeight.normal,
      color: theme.colors.text.tertiary,
    },
  },

  // Layout Styles
  flex: {
    center: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    between: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    start: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },

    column: {
      display: 'flex',
      flexDirection: 'column' as const,
    },

    columnCenter: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
} as const

/**
 * Utility function to combine multiple style objects
 */
export function mergeStyles(...styleObjects: React.CSSProperties[]) {
  return Object.assign({}, ...styleObjects)
}

/**
 * Utility function to generate responsive styles
 */
export function responsive(
  mobile: React.CSSProperties,
  tablet?: React.CSSProperties,
  desktop?: React.CSSProperties
) {
  return {
    ...mobile,
    [`@media (min-width: ${theme.breakpoints.md})`]: tablet,
    [`@media (min-width: ${theme.breakpoints.lg})`]: desktop,
  }
}

/**
 * Utility function for focus-visible styles
 */
export function focusVisible(styles: React.CSSProperties) {
  return {
    '&:focus-visible': styles,
  }
}

/**
 * Utility function for hover styles
 */
export function hover(styles: React.CSSProperties) {
  return {
    '&:hover': styles,
  }
}

/**
 * Tailwind-like utility class generator
 * Returns Tailwind classes for use in className
 */
export const tw = {
  button: {
    primary:
      'bg-gradient-to-br from-primary-500 to-secondary-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105',
    secondary:
      'bg-white text-primary-600 font-semibold py-3 px-6 rounded-lg border-2 border-primary-500 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-primary-50',
    ghost:
      'bg-transparent text-primary-600 font-semibold py-3 px-6 rounded-lg hover:bg-primary-50 transition-all duration-200',
    danger:
      'bg-gradient-to-br from-error-500 to-error-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
  },

  input: {
    base: 'w-full px-4 py-3 rounded-lg border-2 border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none',
    error:
      'w-full px-4 py-3 rounded-lg border-2 border-error-500 focus:ring-4 focus:ring-error-100 transition-all duration-200 outline-none',
  },

  card: {
    base: 'bg-white rounded-2xl shadow-md p-6 border border-neutral-100',
    hover:
      'bg-white rounded-2xl shadow-md p-6 border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
  },

  text: {
    h1: 'text-4xl font-bold text-neutral-900 leading-tight',
    h2: 'text-3xl font-bold text-neutral-900 leading-tight',
    h3: 'text-2xl font-semibold text-neutral-900 leading-snug',
    h4: 'text-xl font-semibold text-neutral-900 leading-snug',
    body: 'text-base text-neutral-600 leading-relaxed',
    small: 'text-sm text-neutral-500 leading-normal',
    caption: 'text-xs text-neutral-500 leading-normal',
  },

  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start justify-start',
    column: 'flex flex-col',
    columnCenter: 'flex flex-col items-center justify-center',
  },
} as const
