import { Link } from '@/i18n/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { ContactForm } from '@/components/contact-form'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('contact')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors duration-normal"
          >
            {tc('backToHome')}
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  )
}
