import type { RatgeberMeta } from './types'

// Lightweight index of all Ratgeber articles (no body text), so the page registry,
// sitemap and hub can list them without loading the articles. Bodies live in
// content/ratgeber/<locale>/<slug>.ts and are loaded via ./registry.

export const RATGEBER_INDEX: readonly RatgeberMeta[] = [
  {
    slug: 'zeugnisgeld',
    locale: 'de',
    title: 'Zeugnisgeld: Wie viel Geld für welche Note ist fair?',
    description:
      'Wie verbreitet Zeugnisgeld ist, welcher Betrag angemessen ist – und warum eine Regel, die vor dem Zeugnistag steht, besser funktioniert als jede Verhandlung danach. Mit Rechenbeispiel.',
    publishedAt: '2026-10-09',
    updatedAt: '2026-10-09',
    readingTimeMinutes: 6,
  },
  {
    slug: 'taschengeld-tabelle',
    locale: 'de',
    title: 'Taschengeld-Tabelle 2025: Wie viel Taschengeld in welchem Alter?',
    description:
      'Die aktuellen Taschengeld-Empfehlungen des Deutschen Jugendinstituts (DJI) nach Alter, das neue Budgetgeld ab 12 – und warum Belohnungen für Noten nicht ins Taschengeld gehören.',
    publishedAt: '2026-10-09',
    updatedAt: '2026-10-09',
    readingTimeMinutes: 6,
  },
  {
    slug: 'schulnoten-belohnen',
    locale: 'de',
    title: 'Schulnoten belohnen – ja oder nein? Was die Forschung wirklich sagt',
    description:
      'Geld für gute Noten: Was Studien zu Belohnungen und Motivation zeigen, warum die Einwände ernst zu nehmen sind – und wann ein transparentes System trotzdem hilft.',
    publishedAt: '2026-10-09',
    updatedAt: '2026-10-09',
    readingTimeMinutes: 7,
  },
]

export function getRatgeberIndex(locale: string): RatgeberMeta[] {
  return RATGEBER_INDEX.filter((a) => a.locale === locale)
}

export function getRatgeberMeta(locale: string, slug: string): RatgeberMeta | undefined {
  return RATGEBER_INDEX.find((a) => a.locale === locale && a.slug === slug)
}

/** Locales that have at least one article (the hub exists only there). */
export function ratgeberLocales(): string[] {
  return [...new Set(RATGEBER_INDEX.map((a) => a.locale))]
}
