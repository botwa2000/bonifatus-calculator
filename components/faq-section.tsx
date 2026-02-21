'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const FAQ_COUNT = 20

export function FaqSection() {
  const t = useTranslations('home')
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`faq${i + 1}Q`),
    a: t(`faq${i + 1}A`),
  }))

  const filtered = search.trim()
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs

  return (
    <div>
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('faqSearchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">
          {t('faqNoResults')}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq, i) => {
            const realIndex = faqs.indexOf(faq)
            const isOpen = openIndex === realIndex
            return (
              <div
                key={realIndex}
                className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-800/50"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : realIndex)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="font-semibold text-neutral-900 dark:text-white pr-4">
                    {faq.q}
                  </span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-4">
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
