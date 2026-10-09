import React from 'react'
import { SITE_URL } from '@/lib/site'
import { localizedUrl } from '@/lib/seo/alternates'

type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue }

interface JsonLdProps {
  data: JsonLdValue
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// Structured data must describe only what is true and visible. Never add ratings,
// review counts or `aggregateRating` without real, on-page reviews — fabricated review
// markup is a Google manual-action risk.

const ORGANIZATION_ID = `${SITE_URL}/#organization`

function organization() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Bonifatus',
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-512.png`,
  }
}

/**
 * Organization + the Bonifatus web app, for the homepage and the calculator.
 * `description` must come from the localized `seo` messages of the rendering locale.
 */
export function webApplicationJsonLd({
  locale,
  path,
  name,
  description,
}: {
  locale: string
  path: string
  name: string
  description: string
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      {
        '@type': 'WebApplication',
        name,
        description,
        url: localizedUrl(locale, path),
        inLanguage: locale,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web, iOS, Android',
        // Core features are free; a paid tier is planned but does not exist yet.
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  }
}

export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function blogPostJsonLd(post: {
  title: string
  description: string
  slug: string
  publishedAt: string
  updatedAt?: string
  locale: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url: localizedUrl(post.locale, `/blog/${post.slug}`),
    inLanguage: post.locale,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    publisher: organization(),
  }
}
