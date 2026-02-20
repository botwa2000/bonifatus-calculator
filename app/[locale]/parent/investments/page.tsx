'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import SavingsSimulator from '@/components/investments/SavingsSimulator'
import StockSimulator from '@/components/investments/StockSimulator'

type Tab = 'savings' | 'etf'

export default function InvestmentsPage() {
  const t = useTranslations('parent')
  const [activeTab, setActiveTab] = useState<Tab>('savings')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {t('investmentsTitle')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">{t('investmentsDesc')}</p>
      </header>

      {/* Tab Switcher */}
      <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
        <button
          onClick={() => setActiveTab('savings')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'savings'
              ? 'bg-white dark:bg-neutral-900 text-primary-700 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {t('savingsTab')}
        </button>
        <button
          onClick={() => setActiveTab('etf')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'etf'
              ? 'bg-white dark:bg-neutral-900 text-primary-700 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {t('etfTab')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'savings' ? <SavingsSimulator /> : <StockSimulator />}
    </div>
  )
}
