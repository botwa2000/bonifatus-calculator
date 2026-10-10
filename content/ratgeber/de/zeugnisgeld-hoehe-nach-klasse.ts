import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    'Zwei Euro für eine Eins klingen für ein Kind in der dritten Klasse nach viel Geld. Für eine Sechzehnjährige, die im Monat ein Vielfaches davon als Taschengeld bekommt, sind sie kaum der Rede wert. Eine Regel, die in der Grundschule gut funktioniert hat, passt deshalb selten noch in der Oberstufe.',
    'Dieser Ratgeber zeigt, was sich zwischen Grundschule, Mittelstufe und Oberstufe ändert – beim Geld, bei den Noten selbst und bei dem, was Kinder überhaupt motiviert – und wie Sie eine Zeugnisregel mitwachsen lassen.',
  ],
  sections: [
    {
      id: 'fester-betrag',
      heading: 'Warum ein fester Betrag pro Note nicht mitwächst',
      blocks: [
        {
          type: 'p',
          text: 'Der einfachste Maßstab für die Höhe eines Zeugnisbonus ist das Taschengeld. Und das wächst mit dem Alter deutlich: Das Deutsche Jugendinstitut (DJI) empfiehlt für Sechs- bis Siebenjährige 2 bis 3 Euro pro Woche, für 14- bis 15-Jährige 25 bis 45 Euro im Monat und für 16- bis 17-Jährige 40 bis 60 Euro.[^1] Umgerechnet ist das Taschengeld in der Oberstufe etwa vier- bis sechsmal so hoch wie in der ersten Klasse.',
        },
        {
          type: 'table',
          head: ['Schulphase', 'DJI-Taschengeld', 'Passende Anerkennung'],
          rows: [
            ['Klasse 1–2 (6–7 Jahre)', '2–3 € pro Woche', 'Gemeinsame Unternehmung'],
            ['Klasse 3–4 (8–9 Jahre)', '3–4 € pro Woche', 'Kleine, sofortige Anerkennung'],
            ['Klasse 5–10 (10–15 Jahre)', '15–45 € pro Monat', 'Bonus pro Note oder Verbesserung'],
            ['Oberstufe (16–18 Jahre)', '40–75 € pro Monat', 'Selbst gesteckte Halbjahresziele'],
          ],
          note: 'Alter ungefähr. Taschengeld: Orientierungswerte des DJI (2025), ab 16 für Jugendliche, die finanziell von den Eltern abhängig sind; ab 12 empfiehlt das DJI zusätzlich ein Budgetgeld. Die rechte Spalte ist unsere Einschätzung.',
        },
        {
          type: 'p',
          text: 'Ein fester Betrag pro Note verschiebt sich dadurch Jahr für Jahr. Drei Einsen zu je 2 Euro ergeben 6 Euro – für ein Kind mit 13 bis 17 Euro Taschengeld im Monat fast ein halbes Monatstaschengeld, für eine Sechzehnjährige mit 40 bis 60 Euro nur noch ein Bruchteil. Gleichzeitig steigt die Zahl der Fächer, und die Noten selbst ändern ihren Charakter.',
        },
      ],
    },
    {
      id: 'grundschule',
      heading: 'Grundschule: klein, sofort und gemeinsam',
      blocks: [
        {
          type: 'p',
          text: 'Wann es die ersten Ziffernnoten gibt, regelt jedes Bundesland selbst; in den ersten Schuljahren bekommen Kinder vielerorts stattdessen ein Berichtszeugnis. Ein Betrag pro Note ergibt dann schlicht keinen Sinn.',
        },
        {
          type: 'p',
          text: 'Auch danach spricht einiges gegen Geld. In einer Feldstudie mit mehreren Tausend Schülerinnen und Schülern in und um Chicago reagierten Grundschulkinder (Klasse 2 bis 5) besonders stark auf eine Trophäe im Wert von etwa 3 US-Dollar – ähnlich stark wie auf 20 Dollar in bar.[^2] Ein zweiter Befund ist für jedes Alter wichtig: Belohnungen, die erst einen Monat später ausgehändigt wurden, hatten keinen messbaren Effekt mehr.[^2] Die Studie belohnte allerdings einen einzelnen Test, der kurz vorher angekündigt wurde, und kein ganzes Halbjahr; übertragbar ist vor allem die Richtung.',
        },
        {
          type: 'p',
          text: 'Für die Grundschule heißt das: eine gemeinsame Unternehmung am Zeugnistag selbst, ein Lieblingsessen, ein Ausflug, den das Kind aussuchen darf. Mehr Anregungen dazu sammelt der Ratgeber [Belohnen ohne Geld](/ratgeber/belohnen-ohne-geld).',
        },
      ],
    },
    {
      id: 'mittelstufe',
      heading: 'Mittelstufe: die Phase für eine echte Regel',
      blocks: [
        {
          type: 'p',
          text: 'Ab etwa zehn Jahren empfiehlt das DJI ein monatliches Taschengeld.[^1] Kinder können jetzt rechnen, planen und eine Regel selbst nachvollziehen – das ist die Phase, in der eine vorher vereinbarte Zeugnisregel am besten funktioniert.',
        },
        {
          type: 'p',
          text: 'Zugleich nimmt die Wirkung von Geld nicht automatisch zu. In der Chicagoer Studie reagierten ältere Schülerinnen und Schüler schwächer auf die Belohnungen als jüngere, und bei einer kleinen Geldprämie von 10 Dollar deutete sich bei ihnen sogar ein negativer Effekt an.[^2] In einem anderen Experiment bekamen Neuntklässler in Chicago Geld für ihre Noten; die Noten stiegen nur leicht, und auf standardisierte Tests hatte das keinen nachweisbaren Effekt.[^3]',
        },
        {
          type: 'ul',
          items: [
            '**Am Monatstaschengeld orientieren:** Den gesamten Bonus pro Zeugnis auf etwa ein halbes bis ein ganzes Monatstaschengeld deckeln – so wächst er automatisch mit.',
            '**Verbesserungen zählen lassen:** Ein Sprung von 4 auf 3 belohnt etwas, das Ihr Kind selbst beeinflussen kann.',
            '**Jedes Jahr neu ansehen:** Zum neuen Schuljahr gemeinsam prüfen, ob Betrag und Regel noch passen.',
          ],
        },
      ],
    },
    {
      id: 'oberstufe',
      heading: 'Oberstufe: Punkte statt Noten, Ziele statt Tarif',
      blocks: [
        {
          type: 'p',
          text: 'In der gymnasialen Oberstufe werden Leistungen in Punkten von 0 bis 15 bewertet; eine Eins entspricht 13 bis 15 Punkten.[^4] Vor allem aber zählen die Halbjahresergebnisse der Qualifikationsphase direkt für das Abitur: 36 von ihnen werden eingebracht und machen bis zu 600 der 900 Punkte der Gesamtqualifikation aus.[^4] Jedes Halbjahreszeugnis hat damit Gewicht.',
        },
        {
          type: 'p',
          text: 'Eine Regel aus der Mittelstufe lässt sich nicht einfach übertragen. Wer weiter pro Note belohnen möchte, sollte auf Punkte umstellen. Oft passt in diesem Alter aber etwas anderes besser: Jugendliche stecken sich ihre Ziele selbst – etwa in einem Fach, das ihnen schwerfällt – und der Bonus hängt an diesem Ziel. Daneben verwalten sie ab 12 im Idealfall schon ein eigenes Budgetgeld.[^1]',
        },
        {
          type: 'p',
          text: 'Größere Beträge gibt es in vielen Familien ohnehin erst zum Abschluss. In einer forsa-Umfrage unter Eltern von Zehn- bis 18-Jährigen bekamen die höchsten Summen vor allem ältere Schülerinnen und Schüler für ein gutes Abschlusszeugnis oder das Abitur.[^5]',
        },
      ],
    },
    {
      id: 'mitwachsen',
      heading: 'Drei Wege, eine Regel mitwachsen zu lassen',
      blocks: [
        {
          type: 'ol',
          items: [
            '**Anteil statt Festbetrag.** Formulieren Sie den Bonus als Anteil des Monatstaschengelds. Steigt das Taschengeld, steigt der Bonus mit, ohne dass neu verhandelt werden muss.',
            '**Stufenfaktor.** Ein Faktor pro Klassenstufe hebt den Wert einer Note mit dem Alter. Unser Rechner macht das standardmäßig mit einem Faktor, der der Klassenstufe entspricht – eine Eins zählt in Klasse 10 zehnmal so viel wie in Klasse 1. Das wächst schneller als das Taschengeld. Der Rechner arbeitet deshalb mit Punkten: Was ein Punkt wert ist, legen Sie fest.',
            '**Phasenwechsel.** Von der gemeinsamen Unternehmung in der Grundschule über den Bonus pro Note in der Mittelstufe zum selbst gesteckten Ziel in der Oberstufe.',
          ],
        },
        {
          type: 'p',
          text: 'Welcher Weg passt, hängt davon ab, wie viele Kinder Sie haben und wie weit sie auseinander sind. Wie Sie Geschwister in verschiedenen Klassen fair behandeln, zeigt der Ratgeber [Geschwister gerecht belohnen](/ratgeber/geschwister-gerechtigkeit).',
        },
        { type: 'cta' },
      ],
    },
  ],
  cta: {
    title: 'Sehen, was eine Regel in jeder Klasse ergibt',
    text: 'Geben Sie Klassenstufe und Noten in den kostenlosen Noten-Belohnungsrechner ein und vergleichen Sie, wie sich dieselbe Regel in Klasse 5 und in Klasse 10 auswirkt. Ohne Anmeldung.',
    button: 'Zum Noten-Belohnungsrechner',
    href: '/tools/grade-reward-calculator',
  },
  faqs: [
    {
      question: 'Ab welcher Klasse ist Geld für Noten sinnvoll?',
      answer:
        'Frühestens, wenn es Ziffernnoten gibt und Ihr Kind eine Regel selbst nachrechnen kann – meist in der Mittelstufe. In der Grundschule passen gemeinsame Unternehmungen oder kleine, sofortige Anerkennungen besser; jüngere Kinder reagierten in Studien auf symbolische Belohnungen ähnlich stark wie auf Geld.',
    },
    {
      question: 'Wie viel Zeugnisgeld ist in der Oberstufe angemessen?',
      answer:
        'Eine Norm gibt es nicht. Als Maßstab eignet sich weiter das Taschengeld, das laut DJI für 16- bis 17-Jährige bei 40 bis 60 Euro im Monat liegt. Weil die Halbjahresnoten der Qualifikationsphase direkt ins Abitur eingehen, bietet sich eine Regel pro Halbjahr an – idealerweise an Ziele geknüpft, die die Jugendlichen selbst setzen.',
    },
    {
      question: 'Sollte der Betrag jedes Jahr steigen?',
      answer:
        'Er sollte im Verhältnis zum Taschengeld bleiben. Am einfachsten ist ein Bonus, der als Anteil des Monatstaschengelds formuliert ist: Dann wächst er automatisch mit, und am Schuljahresanfang genügt ein kurzer gemeinsamer Blick auf die Regel.',
    },
    {
      question: 'Gibt es für das Abitur extra Geld?',
      answer:
        'In vielen Familien ja – in der forsa-Umfrage bekamen ältere Schülerinnen und Schüler die höchsten Beträge vor allem für ein gutes Abschlusszeugnis oder das Abitur. Wenn Sie das planen, sagen Sie es früh, damit es nicht wie eine nachträgliche Verhandlung wirkt.',
    },
  ],
  sources: [
    {
      text: 'Chabursky, S. & Langmeyer, A. (2025): Taschengeld und Gelderziehung. Eine Expertise mit aktualisierten Empfehlungen zum Thema Taschengeld. Deutsches Jugendinstitut, München.',
      url: 'https://www.dji.de/fileadmin/user_upload/dasdji/publikationen/Broschueren_2025/Expertise_Taschengeld_ChaburskyLangmeyer2025_aktualisiert.pdf',
    },
    {
      text: 'Levitt, S. D., List, J. A., Neckermann, S. & Sadoff, S. (2016): The Behavioralist Goes to School: Leveraging Behavioral Economics to Improve Educational Performance. American Economic Journal: Economic Policy, 8(4), 183–219.',
      url: 'https://doi.org/10.1257/pol.20130358',
    },
    {
      text: 'Fryer, R. G. (2011): Financial Incentives and Student Achievement: Evidence from Randomized Trials. The Quarterly Journal of Economics, 126(4), 1755–1798.',
      url: 'https://www.povertyactionlab.org/sites/default/files/research-paper/919_Financialincentives_and_student_Fryer_2011.pdf',
    },
    {
      text: 'Kultusministerkonferenz: Vereinbarung zur Gestaltung der gymnasialen Oberstufe und der Abiturprüfung (Beschluss vom 07.07.1972 i. d. F. vom 16.03.2023), Ziff. 9.2 und 9.4.',
      url: 'https://www.kmk.org/fileadmin/Dateien/pdf/PresseUndAktuelles/2023/2023_03_16-Vereinb-GymnOberstufe-Abitur.pdf',
    },
    {
      text: 'Studienkreis: „Zeugnistag: Eltern belohnen gute Leistungen“ – Pressemitteilung zur forsa-Umfrage unter rund 1.000 Eltern von Schulkindern zwischen 10 und 18 Jahren, 17.01.2018.',
      url: 'https://www.studienkreis.de/fileadmin/dateien/unternehmen/presse/pressemitteilungen/2018/studienkreis-nachhilfe-pressemitteilung-belohnung-zeugnis-2018.pdf',
    },
  ],
  related: ['zeugnisgeld', 'geschwister-gerechtigkeit', 'taschengeld-tabelle'],
}

export default body
