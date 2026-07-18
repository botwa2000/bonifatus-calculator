import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { AppStoreBadges } from '@/components/app-store-badges'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('home')
  const tNav = useTranslations('nav')
  const tTools = useTranslations('tools')
  const tBlog = useTranslations('blog')
  const tCommon = useTranslations('common')

  return (
    <footer className="border-t bg-white dark:bg-neutral-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/logo-icon.svg"
                alt="Bonifatus"
                width={36}
                height={36}
                className="rounded-full"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Bonifatus
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('footerDescription')}</p>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('footerGetApp')}
            </p>
            <AppStoreBadges />
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
              {tTools('indexTitle')}
            </h3>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>
                <Link
                  href="/tools"
                  className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                >
                  {tTools('indexTitle')}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                >
                  {tBlog('indexTitle')}
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
  )
}
