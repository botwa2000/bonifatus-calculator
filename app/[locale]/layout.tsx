import { hasLocale } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { IdleLogoutGuard } from '@/components/auth/IdleLogoutGuard'
import { CookieConsentBanner } from '@/components/cookies/CookieConsentBanner'
import { routing, type Locale } from '@/i18n/routing'
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar'
import { CapacitorInit } from '@/components/native/CapacitorInit'
import { Analytics } from '@/components/analytics/Analytics'
import {
  LanguageSuggestion,
  type LanguageSuggestionStrings,
} from '@/components/i18n/LanguageSuggestion'
import { SITE_URL, IS_INDEXABLE_DEPLOYMENT } from '@/lib/site'
import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata } from 'next'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// The language-suggestion bar is worded in the visitor's preferred language, not the
// page's, so it needs that one namespace from every locale.
async function loadLanguageSuggestionStrings() {
  const entries = await Promise.all(
    routing.locales.map(async (l) => {
      const messages = (await import(`../../messages/${l}.json`)).default
      return [l, messages.languageSuggestion as LanguageSuggestionStrings] as const
    })
  )
  return Object.fromEntries(entries) as Record<Locale, LanguageSuggestionStrings>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: '%s | Bonifatus',
      default: 'Bonifatus',
    },
    description: t('homeDescription'),
    icons: {
      icon: '/favicon.png',
      apple: '/images/logo-192.png',
    },
    // og:image comes from the opengraph-image.tsx file convention in this segment.
    openGraph: {
      type: 'website',
      siteName: 'Bonifatus',
      locale,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@bonifatus',
    },
    ...(IS_INDEXABLE_DEPLOYMENT ? {} : { robots: { index: false, follow: false } }),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = (await import(`../../messages/${locale}.json`)).default
  const languageSuggestionStrings = await loadLanguageSuggestionStrings()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bonifatus" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme-preference');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider>
              <IdleLogoutGuard />
              <LanguageSuggestion strings={languageSuggestionStrings} />
              {children}
              <CookieConsentBanner />
              <ServiceWorkerRegistrar />
              <CapacitorInit />
              <Analytics />
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
