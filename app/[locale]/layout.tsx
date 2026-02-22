import { hasLocale } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { IdleLogoutGuard } from '@/components/auth/IdleLogoutGuard'
import { CookieConsentBanner } from '@/components/cookies/CookieConsentBanner'
import { routing } from '@/i18n/routing'
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar'
import { Geist, Geist_Mono } from 'next/font/google'

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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    title: 'Bonifatus - ' + t('heroTitle'),
    description: t('heroDescription'),
    icons: {
      icon: '/favicon.png',
      apple: '/images/logo-192.png',
    },
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
              {children}
              <CookieConsentBanner />
              <ServiceWorkerRegistrar />
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
