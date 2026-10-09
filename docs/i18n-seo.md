# URLs, languages and SEO — design decision

Decided 2026-10-09. Applies to the web app (Next.js); the Flutter app only calls `/api/*`.

## The rule

**Every page lives at a URL that names its language, and an unprefixed URL never serves
content.**

| Request                                        | Result                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/de/tools/grade-reward-calculator`            | German page, `200`. Always German, whatever the browser prefers.                                                 |
| `/tools/grade-reward-calculator`               | `307` to the visitor's locale: `NEXT_LOCALE` cookie → `Accept-Language` → `en`. `Vary: Accept-Language, Cookie`. |
| `/`                                            | Same: `307` to `/de`, `/en`, … Googlebot (no `Accept-Language`) lands on `/en`.                                  |
| `/de/does-not-exist`                           | Localized not-found page, real `404`.                                                                            |
| `/de/parent/…` signed out                      | `307` to `/de/login?redirectTo=…`.                                                                               |
| `/sitemap.xml`, `/robots.txt`, `/sw.js`, files | Served as-is, never localized.                                                                                   |

`i18n/routing.ts` sets `localePrefix: 'always'`; `proxy.ts` (the Next.js 16 name for middleware) uses next-intl's
own middleware for locale routing and adds only auth gating on top.

## Why not the alternatives

- **English unprefixed (`/about`) + `/de/about`** (the previous setup, `as-needed`): the
  middleware also served German at `/about` to German browsers. One URL then had several
  languages, the hreflang tags lied, and `/sitemap.xml` was accidentally rewritten into
  `/en/sitemap.xml` (404 for three months).
- **German as the unprefixed default**: it fits today's audience, but it bakes one market
  into the URL scheme and moves the problem rather than removing it.

With every language prefixed there are no special cases: canonical, hreflang, `<html lang>`,
sitemap and analytics all map 1:1 to the URL.

## Language detection without forcing it

Detection happens **only** on the unprefixed redirect. A prefixed URL is never redirected
because of the browser language: someone who opens `/en/…` gets English, and Google's
crawlers see stable content. Instead, `components/i18n/LanguageSuggestion.tsx` offers a
switch when the browser prefers another locale that the page exists in (read from the
page's own hreflang links). The offer is worded in the visitor's language and can be
dismissed.

## Single source of truth

`lib/seo/routes.ts` registers every indexable page with its locales and `lastModified`.
From it:

- `app/sitemap.ts` emits each page in each of its locales with the full hreflang set;
- `buildAlternates()` emits a self-canonical plus reciprocal hreflang. `x-default` is `en`,
  or the page's own language for pages that exist in one locale only (e.g. `/de/ratgeber/…`);
- `app/robots.ts` disallows the protected prefixes in every locale.

Blog posts register themselves in `content/blog/registry.ts`.

**Adding a page:** create it under `app/[locale]/…`, add a `PUBLIC_PAGES` entry (with
`locales` if it isn't in all six), call `buildAlternates(locale, path)` in its
`generateMetadata`. Bump `lastModified` whenever its content materially changes.

## Deployments

`NEXT_PUBLIC_APP_URL` (`lib/site.ts`) is the only origin used in absolute URLs. Only
`https://bonifatus.com` is indexable; any other host (dev, local) serves `noindex` and a
`Disallow: /` robots.txt.

## Guardrails

- `npx vitest run`: unit tests for the registry, alternates, sitemap, robots and proxy routing.
- `node scripts/seo-check.mjs <url>`: live crawl of robots, sitemap and every sitemap URL
  (status, canonical, reciprocal hreflang, `<html lang>`, JSON-LD), locale redirects,
  auth gating and 404s. Runs automatically after every production deploy.
- Structured data never includes ratings or reviews we don't have.
