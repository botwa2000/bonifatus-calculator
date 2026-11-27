// Fixed German copy of the Halbjahreszeugnis pages per Land (German only, like the Ratgeber).

export const LAND_COPY = {
  breadcrumbOverview: 'Halbjahreszeugnis 2027',
  factZeugnis: 'Halbjahreszeugnis',
  factFerien: 'Ferien',
  terminHeading: (name: string) => `Wann gibt es in ${name} 2027 Halbjahreszeugnisse?`,
  ferienHeading: (name: string) => `Winterferien 2027 in ${name}`,
  nextHeading: 'Was Eltern jetzt tun können',
  nextSteps: [
    '**Vorher überlegen, wie Sie reagieren.** Was am Zeugnistag zuerst gesagt wird, prägt das Gespräch mehr als jede einzelne Note. Einen Leitfaden finden Sie im Ratgeber [Das Zeugnisgespräch](/ratgeber/zeugnis-gespraech-fuehren).',
    '**Schwache Noten einordnen.** Das Halbjahreszeugnis ist ein Zwischenstand, keine Versetzungsentscheidung. Fragen, die beim Sortieren helfen: [Schlechtes Zeugnis: Was tun?](/ratgeber/schlechtes-zeugnis-was-tun)',
    '**Die Regel fürs Jahreszeugnis jetzt vereinbaren.** Ein halbes Schuljahr bleibt – genug Zeit, eine Belohnung vorher festzulegen statt am Zeugnistag zu verhandeln.',
  ],
  cta: {
    title: 'Was gäbe es fürs Jahreszeugnis?',
    text: 'Rechnen Sie mit den Noten des Halbjahreszeugnisses durch, was eine Regel ergäbe – pro Note, pro Verbesserung oder pauschal.',
  },
  overviewLink: 'Alle 16 Bundesländer im Überblick: Halbjahreszeugnis 2027',
  otherLaender: 'Halbjahreszeugnis 2027 in den anderen Ländern',
  faqTitle: 'Häufige Fragen',
  sourcesTitle: 'Quellen',
  sourcesNote:
    'Ferientermine: Kultusministerkonferenz (Stand 09.10.2025) und, wo angegeben, die Länder selbst. Stand dieser Seite: 27. November 2026. Maßgeblich ist der Termin, den die Schule nennt.',
} as const
