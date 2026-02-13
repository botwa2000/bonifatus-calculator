'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function HeroCta() {
  const t = useTranslations('home')

  const handleOpenDemo = () => {
    window.dispatchEvent(new CustomEvent('open-demo'))
    window.location.hash = 'demo-calculator'
    const el = document.getElementById('demo-calculator')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        href="/register"
        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal"
      >
        {t('getStarted')}
      </Link>
      <button
        type="button"
        onClick={handleOpenDemo}
        className="px-8 py-4 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-semibold hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-normal text-center"
      >
        {t('viewDemo')}
      </button>
    </div>
  )
}
