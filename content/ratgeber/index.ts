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
    updatedAt: '2026-10-10',
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
    updatedAt: '2026-10-10',
    readingTimeMinutes: 7,
  },
  {
    slug: 'zeugnisgeld-hoehe-nach-klasse',
    locale: 'de',
    title: 'Zeugnisgeld nach Klasse: Wie sich der Betrag mit dem Alter ändern sollte',
    description:
      'Grundschule, Mittelstufe, Oberstufe: Warum ein fester Betrag pro Note nicht mitwächst, was Kinder in welchem Alter motiviert und wie Sie eine Zeugnisregel mitwachsen lassen.',
    publishedAt: '2026-10-10',
    updatedAt: '2026-10-10',
    readingTimeMinutes: 6,
  },
  {
    slug: 'belohnen-ohne-geld',
    locale: 'de',
    title: 'Belohnen ohne Geld: Was statt Zeugnisgeld wirklich wirkt',
    description:
      'Die meisten Eltern geben zum Zeugnis kein Geld. Was stattdessen wirkt – Lob, gemeinsame Zeit, Mitbestimmung – und warum ein versprochenes Geschenk dem Zeugnisgeld ähnlicher ist, als es aussieht.',
    publishedAt: '2026-10-10',
    updatedAt: '2026-10-10',
    readingTimeMinutes: 6,
  },
  {
    slug: 'geschwister-gerechtigkeit',
    locale: 'de',
    title: 'Geschwister gerecht belohnen: Gleiche Regel oder gleicher Maßstab?',
    description:
      '„Warum bekommt sie mehr als ich?“ Was die Forschung über Gerechtigkeit zwischen Geschwistern zeigt, warum gleiche Beträge nicht automatisch fair sind – und wann eine Drei mehr wert ist als eine Eins.',
    publishedAt: '2026-10-10',
    updatedAt: '2026-10-10',
    readingTimeMinutes: 6,
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
