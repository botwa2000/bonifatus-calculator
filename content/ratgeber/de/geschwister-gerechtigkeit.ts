import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    '„Warum bekommt sie mehr als ich?“ Spätestens am Zeugnistag stellen Geschwister diese Frage – das ältere Kind, weil das jüngere für eine Zwei in Sachunterricht genauso viel bekommt wie es selbst für eine Zwei in Physik; das jüngere, weil das ältere mehr Fächer und damit mehr Geld hat. Und das Kind, das sich für eine Drei abgemüht hat, sieht zu, wie das Geschwisterkind mit links eine Eins nach Hause bringt.',
    'Dieser Ratgeber zeigt, was die Forschung über Gerechtigkeit zwischen Geschwistern weiß, warum gleiche Beträge nicht automatisch fair sind – und wie eine Regel aussieht, die alle Kinder als gerecht erleben können.',
  ],
  sections: [
    {
      id: 'kritikpunkt',
      heading: 'Der häufigste Einwand gegen Zeugnisgeld',
      blocks: [
        {
          type: 'p',
          text: 'Dass Geld für Noten unter Geschwistern Streit auslöst, ist keine Randerscheinung. Selbst die Pressemitteilung zur bekannten forsa-Umfrage zum Zeugnisgeld nennt als häufigen Kritikpunkt, dass Geld für Einsen und Zweien Ungerechtigkeit erzeuge – etwa gegenüber leistungsschwächeren Geschwistern.[^1] Der Einwand ist berechtigt, wenn eine Regel nur das Ergebnis belohnt. Er lässt sich aber auflösen.',
        },
      ],
    },
    {
      id: 'gleich-oder-gerecht',
      heading: 'Gleich ist nicht dasselbe wie gerecht',
      blocks: [
        {
          type: 'p',
          text: 'Eltern behandeln Geschwister fast nie völlig gleich – schon weil die Kinder unterschiedlich alt sind und Unterschiedliches brauchen. Die Familienforschung hat lange angenommen, dass jede Ungleichbehandlung dem benachteiligten Kind schadet. Genauere Studien zeigen ein differenzierteres Bild: Entscheidend ist, ob Kinder die Unterschiede als **gerechtfertigt** erleben.',
        },
        {
          type: 'p',
          text: 'In einer Studie um die Psychologin Amanda Kowal wurden 135 Kinder (im Mittel knapp 12 Jahre alt) und ihre älteren Geschwister getrennt dazu befragt, wie ihre Eltern Zuwendung und Kontrolle verteilen. Mehr Ungleichbehandlung bei Regeln und Kontrolle ging zwar mit mehr Verhaltensproblemen einher. Kinder, die eine Bevorzugung aber als fair beurteilten, hatten ein höheres Selbstwertgefühl und weniger Ängste und Rückzug.[^2] Die Autorinnen verweisen auf eine frühere Studie: Dort begründeten Kinder Unterschiede mit dem Alter, mit Bedürfnissen oder mit der Persönlichkeit – und wer sie für gerechtfertigt hielt, beschrieb die Beziehung zum Geschwisterkind positiver, auch bei deutlicher Ungleichbehandlung.[^2]',
        },
        {
          type: 'callout',
          text: '**Daraus folgt:** Nicht der gleiche Betrag macht eine Regel gerecht, sondern ein Grund, den jedes Kind nachvollziehen kann.',
        },
      ],
    },
    {
      id: 'alter',
      heading: 'Wie Kinder Gerechtigkeit sehen – je nach Alter',
      blocks: [
        {
          type: 'p',
          text: 'Was Kinder als fair empfinden, ändert sich mit dem Alter. Ein norwegisches Forschungsteam ließ Schülerinnen und Schüler Geld verdienen und anschließend verteilen. Das Ergebnis: Je weiter die Jugendlichen in die Pubertät kamen, desto eher hielten sie Unterschiede für fair, die auf eigener Leistung beruhten – nicht aber Unterschiede, die auf Glück beruhten.[^3]',
        },
        {
          type: 'p',
          text: 'Für Familien ist das aufschlussreich. Ein jüngeres Kind wünscht sich oft schlicht „gleich viel“. Ein älteres akzeptiert Unterschiede eher – aber nur, wenn sie verdient sind. Eine Begabung, die einem Kind das Lernen leicht macht, hat es sich nicht erarbeitet – sie liegt näher am Glück als an der Leistung. Eine Regel, die nur Einsen belohnt, belohnt deshalb in den Augen der Geschwister oft das Falsche.',
        },
      ],
    },
    {
      id: 'regel-oder-massstab',
      heading: 'Gleiche Regel oder gleicher Maßstab?',
      blocks: [
        {
          type: 'table',
          head: ['', 'Gleicher Betrag pro Note', 'Gleicher Maßstab für Anstrengung'],
          rows: [
            [
              'Prinzip',
              'Eine Eins ist bei allen gleich viel wert',
              'Verbesserung gegenüber dem eigenen letzten Zeugnis zählt',
            ],
            [
              'Vorteil',
              'Einfach, für alle sofort nachvollziehbar',
              'Jedes Kind kann gewinnen, auch ohne Bestnoten',
            ],
            [
              'Nachteil',
              'Belohnt Begabung, Schulform und Fächerzahl mit',
              'Anstrengung ist schwer zu messen',
            ],
          ],
        },
        {
          type: 'p',
          text: 'Der zweite Ansatz ist näher an dem, was Kinder als gerecht empfinden. Er hat aber eine Schwäche: Anstrengung sieht man nicht. Wenn Eltern nach Gefühl entscheiden, welches Kind sich „mehr bemüht“ hat, entsteht genau der Streit, den die Regel vermeiden sollte. Brauchbar sind deshalb Maßstäbe, die man ablesen kann:',
        },
        {
          type: 'ul',
          items: [
            '**Verbesserung:** jede Note, die gegenüber dem letzten Zeugnis besser geworden ist.',
            '**Gehaltene gute Noten:** damit das Kind, das schon gut ist, nicht leer ausgeht.',
            '**Vorher vereinbarte Ziele:** pro Kind und pro Fach, gemeinsam festgelegt und aufgeschrieben.',
          ],
        },
        {
          type: 'p',
          text: 'Viele Eltern denken ohnehin so. In der forsa-Umfrage würdigten 45 Prozent der Eltern besondere Anstrengungen und 33 Prozent eine deutliche Verbesserung.[^1]',
        },
      ],
    },
    {
      id: 'die-drei',
      heading: 'Warum eine Drei mehr wert sein kann als eine Eins',
      blocks: [
        {
          type: 'p',
          text: 'Das ist unsere Einschätzung, keine wissenschaftliche Norm: Ein Kind, das sich in Mathematik von einer Fünf auf eine Drei gearbeitet hat, hat in diesem Halbjahr mehr geleistet als eines, das seine Eins ohne Mühe gehalten hat. Dafür spricht auch die Motivationsforschung. In Experimenten mit Fünftklässlern hielten Kinder, die für ihre Anstrengung gelobt wurden, nach einem Rückschlag länger durch als Kinder, die für ihre Intelligenz gelobt wurden.[^4] Wer Anstrengung sichtbar anerkennt, sagt dem Kind: Es lohnt sich, dranzubleiben.',
        },
        {
          type: 'p',
          text: 'Das heißt nicht, dass die Eins nichts zählt. Eine faire Regel belohnt beides – das gute Ergebnis und den Weg dorthin.',
        },
      ],
    },
    {
      id: 'unterschiedliches-alter',
      heading: 'Unterschiedliches Alter, unterschiedliche Beträge',
      blocks: [
        {
          type: 'p',
          text: 'Beim Taschengeld ist es selbstverständlich, dass ältere Kinder mehr bekommen: Das Deutsche Jugendinstitut empfiehlt nach Alter gestaffelte Beträge und rät Familien mit vielen Geschwistern eher zum unteren Rand der Spannen.[^5] Beim Zeugnisbonus gilt dasselbe. Wenn sich der Betrag am Taschengeld orientiert, bekommt das ältere Kind mehr – mit einem Grund, den auch das jüngere versteht. Wie sich ein Bonus über die Schuljahre entwickeln kann, zeigt der Ratgeber [Zeugnisgeld nach Klasse](/ratgeber/zeugnisgeld-hoehe-nach-klasse).',
        },
      ],
    },
    {
      id: 'so-gehts',
      heading: 'So machen Sie die Regel für alle Kinder gerecht',
      blocks: [
        {
          type: 'ol',
          items: [
            '**Gleiche Prinzipien, angepasste Zahlen.** Für alle gelten dieselben Grundsätze; die Beträge richten sich nach Alter und Taschengeld.',
            '**Gründe erklären.** Sagen Sie jedem Kind, warum das ältere mehr bekommt oder warum Verbesserungen zählen. Verstandene Unterschiede belasten weniger.',
            '**Verbesserung belohnen,** nicht nur Bestnoten – mit einem ablesbaren Maßstab.',
            '**Keine Vergleiche am Küchentisch.** Jedes Zeugnis wird für sich besprochen, nicht im Wettbewerb mit dem Geschwisterkind.',
            '**Keine Abzüge.** Sonst wird das schwächere Kind doppelt bestraft.',
            '**Einmal im Jahr prüfen.** Zum neuen Schuljahr mit allen Kindern gemeinsam, ob die Regel noch passt.',
          ],
        },
        { type: 'cta' },
      ],
    },
  ],
  cta: {
    title: 'Eine Regel für alle Kinder durchrechnen',
    text: 'Geben Sie die Zeugnisse Ihrer Kinder nacheinander in den kostenlosen Noten-Belohnungsrechner ein – mit der jeweiligen Klassenstufe – und prüfen Sie, ob das Ergebnis für alle stimmig ist. Ohne Anmeldung.',
    button: 'Zum Noten-Belohnungsrechner',
    href: '/tools/grade-reward-calculator',
  },
  faqs: [
    {
      question: 'Sollen Geschwister für gleiche Noten gleich viel bekommen?',
      answer:
        'Nicht zwangsläufig. Gerecht ist eine Regel vor allem dann, wenn jedes Kind die Gründe für Unterschiede nachvollziehen kann – etwa das Alter. Studien zeigen, dass Kinder Ungleichbehandlung, die sie als gerechtfertigt erleben, deutlich besser verkraften.',
    },
    {
      question: 'Wie belohne ich ein Kind, das trotz Anstrengung schlechtere Noten hat?',
      answer:
        'Mit Verbesserungen und vorher vereinbarten Zielen statt nur mit Bestnoten. Ein Sprung von einer Fünf auf eine Drei ist eine Leistung. Dazu gehört konkretes Lob, das die Anstrengung benennt.',
    },
    {
      question: 'Was tun, wenn ein Kind sich ungerecht behandelt fühlt?',
      answer:
        'Das Gefühl ernst nehmen und die Gründe erklären. Wenn sich dabei herausstellt, dass die Regel tatsächlich nur ein Kind begünstigt, ist das ein guter Anlass, sie zum nächsten Halbjahr gemeinsam zu ändern – nicht rückwirkend.',
    },
    {
      question: 'Soll das ältere Kind mehr bekommen?',
      answer:
        'Wenn sich der Bonus am Taschengeld orientiert, ja – so wie ältere Kinder laut den DJI-Empfehlungen auch mehr Taschengeld bekommen. Wichtig ist, dass das jüngere weiß, dass es mit dem Alter ebenfalls mehr bekommt.',
    },
  ],
  sources: [
    {
      text: 'Studienkreis: „Zeugnistag: Eltern belohnen gute Leistungen“ – Pressemitteilung zur forsa-Umfrage unter rund 1.000 Eltern von Schulkindern zwischen 10 und 18 Jahren, 17.01.2018.',
      url: 'https://www.studienkreis.de/fileadmin/dateien/unternehmen/presse/pressemitteilungen/2018/studienkreis-nachhilfe-pressemitteilung-belohnung-zeugnis-2018.pdf',
    },
    {
      text: 'Kowal, A., Kramer, L., Krull, J. L. & Crick, N. R. (2002): Children’s perceptions of the fairness of parental preferential treatment and their socioemotional well-being. Journal of Family Psychology, 16(3), 297–306.',
      url: 'https://doi.org/10.1037/0893-3200.16.3.297',
    },
    {
      text: 'Almås, I., Cappelen, A. W., Sørensen, E. Ø. & Tungodden, B. (2010): Fairness and the Development of Inequality Acceptance. Science, 328(5982), 1176–1178.',
      url: 'https://doi.org/10.1126/science.1187300',
    },
    {
      text: 'Mueller, C. M. & Dweck, C. S. (1998): Praise for intelligence can undermine children’s motivation and performance. Journal of Personality and Social Psychology, 75(1), 33–52.',
      url: 'https://doi.org/10.1037/0022-3514.75.1.33',
    },
    {
      text: 'Chabursky, S. & Langmeyer, A. (2025): Taschengeld und Gelderziehung. Eine Expertise mit aktualisierten Empfehlungen zum Thema Taschengeld. Deutsches Jugendinstitut, München.',
      url: 'https://www.dji.de/fileadmin/user_upload/dasdji/publikationen/Broschueren_2025/Expertise_Taschengeld_ChaburskyLangmeyer2025_aktualisiert.pdf',
    },
  ],
  related: ['zeugnisgeld', 'zeugnisgeld-hoehe-nach-klasse', 'belohnen-ohne-geld'],
}

export default body
