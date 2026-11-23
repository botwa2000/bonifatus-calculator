// Copy for /de/tools/notendurchschnitt-rechner (German only, like the Ratgeber).

export const NOTENDURCHSCHNITT_PATH = '/tools/notendurchschnitt-rechner'
export const NOTENDURCHSCHNITT_LOCALE = 'de'

export const notendurchschnittCopy = {
  metaTitle: 'Notendurchschnitt berechnen: Rechner für Zeugnis und Übertritt',
  metaDescription:
    'Notendurchschnitt online berechnen: Noten eingeben, Fächer gewichten, Schnitt sofort sehen. Mit Übertritts-Check für Bayern (2,33 / 2,66). Kostenlos, ohne Anmeldung.',
  shortName: 'Notendurchschnitt-Rechner',
  shortDescription: 'Notendurchschnitt berechnen, mit Gewichtung und Übertritts-Check für Bayern.',
  h1: 'Notendurchschnitt berechnen',
  subtitle:
    'Noten eingeben, bei Bedarf Fächer doppelt zählen lassen und den Durchschnitt sofort sehen. Ohne Anmeldung; Ihre Eingaben bleiben in Ihrem Browser.',
  backLink: 'Kostenlose Eltern-Tools',
  faqTitle: 'Häufige Fragen',
  sourcesTitle: 'Quellen',

  form: {
    tabs: { all: 'Zeugnis-Durchschnitt', bavaria: 'Übertritt Bayern (Klasse 4)' },
    subjectHeader: 'Fach',
    gradeHeader: 'Note',
    weightHeader: 'Zählt',
    weightOptions: [
      { value: 1, label: 'einfach' },
      { value: 2, label: 'doppelt' },
    ],
    subjectPlaceholder: 'Fach',
    addSubject: '+ Fach hinzufügen',
    removeSubject: (name: string) => `${name || 'Fach'} entfernen`,
    noGrade: '–',
    resultLabel: 'Notendurchschnitt',
    resultEmpty: 'Tragen Sie mindestens eine Note ein.',
    resultDetail: (counted: number, exact: string) =>
      `aus ${counted} ${counted === 1 ? 'Note' : 'Noten'} · genau ${exact}`,
    bavariaIntro:
      'Jahresfortgangsnoten in Deutsch, Mathematik sowie Heimat- und Sachunterricht eintragen:',
    bavariaResult: {
      gymnasium: 'Gesamtdurchschnitt bis 2,33: Eignung für Gymnasium und Realschule.',
      realschule: 'Gesamtdurchschnitt bis 2,66: Eignung für die Realschule.',
      none: 'Gesamtdurchschnitt über 2,66: keine Eignung über die Durchschnittsnote. Weitere Wege, etwa den Probeunterricht, beschreibt das Kultusministerium.',
    },
    bavariaEmpty: 'Tragen Sie alle drei Noten ein.',
  },

  sections: [
    {
      id: 'so-rechnen',
      heading: 'So berechnen Sie den Notendurchschnitt',
      paragraphs: [
        'Zählen Sie alle Noten zusammen und teilen Sie die Summe durch die Zahl der Noten. Beispiel: Deutsch 2, Mathematik 3, Englisch 1, Sport 2 ergibt 8 geteilt durch 4 – ein Durchschnitt von **2,0**.',
        'Sollen manche Fächer stärker zählen, nehmen Sie deren Note mit dem Gewicht mal und teilen durch die Summe der Gewichte. Zählen Deutsch und Mathematik doppelt, wird aus dem Beispiel (2·2 + 3·2 + 1 + 2) ÷ 6 = **2,16**. Welche Fächer wie stark zählen, hängt davon ab, wofür Sie den Durchschnitt brauchen; der Rechner zählt alle Fächer einfach, solange Sie nichts ändern.',
        'Der Rechner zeigt den Durchschnitt auf zwei Nachkommastellen **abgeschnitten**, nicht gerundet: aus 2,666… wird 2,66. So sind die Grenzwerte der bayerischen Grundschulordnung (2,33 und 2,66) formuliert, die sich aus drei ganzen Noten ergeben.[^1] Den genauen Wert zeigt der Rechner zusätzlich an.',
        'Noten mit Tendenz (2+ oder 3–) rechnet der Rechner nicht mit ein, weil Schulen sie unterschiedlich werten. Geben Sie die ganze Note ein oder fragen Sie die Schule, wie sie Tendenzen zählt.',
      ],
    },
    {
      id: 'uebertritt-bayern',
      heading: 'Übertritt in Bayern: welcher Schnitt fürs Gymnasium?',
      paragraphs: [
        'In Bayern erhalten alle Viertklässler am ersten Unterrichtstag im Mai ein Übertrittszeugnis. Es enthält die Jahresfortgangsnoten in Deutsch, Mathematik sowie Heimat- und Sachunterricht und die Gesamtdurchschnittsnote aus diesen drei Fächern.[^1]',
        'Für das Gymnasium liegt die Eignung vor, wenn diese Gesamtdurchschnittsnote mindestens **2,33** beträgt, für die Realschule mindestens **2,66**.[^1] Für Kinder mit nichtdeutscher Muttersprache, die nicht schon ab der ersten Klasse eine deutsche Grundschule besucht haben, kann die Eignung unter bestimmten Bedingungen bis zu einem Schnitt von 3,33 festgestellt werden.[^1] Andere Wege, wenn der Schnitt nicht reicht, erklärt das Kultusministerium.[^2]',
      ],
    },
    {
      id: 'einordnen',
      heading: 'Was ein Durchschnitt aussagt – und was nicht',
      paragraphs: [
        'Ein Durchschnitt fasst ein Zeugnis in einer Zahl zusammen und verdeckt dabei, was dahinter steht: ob ein Fach abgerutscht ist, ob es Fortschritte gab, wie es beim Arbeitsverhalten aussieht. Wie Sie ein Zeugnis lesen, ohne sich an einer Zahl festzuhalten, beschreibt der Ratgeber [Halbjahreszeugnis: Was es bedeutet](/ratgeber/halbjahreszeugnis-bedeutung). Ist der Schnitt schlechter als erwartet, helfen die Fragen im Ratgeber [Schlechtes Zeugnis: Was tun?](/ratgeber/schlechtes-zeugnis-was-tun).',
        'Wenn Sie gute Noten oder Verbesserungen anerkennen möchten, rechnet der [Zeugnisgeld-Rechner](/tools/zeugnisgeld-rechner) eine Belohnung nach einer Regel aus, die Sie vorher festlegen. Alle Ratgeber finden Sie unter [Ratgeber für Eltern](/ratgeber).',
      ],
    },
  ],

  faqs: [
    {
      question: 'Wie berechne ich meinen Notendurchschnitt?',
      answer:
        'Alle Noten addieren und durch die Anzahl der Noten teilen. Zählen Fächer doppelt, wird ihre Note mit 2 multipliziert und durch die Summe der Gewichte geteilt.',
    },
    {
      question: 'Wird der Notendurchschnitt gerundet?',
      answer:
        'Das hängt von der Regelung ab, für die Sie ihn brauchen. Die bayerische Grundschulordnung nennt die Grenzwerte 2,33 und 2,66 – das entspricht einem nach der zweiten Stelle abgeschnittenen Durchschnitt aus drei ganzen Noten. Der Rechner zeigt diesen Wert und den genauen Wert.',
    },
    {
      question: 'Welchen Notendurchschnitt braucht man fürs Gymnasium in Bayern?',
      answer:
        'Eine Gesamtdurchschnittsnote von mindestens 2,33 aus Deutsch, Mathematik sowie Heimat- und Sachunterricht im Übertrittszeugnis der 4. Klasse; für die Realschule mindestens 2,66.',
    },
  ],

  sources: [
    {
      text: 'Schulordnung für die Grundschulen in Bayern (Grundschulordnung – GrSO) vom 11. September 2008, § 6 Abs. 3 bis 6.',
      url: 'https://www.gesetze-bayern.de/Content/Pdf/BayVSO?all=True',
    },
    {
      text: 'Bayerisches Staatsministerium für Unterricht und Kultus: Übertritt und Schulartwechsel.',
      url: 'https://www.km.bayern.de/lernen/ubertritt-und-bildungswege/uebertritt',
    },
  ],

  cta: {
    title: 'Jedes Zeugnis speichern statt neu rechnen',
    text: 'In Bonifatus trägt Ihr Kind seine Noten ein oder scannt das Zeugnis. Den Durchschnitt mit Fachgewichtung rechnet Bonifatus selbst, Sie sehen den Verlauf über die Halbjahre, und gute Noten bringen Punkte nach einer Regel, die Sie festlegen.',
    button: 'Kostenlos registrieren',
  },
} as const
