import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { auth } from '@/auth'
import { AppHeader } from '@/components/layout/AppHeader'
import { Footer } from '@/components/layout/Footer'
import { RatgeberTeaser } from '@/components/ratgeber/RatgeberTeaser'
import { SignupCta } from '@/components/ratgeber/SignupCta'
import { RichText, plainText } from '@/components/ratgeber/RichText'
import { JsonLd, faqPageJsonLd, webApplicationJsonLd } from '@/components/seo/JsonLd'
import { buildAlternates } from '@/lib/seo/alternates'
import {
  ZEUGNISGELD_LOCALE,
  ZEUGNISGELD_PATH,
  zeugnisgeldCopy as copy,
} from '@/content/tools/zeugnisgeld-rechner'
import { ZeugnisgeldRechner } from './ZeugnisgeldRechner'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  if (locale !== ZEUGNISGELD_LOCALE) return {}
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: buildAlternates(locale, ZEUGNISGELD_PATH),
  }
}

export default async function ZeugnisgeldRechnerPage({ params }: { params: Params }) {
  const { locale } = await params
  // German only: the rules, grades and amounts are written for German schools.
  if (locale !== ZEUGNISGELD_LOCALE) notFound()
  setRequestLocale(locale)
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <JsonLd
        data={webApplicationJsonLd({
          locale,
          path: ZEUGNISGELD_PATH,
          name: copy.metaTitle,
          description: copy.metaDescription,
        })}
      />
      <JsonLd
        data={faqPageJsonLd(
          copy.faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) }))
        )}
      />
      <AppHeader variant="public" isAuthed={Boolean(session?.user)} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-10">
          <Link
            href="/tools"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6 inline-block"
          >
            ← {copy.backLink}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
            {copy.h1}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">{copy.subtitle}</p>
        </div>

        <div className="bg-white dark:bg-neutral-800/50 rounded-2xl p-6 sm:p-8 shadow-card">
          <ZeugnisgeldRechner />
        </div>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          <RichText text={copy.otherSystems} />
        </p>

        {/* Next step: keep the rule */}
        <SignupCta {...copy.cta} as="h2" className="mt-12" />

        {copy.sections.map((section) => (
          <section key={section.id} id={section.id} className="mt-14">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              {section.heading}
            </h2>
            <div className="space-y-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          </section>
        ))}

        <section id="faq" className="mt-14">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
            {copy.faqTitle}
          </h2>
          <div className="space-y-6">
            {copy.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <RichText text={faq.answer} />
                </p>
              </div>
            ))}
          </div>
        </section>

        <RatgeberTeaser
          slugs={[
            'zeugnisgeld',
            'zeugnisgeld-hoehe-nach-klasse',
            'halbjahreszeugnis-bedeutung',
            'belohnen-ohne-geld',
          ]}
          className="mt-16"
        />
      </main>
      <Footer />
    </div>
  )
}
