// Copy for /de/tools/zeugnisgeld-rechner. The tool exists in German only (like the
// Ratgeber), so its text lives here instead of in the six message files.

export const ZEUGNISGELD_PATH = '/tools/zeugnisgeld-rechner'
export const ZEUGNISGELD_LOCALE = 'de'

export const zeugnisgeldCopy = {
  metaTitle: 'Zeugnisgeld-Rechner: Wie viel Geld für welche Note?',
  metaDescription:
    'Kostenloser Zeugnisgeld-Rechner: Noten eingeben, Regel wählen (pro Note, pro Verbesserung oder pauschal) und sehen, wie viel es gibt. Mit Obergrenze, ohne Anmeldung.',
  shortName: 'Zeugnisgeld-Rechner',
  shortDescription: 'Noten eingeben, Regel wählen und sehen, wie viel Zeugnisgeld es gibt.',
  h1: 'Zeugnisgeld-Rechner',
  backLink: 'Kostenlose Eltern-Tools',
  faqTitle: 'Häufige Fragen',
  subtitle:
    'Geben Sie die Noten ein, wählen Sie eine Regel und sehen Sie sofort, wie viel es fürs Zeugnis gibt. Ohne Anmeldung; Ihre Eingaben bleiben in Ihrem Browser.',

  form: {
    modelLegend: 'Welche Regel soll gelten?',
    models: {
      perGrade: { label: 'Pro Note', hint: 'Jede Note hat einen festen Betrag pro Fach.' },
      improvement: {
        label: 'Pro Verbesserung',
        hint: 'Geld gibt es für jede Notenstufe, um die sich ein Fach verbessert hat.',
      },
      flat: { label: 'Pauschal', hint: 'Ein fester Betrag fürs ganze Zeugnis.' },
    },
    perGradeLegend: 'Betrag pro Fach',
    gradeLabel: (g: number) => `Note ${g}`,
    perStepLabel: 'Betrag pro Notenstufe Verbesserung',
    flatLabel: 'Betrag fürs Zeugnis',
    capLabel: 'Obergrenze pro Zeugnis',
    capNone: 'Keine Obergrenze',
    subjectsLegend: 'Fächer und Noten',
    subjectHeader: 'Fach',
    gradeHeader: 'Note',
    previousHeader: 'Letztes Zeugnis',
    noGrade: '–',
    subjectPlaceholder: 'Fach',
    addSubject: '+ Fach hinzufügen',
    removeSubject: (name: string) => `${name || 'Fach'} entfernen`,
    resultLabel: 'Zeugnisgeld',
    resultEmpty: 'Tragen Sie mindestens eine Note ein.',
    resultEmptyImprovement: 'Tragen Sie für mindestens ein Fach beide Noten ein.',
    cappedNote: (subtotal: string) => `Ohne Obergrenze wären es ${subtotal}.`,
    breakdownSteps: (steps: number) =>
      steps === 0
        ? 'nicht besser'
        : steps === 1
          ? '1 Notenstufe besser'
          : `${steps} Notenstufen besser`,
    ruleHeading: 'Ihre Regel in einem Satz',
    copyRule: 'Regel kopieren',
    copied: 'Kopiert',
    currency: '€',
  },

  sections: [
    {
      id: 'regeln',
      heading: 'Drei Regeln im Vergleich',
      paragraphs: [
        '**Pro Note** ist am leichtesten nachzurechnen: Ihr Kind weiß vorher, was eine Zwei wert ist. Der Nachteil: Ein Kind, das sich schwertut, bekommt mit derselben Anstrengung weniger als ein Geschwisterkind, dem die Schule leichtfällt.',
        '**Pro Verbesserung** belohnt den Fortschritt statt des Ergebnisses. Eine Vier, die vorher eine Fünf war, zählt; eine Eins, die eine Eins geblieben ist, nicht. Das passt zu Kindern, die gerade aufholen – und zu Familien mit mehreren Kindern, die unterschiedlich weit sind. Mehr dazu im Ratgeber [Geschwister gerecht belohnen](/ratgeber/geschwister-gerechtigkeit).',
        '**Pauschal** trennt das Geld von den einzelnen Noten: Es gibt eine Anerkennung fürs Halbjahr, egal wie das Zeugnis aussieht. Das nimmt Druck heraus, belohnt aber nichts Bestimmtes.',
        'Ob man Noten überhaupt mit Geld belohnen sollte, ist umstritten. Was die Forschung dazu sagt, fasst der Ratgeber [Schulnoten belohnen – ja oder nein?](/ratgeber/schulnoten-belohnen) zusammen; Alternativen ohne Geld finden Sie unter [Belohnen ohne Geld](/ratgeber/belohnen-ohne-geld).',
      ],
    },
    {
      id: 'hoehe',
      heading: 'Wie viel ist angemessen?',
      paragraphs: [
        'Eine Norm für Zeugnisgeld gibt es nicht. Ein brauchbarer Maßstab ist das monatliche Taschengeld, für das das Deutsche Jugendinstitut Orientierungswerte nach Alter veröffentlicht ([Taschengeld-Tabelle 2025](/ratgeber/taschengeld-tabelle)). Unsere Faustregel: Der ganze Zeugnisbonus sollte in der Größenordnung eines halben bis ganzen Monatstaschengelds bleiben. Deshalb hat der Rechner eine Obergrenze.',
        'Wie sich der Betrag mit dem Alter ändern kann, beschreibt der Ratgeber [Zeugnisgeld nach Klasse](/ratgeber/zeugnisgeld-hoehe-nach-klasse); warum die Regel vor dem Zeugnistag stehen sollte, der Ratgeber [Zeugnisgeld: Wie viel Geld für welche Note ist fair?](/ratgeber/zeugnisgeld).',
      ],
    },
  ],

  faqs: [
    {
      question: 'Wie viel Zeugnisgeld ist üblich?',
      answer:
        'Einen üblichen Betrag gibt es nicht, und viele Familien geben gar kein Geld fürs Zeugnis. Als Maßstab eignet sich das monatliche Taschengeld: Ein Bonus von einem halben bis ganzen Monatstaschengeld bleibt eine Anerkennung und wird nicht zur Hauptsache.',
    },
    {
      question: 'Sollte es für schlechte Noten Abzüge geben?',
      answer:
        'Der Rechner zieht nie etwas ab: Eine schlechtere Note bringt kein Geld, kostet aber auch nichts. Das Taschengeld sollte davon ohnehin getrennt bleiben – das Deutsche Jugendinstitut rät davon ab, es wegen Noten zu kürzen.',
    },
    {
      question: 'Gilt die Regel auch für das Halbjahreszeugnis?',
      answer:
        'Das entscheiden Sie. Viele Familien belohnen nur das Jahreszeugnis und nutzen das Halbjahreszeugnis als Zwischenstand. Wichtig ist, dass die Regel vorher feststeht und für beide Zeugnisse klar ist. Wann es 2027 in Ihrem Land Halbjahreszeugnisse gibt, zeigt die Übersicht [Halbjahreszeugnis 2027: Termine aller Bundesländer](/ratgeber/halbjahreszeugnis-bedeutung).',
    },
    {
      question: 'Werden meine Eingaben gespeichert?',
      answer:
        'Nein. Der Rechner rechnet in Ihrem Browser; Noten und Beträge werden nicht an uns übertragen. Wenn Sie die Regel dauerhaft festhalten möchten, können Sie ein kostenloses Bonifatus-Konto anlegen.',
    },
  ],

  cta: {
    title: 'Als Regel Ihrer Familie in Bonifatus speichern',
    text: 'In Bonifatus legen Sie fest, was jede Note wert ist. Ihr Kind trägt seine Noten ein oder scannt das Zeugnis, und Bonifatus rechnet nach Ihrer Regel – für jedes Kind, mit Übersicht über alles, was schon ausgezahlt wurde.',
    button: 'Kostenlos registrieren',
  },

  season:
    'Halbjahreszeugnis 2027: [Termine aller 16 Bundesländer](/ratgeber/halbjahreszeugnis-bedeutung) – in den meisten Ländern am Freitag, 29. Januar.',

  otherSystems:
    'Für andere Notensysteme, etwa aus Österreich oder der Schweiz, gibt es den [Noten-Belohnungsrechner](/tools/grade-reward-calculator).',
} as const
