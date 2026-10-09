import { defineRouting } from 'next-intl/routing'

// Every page lives under an explicit locale prefix (/en/…, /de/…): one URL = one language.
// Unprefixed URLs never serve content — the middleware redirects them to the visitor's
// locale (cookie → Accept-Language → default). See docs/i18n-seo.md.
export const routing = defineRouting({
  locales: ['en', 'de', 'fr', 'it', 'es', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
  // hreflang is emitted in the HTML from the page registry, which knows which locales
  // really exist for each page. next-intl's Link header would claim all six for every URL.
  alternateLinks: false,
})

export type Locale = (typeof routing.locales)[number]
