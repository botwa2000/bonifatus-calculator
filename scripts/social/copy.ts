// All user-visible copy for scripts/make-social-assets.ts, keyed by locale.
// To add fr/it/es/ru: add an entry to COPY with the same shape — no layout
// code changes. German strings follow docs/social-content/manifest.md verbatim
// where the manifest defines them.
//
// Write real characters (ä, ö, ü, ß, é, …), never transliterations — see
// assertNoTransliteration() below and the diacritics fixture.

export type Locale = 'de' | 'en' | 'fr' | 'it' | 'es' | 'ru'

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

// Allowance guidance values from the Deutsches Jugendinstitut (DJI), as
// verified for pin_taschengeldtabelle. Locale-independent; NEVER edit these
// numbers without re-verifying against the DJI source.
export const DJI_WEEKLY: readonly [ages: string, amount: string, upperEur: number][] = [
  ['4–5', '0,50–1 €/Wo', 1],
  ['6–7', '2–3 €/Wo', 3],
  ['8–9', '3–4 €/Wo', 4],
]
export const DJI_MONTHLY: readonly [ages: string, amount: string, upperEur: number][] = [
  ['10–11', '15–25 €/Mo', 25],
  ['12–13', '20–30 €/Mo', 30],
  ['14–15', '25–45 €/Mo', 45],
  ['16–17', '40–60 €/Mo', 60],
  ['ab 18', '55–75 €/Mo', 75],
]

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
      headline: 'Taschengeldtabelle 2026',
      subtext: 'Wie viel Taschengeld ist altersgerecht?',
      weeklyHeader: 'Wöchentlich (4–9 J.)',
      monthlyHeader: 'Monatlich (10+ J.)',
      valueHeader: 'Richtwert',
      source: 'Quelle: Deutsches Jugendinstitut (DJI) — Richtwerte, keine Garantien',
      tipsTitle: 'Tipps zur Umsetzung',
      tips: [
        {
          title: 'Wöchentlich auszahlen',
          body: 'Kleine Beträge regelmäßig — schult Umgang mit Geld',
        },
        { title: 'Noten mit einrechnen', body: 'Bonus fürs Zeugnis: z. B. 10 € pro Note 1' },
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
  /\b(Willkuer|Faecher|fuer|Praemie\w*|ueber|Waehl\w*|Schueler\w*|Fuell\w*|Blaett\w*|Aeltere|Ueber\w*|Taetig\w*|Maeppchen|Bloecke|Schultuete|pruefen|zaehlt|weiss|regelmaessig|Betraege|Woechentlich|uebernimmt|beruecksichtigt|Kuechentisch|koennen|muessen)\b/i

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
