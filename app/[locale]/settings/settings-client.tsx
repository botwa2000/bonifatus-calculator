'use client'

import { Link } from '@/i18n/navigation'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'

const BonusFactorEditor = dynamic(() => import('@/components/settings/BonusFactorEditor'), {
  ssr: false,
})
const BonusFactorReadonly = dynamic(() => import('@/components/settings/BonusFactorReadonly'), {
  ssr: false,
})

export default function SettingsClient({ role }: { role: 'parent' | 'child' }) {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('settings')
  const tc = useTranslations('common')

  return (
    <>
      <header className="space-y-2">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('accountLabel')}</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t('title')}</h1>
      </header>

      {/* Appearance */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('appearance')}
        </h2>
        <div className="flex flex-col gap-2">
          {(['system', 'light', 'dark'] as const).map((themeOption) => (
            <label
              key={themeOption}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
                theme === themeOption
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={themeOption}
                checked={theme === themeOption}
                onChange={() => setTheme(themeOption)}
                className="accent-primary-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                  {t(themeOption)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t(`${themeOption}Description`)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Bonus Calculation */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('bonusCalculation')}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('bonusCalculationDesc')}
          </p>
        </div>
        {role === 'parent' ? <BonusFactorEditor /> : <BonusFactorReadonly />}
      </section>

      {/* Subscription */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('subscription')}
        </h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('planName')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('planDescription')}</p>
          </div>
          <span className="rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 px-3 py-1 text-xs font-semibold">
            {tc('active')}
          </span>
        </div>
        <button
          disabled
          className="w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
        >
          {t('upgradePro')}
        </button>
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('accountLabel')}
        </h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/profile"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-neutral-600 transition"
          >
            {t('editProfile')}
          </Link>
          <Link
            href="/forgot-password"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-neutral-600 transition"
          >
            {t('changePassword')}
          </Link>
        </div>
      </section>
    </>
  )
}
