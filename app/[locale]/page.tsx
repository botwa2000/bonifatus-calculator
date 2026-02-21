import { setRequestLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { DemoSection } from '@/components/demo-section'
import { HeroCta } from '@/components/hero-cta'
import { DemoLinkButton } from '@/components/demo-link-button'
import { CompoundGrowthWidget } from '@/components/widgets/CompoundGrowthWidget'
import { Link } from '@/i18n/navigation'
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
          {[
            {
              title: t('feature1Title'),
              desc: t('feature1Desc'),
              cardClass: 'from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20',
              iconClass: 'bg-info-600',
              icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
            },
            {
              title: t('feature2Title'),
              desc: t('feature2Desc'),
              cardClass:
                'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20',
              iconClass: 'bg-primary-600',
              icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
            },
            {
              title: t('feature3Title'),
              desc: t('feature3Desc'),
              cardClass:
                'from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20',
              iconClass: 'bg-success-600',
              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            },
            {
              title: t('feature4Title'),
              desc: t('feature4Desc'),
              cardClass:
                'from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20',
              iconClass: 'bg-warning-600',
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            },
            {
              title: t('feature5Title'),
              desc: t('feature5Desc'),
              cardClass:
                'from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20',
              iconClass: 'bg-accent-600',
              icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
            },
            {
              title: t('feature6Title'),
              desc: t('feature6Desc'),
              cardClass:
                'from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20',
              iconClass: 'bg-secondary-600',
              icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`p-6 rounded-xl bg-gradient-to-br ${f.cardClass} hover:shadow-lg transition-shadow duration-normal`}
            >
              <div
                className={`w-12 h-12 ${f.iconClass} rounded-lg flex items-center justify-center mb-4`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                {f.title}
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA after features */}
        <div className="text-center mt-12">
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal"
          >
            {t('getStarted')}
          </Link>
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

      {/* Reward Settlement Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white dark:bg-neutral-800/50 rounded-3xl my-12 shadow-card">
        <div className="text-center mb-16">
          <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('rewardsShowcaseTitle')}
          </h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t('rewardsShowcaseSubtitle')}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: t('reward1Title'),
              desc: t('reward1Desc'),
              cardClass:
                'from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20',
              iconClass: 'bg-success-600',
              icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
            },
            {
              title: t('reward2Title'),
              desc: t('reward2Desc'),
              cardClass: 'from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20',
              iconClass: 'bg-info-600',
              icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
            },
            {
              title: t('reward3Title'),
              desc: t('reward3Desc'),
              cardClass:
                'from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20',
              iconClass: 'bg-warning-600',
              icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
            },
            {
              title: t('reward4Title'),
              desc: t('reward4Desc'),
              cardClass:
                'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20',
              iconClass: 'bg-primary-600',
              icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
            },
            {
              title: t('reward5Title'),
              desc: t('reward5Desc'),
              cardClass:
                'from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20',
              iconClass: 'bg-secondary-600',
              icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
            },
          ].map((r) => (
            <div
              key={r.title}
              className={`p-6 rounded-xl bg-gradient-to-br ${r.cardClass} text-center hover:shadow-lg transition-shadow duration-normal`}
            >
              <div
                className={`w-14 h-14 ${r.iconClass} rounded-xl flex items-center justify-center mx-auto mb-4`}
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon} />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                {r.title}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal"
          >
            {t('getStarted')}
          </Link>
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
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              {t('startFreeAccount')}
            </Link>
            <DemoLinkButton className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-200">
              {t('viewDemo')}
            </DemoLinkButton>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-8">
          <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('faqTitle')}
          </h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">{t('faqTeaser')}</p>
        </div>
        <div className="space-y-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-800/50 px-6 py-4"
            >
              <p className="font-semibold text-neutral-900 dark:text-white">
                {t(`faq${i}Q` as Parameters<typeof t>[0])}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/faq"
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal"
          >
            {t('faqViewAll')} &rarr;
          </Link>
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
                  <Link
                    href="/faq"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerFaq')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                {t('footerCompany')}
              </h3>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerAbout')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerPrivacy')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerTerms')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerCookies')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t('footerContact')}
                  </Link>
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
