'use client'

import { useEffect, useState } from 'react'
import { DemoCalculator } from './demo-calculator'

export function DemoSection() {
  const [open, setOpen] = useState(true)
  const sectionId = 'demo-calculator'

  // Listen for global "open-demo" events (triggered from hero buttons)
  useEffect(() => {
    const handler = () => {
      setOpen(true)
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    const hashHandler = () => {
      if (window.location.hash === `#${sectionId}`) {
        handler()
      }
    }

    window.addEventListener('open-demo', handler)
    window.addEventListener('hashchange', hashHandler)

    // Also open if URL hash matches on mount
    hashHandler()

    return () => {
      window.removeEventListener('open-demo', handler)
      window.removeEventListener('hashchange', hashHandler)
    }
  }, [])

  return (
    <section id={sectionId} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/40 dark:to-secondary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-200">
              🧮
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Try the Bonus Calculator
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Explore now; save results when you sign up.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
          >
            {open ? 'Hide demo' : 'Try the demo'}
          </button>
        </div>
        {open && <DemoCalculator />}
      </div>
    </section>
  )
}
