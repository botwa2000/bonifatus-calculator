'use client'

export function HeroCta() {
  const handleOpenDemo = () => {
    // Let the demo section know to open
    window.dispatchEvent(new CustomEvent('open-demo'))
    // Update hash for native scroll fallback
    window.location.hash = 'demo-calculator'
    const el = document.getElementById('demo-calculator')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <a
        href="/register"
        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal"
      >
        Get Started Free
      </a>
      <button
        type="button"
        onClick={handleOpenDemo}
        className="px-8 py-4 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-semibold hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-normal text-center"
      >
        View Demo
      </button>
    </div>
  )
}
