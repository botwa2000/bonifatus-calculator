// Single source for the public origin of this deployment. The deploy workflow passes
// NEXT_PUBLIC_APP_URL as a build arg (https://bonifatus.com for prod,
// https://dev.bonifatus.com for dev), so canonicals, hreflang, the sitemap and JSON-LD
// always point at the host that actually served them.
export const PRODUCTION_URL = 'https://bonifatus.com'

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_URL).replace(/\/+$/, '')

// Only the production host may be indexed. Every other deployment (dev, local, previews)
// tells crawlers to stay out so it never competes with production as duplicate content.
export const IS_INDEXABLE_DEPLOYMENT = SITE_URL === PRODUCTION_URL
