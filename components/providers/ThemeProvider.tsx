'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'
type ThemeContextValue = { theme: Theme; setTheme: (t: Theme) => void }

const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

function applyClass(resolved: 'light' | 'dark') {
  const el = document.documentElement
  if (resolved === 'dark') {
    el.classList.add('dark')
  } else {
    el.classList.remove('dark')
  }
}

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme-preference') as Theme | null
    const t = stored && ['system', 'light', 'dark'].includes(stored) ? stored : 'system'
    setThemeState(t)
    applyClass(resolve(t))
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') applyClass(resolve('system'))
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme-preference', t)
    applyClass(resolve(t))
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
