import { setRequestLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { DemoSection } from '@/components/demo-section'
import { HeroCta } from '@/components/hero-cta'
import { DemoLinkButton } from '@/components/demo-link-button'
import { CompoundGrowthWidget } from '@/components/widgets/CompoundGrowthWidget'
import { auth } from '@/auth'
import { AppHeader } from '@/components/layout/AppHeader'

export const dynamic = 'force-dynamic'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('home')
  const tNav = await getTranslations('nav')
  const tCommon = await getTranslations('common')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-info-100 dark:bg-info-900/30 rounded-full">
              <span className="text-info-700 dark:text-info-300 text-sm font-medium">
                {t('demoBadge')}
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white">
              {t('heroTitle')}
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {t('heroHighlight')}
              </span>
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t('heroDescription')}
            </p>
            <HeroCta />
          </div>
          <div className="hidden md:flex justify-center">
            <Image
              src="/images/logo-with-slogan.svg"
              alt="Bonifatus - Making Excellence Count"
              width={400}
              height={400}
              priority
            />
          </div>
        </div>
      </section>

      <DemoSection />

      {/* Features Section */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white dark:bg-neutral-800/50 rounded-3xl my-12 shadow-card"
      >
        <div className="text-center mb-16">
          <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('featuresTitle')}
          </h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t('featuresSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20 hover:shadow-lg transition-shadow duration-normal duration-normal">
            <div className="w-12 h-12 bg-info-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {t('feature1Title')}
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">{t('feature1Desc')}</p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 hover:shadow-lg transition-shadow duration-normal duration-normal">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {t('feature2Title')}
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">{t('feature2Desc')}</p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-success-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {t('feature3Title')}
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">{t('feature3Desc')}</p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-warning-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {t('feature4Title')}
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">{t('feature4Desc')}</p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-accent-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {t('feature5Title')}
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">{t('feature5Desc')}</p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-secondary-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {t('feature6Title')}
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">{t('feature6Desc')}</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
              {t('benefitsTitle')}
            </h3>
            <div className="space-y-6">
              {[
                { title: t('benefit1Title'), desc: t('benefit1Desc') },
                { title: t('benefit2Title'), desc: t('benefit2Desc') },
                { title: t('benefit3Title'), desc: t('benefit3Desc') },
                { title: t('benefit4Title'), desc: t('benefit4Desc') },
                { title: t('benefit5Title'), desc: t('benefit5Desc'), icon: 'savings' },
              ].map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    {b.icon === 'savings' ? (
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                      {b.title}
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-300">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center gap-4 py-4">
            <div className="relative z-10 -rotate-3 rounded-3xl shadow-2xl overflow-hidden border-4 border-white dark:border-neutral-700">
              <Image
                src="/images/app/calculator.png"
                alt="Bonifatus Calculator"
                width={220}
                height={440}
                className="object-cover"
              />
            </div>
            <div className="relative z-20 rotate-2 rounded-3xl shadow-2xl overflow-hidden border-4 border-white dark:border-neutral-700 -ml-6">
              <Image
                src="/images/app/progress.png"
                alt="Bonifatus Progress Tracking"
                width={220}
                height={440}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Compound Growth Widget */}
      <CompoundGrowthWidget />

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4">{t('ctaTitle')}</h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">{t('ctaDescription')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200">
              {t('startFreeAccount')}
            </button>
            <DemoLinkButton className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-200">
              {t('viewDemo')}
            </DemoLinkButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-neutral-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/logo-icon.svg"
                  alt="Bonifatus"
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Bonifatus
                </h2>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {t('footerDescription')}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">{t('footerWip')}</p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                {t('footerProduct')}
              </h3>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {tNav('features')}
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {tNav('benefits')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerPricing')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerFaq')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                {t('footerCompany')}
              </h3>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerAbout')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerPrivacy')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerTerms')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerContact')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-neutral-600 dark:text-neutral-400 text-sm">
            <p>{tCommon('copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
