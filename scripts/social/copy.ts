// All user-visible copy for scripts/make-social-assets.ts, keyed by locale.
// To add fr/it/es/ru: add an entry to COPY with the same shape — no layout
// code changes. German strings follow docs/social-content/manifest.md verbatim
// where the manifest defines them.
//
// Write real characters (ä, ö, ü, ß, é, …), never transliterations — see
// assertNoTransliteration() below and the diacritics fixture.

import { DJI_ALLOWANCE_TABLE, type AllowanceEntry } from '../../lib/tools/allowance-table'

export type Locale = 'de' | 'en' | 'fr' | 'it' | 'es' | 'ru'

/** A numbered card on a "cards" pin (title + optional body). */
export interface NumberedCard {
  title: string
  body: string
}

/** Pins that promote a Ratgeber article: header, optional table, numbered cards, source, CTA. */
export interface RatgeberPin {
  label: string
  headline: string
  subtext: string
  table?: { head: [string, string]; rows: [string, string][] }
  cards: NumberedCard[]
  source: string
  cta: string
}

export interface Step {
  label: string // pill above the headline, e.g. "Schritt 1"
  headline: string
  subtext: string
  callout: string
}

export interface Copy {
  url: string
  carousel: {
    hook: { headline: string; subtext: string; swipe: string; callout: string }
    step1: Step
    step2: Step
    step3: Step
    cta: { headline: string; subtext: string; points: string[]; button: string }
  }
  pins: {
    taschengeld: {
      label: string
      headline: string
      subtext: string
      weeklyHeader: string
      monthlyHeader: string
      valueHeader: string
      source: string
      tipsTitle: string
      tips: { title: string; body: string }[]
      cta: string
    }
    zeugnisgeldRegeln: {
      label: string
      headline: string
      subtext: string
      rules: { title: string; body: string }[]
    }
    belohnungstafel: {
      label: string
      headline: string
      subtext: string
      columns: [string, string, string, string]
      subjects: string[]
      total: string
      goal: string
      digital: string
      howTitle: string
      how: string[]
    }
    einschulung: {
      label: string
      headline: string
      subtext: string
      items: string[]
      highlight: { title: string; body: string }
      /** Position of the highlighted item within `items` (inserted before it). */
      highlightIndex: number
      cta: string
    }
    baDiskussion: {
      label: string
      headline: string
      before: string
      after: string
      bubbles: string[]
      beforeCaption: string
      afterCaption: string
      callout: string
    }
    ratgeberZeugnisgeld: RatgeberPin
    ratgeberBudgetgeld: RatgeberPin
    ratgeberNoten: RatgeberPin
    baMotivation: {
      label: string
      headline: string
      before: string
      after: string
      reportTitle: string
      report: [string, string][]
      bubble: string
      beforeCaption: string
      afterCaption: string
      callout: string
    }
  }
}

// Allowance guidance values from the Deutsches Jugendinstitut (DJI), September 2025 —
// derived from lib/tools/allowance-table.ts, the single verified source shared with the
// website's calculator and Ratgeber. Never hard-code amounts here.
const ageLabel = (e: AllowanceEntry) =>
  e.ageMin === 0
    ? `unter ${e.ageMax! + 1}`
    : e.ageMax === null
      ? `ab ${e.ageMin}`
      : `${e.ageMin}–${e.ageMax}`
const amountLabel = (e: AllowanceEntry) =>
  `${e.minEur}–${e.maxEur} €/${e.period === 'week' ? 'Wo' : 'Mo'}${e.dependentOnly ? '*' : ''}`
const djiRows = (period: AllowanceEntry['period']) =>
  DJI_ALLOWANCE_TABLE.filter((e) => e.period === period).map(
    (e) => [ageLabel(e), amountLabel(e), e.maxEur] as const
  )
export const DJI_WEEKLY: readonly (readonly [ages: string, amount: string, upperEur: number])[] =
  djiRows('week')
export const DJI_MONTHLY: readonly (readonly [ages: string, amount: string, upperEur: number])[] =
  djiRows('month')

const de: Copy = {
  url: 'bonifatus.com',
  carousel: {
    hook: {
      headline: 'Schluss mit Zeugnisgeld-Willkür.',
      subtext: 'Eine feste Formel statt Verhandeln am Küchentisch.',
      swipe: 'In 3 Schritten erklärt →',
      callout: 'Fair berechnet',
    },
    step1: {
      label: 'Schritt 1',
      headline: 'Fächer & Formel festlegen',
      subtext: 'Wählt gemeinsam die Fächer und legt fest, was welche Note wert ist.',
      callout: 'Fächer hinzufügen',
    },
    step2: {
      label: 'Schritt 2',
      headline: 'Note eintragen — Punkte erscheinen sofort',
      subtext: 'Jede Note wird direkt in Bonuspunkte umgerechnet.',
      callout: 'Sofort berechnet',
    },
    step3: {
      label: 'Schritt 3',
      headline: 'Punkte in Belohnung auszahlen',
      subtext: 'Die Punkte sammeln sich an. Ihr entscheidet: Geld, Zeit oder Prämien.',
      callout: 'Gesammelte Punkte',
    },
    cta: {
      headline: 'Kostenlos, werbefrei, ohne Datenverkauf.',
      subtext: 'Kinder motivieren, Noten fair belohnen.',
      points: ['Kostenlos für die ganze Familie', 'Keine Werbung', 'Kein Verkauf eurer Daten'],
      button: 'Gratis starten auf bonifatus.com',
    },
  },
  pins: {
    taschengeld: {
      label: 'Orientierung',
      headline: 'Taschengeldtabelle 2025',
      subtext: 'Wie viel Taschengeld ist altersgerecht?',
      weeklyHeader: 'Wöchentlich (bis 9 J.)',
      monthlyHeader: 'Monatlich (ab 10 J.)',
      valueHeader: 'Richtwert',
      source: 'Quelle: DJI 2025 · * ab 16, wenn noch von den Eltern abhängig',
      tipsTitle: 'Tipps zur Umsetzung',
      tips: [
        {
          title: 'Wöchentlich auszahlen',
          body: 'Kleine Beträge regelmäßig — schult Umgang mit Geld',
        },
        {
          title: 'Unabhängig von Noten',
          body: 'Laut DJI weder Belohnung noch Strafe — ein Zeugnisbonus ist ein eigener Topf',
        },
        { title: 'Automatisch berechnen', body: 'Bonifatus übernimmt die Formel — kein Streit' },
      ],
      cta: 'Taschengeld & Noten fair belohnen',
    },
    zeugnisgeldRegeln: {
      label: 'Zeugnis',
      headline: '5 Regeln für faires Zeugnisgeld',
      subtext: 'Damit Noten belohnt werden — ohne Diskussion.',
      rules: [
        {
          title: 'Regeln vor dem Zeugnis festlegen',
          body: 'Bevor die Noten da sind, entscheidet ihr gemeinsam, was welche Note wert ist. Keine Nachverhandlung.',
        },
        {
          title: 'Anstrengung zählt, nicht nur das Ergebnis',
          body: 'Wer sich deutlich verbessert hat, bekommt einen Bonus — unabhängig von der absoluten Note.',
        },
        {
          title: 'Dieselbe Formel für alle Kinder',
          body: 'Ältere und jüngere Geschwister haben unterschiedliche Schwierigkeitsniveaus. Bonifatus rechnet das heraus.',
        },
        {
          title: 'Transparenz: Jeder sieht die Formel',
          body: 'Kein „Ich dachte, du meintest …“. Die Punkte stehen im System — für Eltern und Kinder sichtbar.',
        },
        {
          title: 'Gemeinsam entscheiden, wofür die Punkte gelten',
          body: 'Geld, Bildschirmzeit, Ausflug — was die Punkte wert sind, bestimmt die Familie zusammen.',
        },
      ],
    },
    belohnungstafel: {
      label: 'Vorlage',
      headline: 'Kostenlose Belohnungstafel-Vorlage',
      subtext: 'Zum Ausdrucken & selbst Ausfüllen',
      columns: ['Fach', 'Note', 'Punkte', 'Ziel'],
      subjects: ['Mathematik', 'Deutsch', 'Englisch', 'Geschichte', 'Biologie', 'Sport', 'Physik'],
      total: 'Gesamt',
      goal: 'Mein Ziel (Belohnung):',
      digital: 'Digital & automatisch berechnen',
      howTitle: 'So funktioniert es:',
      how: [
        'Fächer & Formel in der App einrichten',
        'Noten eintragen — Punkte erscheinen sofort',
        'Punkte auszahlen oder als Sparziel nutzen',
      ],
    },
    einschulung: {
      label: 'Einschulung',
      headline: 'Checkliste für die Einschulung',
      subtext: 'Alles, woran Familien vorher denken sollten',
      items: [
        'Schultüte vorbereiten',
        'Schulranzen packen (Federmäppchen, Hefter, Blöcke)',
        'Schulsachen mit Namen beschriften',
        'Pausenbrot & Trinkflasche einpacken',
        'Weg zur Schule üben & Ankunftszeit prüfen',
        'Fotos planen — Schild beschriften nicht vergessen',
        'Mit dem Kind über die neue Klasse sprechen',
        'Hausaufgaben-Ritual vereinbaren',
        'Notfallnummer in der Schule hinterlegen',
      ],
      highlight: {
        title: 'Belohnungssystem einrichten — z. B. mit Bonifatus',
        body: 'Bonuspunkte automatisch berechnen lassen',
      },
      highlightIndex: 7,
      cta: 'Gratis starten',
    },
    baDiskussion: {
      label: 'Vorher / Nachher',
      headline: 'Vorher: Streit ums Zeugnis. Nachher: Ruhe.',
      before: 'Vorher',
      after: 'Nachher',
      bubbles: [
        '20 Euro fürs Zeugnis?!',
        'Warum kriegt SIE mehr? Das ist ungerecht!',
        'Ich hab mich doch verbessert!',
        'Letztes Jahr gab’s mehr …',
      ],
      beforeCaption: 'Jedes Jahr dasselbe.',
      afterCaption: 'Eine Formel. Alle Kinder. Keine Diskussion.',
      callout: 'Für alle gleich berechnet',
    },
    ratgeberZeugnisgeld: {
      label: 'Ratgeber',
      headline: 'Zeugnisgeld: Wie viel ist fair?',
      subtext: 'Was üblich ist – und wie eine faire Regel aussieht.',
      cards: [
        {
          title: 'Nur 21 % geben Geld',
          body: 'Knapp 60 % der Eltern belohnen das Zeugnis – meist nicht mit Geld.',
        },
        {
          title: 'Am Taschengeld orientieren',
          body: 'Der ganze Bonus: etwa ein halbes bis ein ganzes Monatstaschengeld.',
        },
        {
          title: 'Regel vor dem Zeugnistag',
          body: 'Kein „Das hatten wir anders besprochen“ am Küchentisch.',
        },
        {
          title: 'Verbesserung zählt',
          body: 'Von 4 auf 3 kann mehr Arbeit sein als eine gehaltene 1.',
        },
        {
          title: 'Gleiche Regel für alle Kinder',
          body: 'Ältere und jüngere Geschwister – nach denselben Prinzipien, ohne Abzüge.',
        },
      ],
      source: 'Quelle: forsa-Umfrage im Auftrag von Studienkreis, 2018',
      cta: 'Ganzer Ratgeber mit Rechenbeispiel',
    },
    ratgeberBudgetgeld: {
      label: 'Neu 2025',
      headline: 'Budgetgeld ab 12: die neuen DJI-Werte',
      subtext: 'Zusätzlich zum Taschengeld – für feste Ausgaben.',
      table: {
        head: ['Bereich', 'pro Monat'],
        rows: [
          ['Kleidung & Schuhe', '45–65 €'],
          ['Essen außer Haus', '25–40 €'],
          ['Handy, Internet & Abos', '15–25 €'],
          ['Schulmaterial', '5–15 €'],
          ['Kosmetik & Pflege', '5–15 €'],
        ],
      },
      cards: [
        {
          title: 'Selbst planen lernen',
          body: 'Jugendliche verwalten das Geld selbst und sehen, wofür es reicht.',
        },
        {
          title: 'Schrittweise starten',
          body: 'Zum Beispiel erst mit dem Handyvertrag.',
        },
        {
          title: 'Taschengeld bleibt unabhängig von Noten',
          body: 'Laut DJI weder Belohnung noch Strafe.',
        },
      ],
      source: 'Quelle: Deutsches Jugendinstitut (DJI), September 2025',
      cta: 'Alle Werte in der Taschengeld-Tabelle 2025',
    },
    ratgeberNoten: {
      label: 'Forschung',
      headline: 'Noten belohnen – ja oder nein?',
      subtext: 'Was Studien zeigen – auch die Argumente dagegen.',
      cards: [
        {
          title: 'Geld allein hebt keine Noten',
          body: 'Große US-Studie an 203 Schulen: kein messbarer Effekt auf Testergebnisse.',
        },
        {
          title: 'Erwartete Belohnungen können bremsen',
          body: 'In Laborstudien senkten sie das eigene Interesse – bei Kindern stärker.',
        },
        {
          title: 'Ehrliches Lob wirkt',
          body: 'Konkretes, positives Feedback steigert die Motivation.',
        },
        {
          title: 'Wenn belohnen, dann so',
          body: 'Klein, vorher vereinbart, Verbesserung zählt – unabhängig vom Taschengeld.',
        },
      ],
      source: 'Quellen: Deci, Koestner & Ryan 1999 · Fryer 2011',
      cta: 'Pro & Contra mit allen Quellen',
    },
    baMotivation: {
      label: 'Motivation',
      headline: 'Vorher: schlechte Note. Nachher: mehr Punkte.',
      before: 'Vorher',
      after: 'Nachher',
      reportTitle: 'Zeugnis 2025/26',
      report: [
        ['Mathematik', '4'],
        ['Deutsch', '3'],
        ['Englisch', '2'],
      ],
      bubble: 'Note 4 … na und?',
      beforeCaption: 'Noten ohne Konsequenz.',
      afterCaption: 'Jede Note zählt. Das Kind weiß, wofür es arbeitet.',
      callout: 'Punkte, die sich lohnen',
    },
  },
}

export const COPY: Partial<Record<Locale, Copy>> = { de }

// Transliterations that have shipped (or nearly shipped) on this project.
// A renderer or an editor that ASCII-folds strings produces exactly these.
const TRANSLITERATED =
  /\b(Willkuer|Faecher|fuer|Praemie\w*|ueber|Waehl\w*|Schueler\w*|Fuell\w*|Blaett\w*|Aeltere|Ueber\w*|Taetig\w*|Maeppchen|Bloecke|Schultuete|pruefen|zaehlt|weiss|regelmaessig|Betraege|Woechentlich|uebernimmt|beruecksichtigt|Kuechentisch|koennen|muessen|juengere?|unabhaengig\w*|wofuer|ausser|Abzuege|daempf\w*)\b/i

/** Throws if any German string contains an ASCII-folded umlaut or ß. */
export function assertNoTransliteration(locale: Locale, copy: Copy) {
  if (locale !== 'de') return
  const bad: string[] = []
  const walk = (v: unknown, at: string) => {
    if (typeof v === 'string') {
      const m = v.match(TRANSLITERATED)
      if (m) bad.push(`${at}: "${m[0]}" in "${v}"`)
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`))
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`)
  }
  walk(copy, locale)
  if (bad.length) throw new Error(`Transliterated German in social copy:\n  ${bad.join('\n  ')}`)
}
