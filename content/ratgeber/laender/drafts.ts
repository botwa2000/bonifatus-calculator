import type { LandDraft } from './types'

// Halbjahreszeugnis 2027 per Land. Every date comes from an official source
// (./sources.ts); researched 2026-11-27. Ferien: KMK table for 2026/27 (Stand 09.10.2025),
// cross-checked against the Länder documents where we cite them.
// Where no official date exists, the page says so instead of estimating.

const ZG = '/ratgeber/zeugnis-gespraech-fuehren'

export const LAND_DRAFTS: LandDraft[] = [
  {
    slug: 'baden-wuerttemberg',
    name: 'Baden-Württemberg',
    abbr: 'BW',
    description:
      'Halbjahreszeugnis Baden-Württemberg 2027: zwischen 1. und 10. Februar, den Tag legt die Schule fest. Warum die meisten Kinder eine Halbjahresinformation bekommen und wann die nächsten Ferien sind.',
    facts: {
      zeugnis: '1. bis 10. Februar 2027 (Tag legt die Schule fest)',
      ferien: 'keine Winterferien; Osterferien 30. März – 3. April',
    },
    intro: [
      'In Baden-Württemberg gibt es keinen landesweiten Zeugnistag. Die Notenbildungsverordnung gibt einen Zeitraum vor, in dem die Halbjahresbilanz ausgegeben wird – den genauen Tag bestimmt jede Schule selbst.[^bw_nvo]',
      'Und noch etwas ist anders als in den meisten Ländern: Ein Halbjahreszeugnis im engeren Sinn bekommen nur Abschlussklassen.[^bw_nvo]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Halbjahresbilanz wird **in der Regel zwischen dem 1. und dem 10. Februar 2027** ausgegeben; innerhalb dieses Zeitraums legt die Schule den Tag fest.[^bw_nvo] Zwei Geschwister an verschiedenen Schulen können ihre Zeugnisse also an unterschiedlichen Tagen bekommen.',
      },
      {
        type: 'p',
        text: 'Den genauen Termin erfahren Sie von der Schule Ihres Kindes.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Baden-Württemberg hat 2027 **keine Winterferien**. Nach den Weihnachtsferien (bis 9. Januar) geht der Unterricht bis Ostern durch: frei ist am 25. März, die Osterferien dauern vom 30. März bis 3. April 2027.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Halbjahresinformation statt Halbjahreszeugnis',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Abschlussklassen** erhalten ein Halbjahreszeugnis.[^bw_nvo]',
            '**Alle anderen Klassen**, auch die Klasse 4 der Grundschule, erhalten eine **Halbjahresinformation**.[^bw_nvo] Für Eltern ist sie die gleiche Zwischenbilanz – nur unter anderem Namen.',
            'Weil der Tag von Schule zu Schule verschieden ist, lohnt sich ein Blick in den Terminplan, bevor Sie fürs Zeugnisgespräch einen Nachmittag freihalten.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Ohne Ferien danach kommt das Gespräch über die Halbjahresinformation mitten in die Schulwoche – planen Sie dafür am besten das folgende Wochenende ein.',
    faqs: [
      {
        question: 'Wann gibt es in Baden-Württemberg 2027 Halbjahreszeugnisse?',
        answer:
          'In der Regel zwischen dem 1. und dem 10. Februar 2027. Den genauen Tag legt die Schule fest; einen landesweit einheitlichen Termin gibt es nicht.',
      },
      {
        question: 'Bekommt mein Kind ein Halbjahreszeugnis oder eine Halbjahresinformation?',
        answer:
          'Ein Halbjahreszeugnis bekommen nur Abschlussklassen. Alle anderen Klassen, auch die Klasse 4 der Grundschule, erhalten eine Halbjahresinformation.',
      },
      {
        question: 'Hat Baden-Württemberg 2027 Winterferien?',
        answer:
          'Nein. Die nächsten Ferien nach Weihnachten sind die Osterferien vom 30. März bis 3. April 2027; zusätzlich ist der 25. März frei.',
      },
    ],
  },
  {
    slug: 'bayern',
    name: 'Bayern',
    abbr: 'BY',
    description:
      'Zwischenzeugnis Bayern 2027: Freitag, 19. Februar – eine Woche nach den Frühjahrsferien. Klasse 4: Zwischeninformation am 22. Januar, Übertrittszeugnis am 3. Mai. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 19. Februar 2027 (Zwischenzeugnis)',
      ferien: 'Frühjahrsferien 8. – 12. Februar 2027',
    },
    intro: [
      'In Bayern heißt das Halbjahreszeugnis **Zwischenzeugnis** – und es kommt später als fast überall sonst: am **Freitag, 19. Februar 2027**.[^by_km]',
      'Für die Jahrgangsstufe 4 gilt ein eigener Kalender, weil dort der Übertritt an die weiterführende Schule vorbereitet wird.[^by_km]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Das Kultusministerium legt die Termine für alle Schulen fest. Für das Schuljahr 2026/27 nennt es den **19. Februar 2027** als Tag des Zwischenzeugnisses.[^by_km]',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Die Ferien im Februar heißen in Bayern Frühjahrsferien und liegen 2027 vom **8. bis 12. Februar** – also eine Woche **vor** dem Zwischenzeugnis.[^kmk] Anders als in vielen Ländern beginnen die Ferien hier nicht mit dem Zeugnis, sondern das Zeugnis folgt auf die Ferien.',
      },
      {
        type: 'p',
        text: 'Die Osterferien dauern vom 22. März bis 2. April 2027.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Jahrgangsstufe 4: Zwischeninformation und Übertritt',
      blocks: [
        {
          type: 'ul',
          items: [
            'Viertklässler bekommen **kein Zwischenzeugnis**, sondern schon am **22. Januar 2027** eine **Zwischeninformation**.[^by_km]',
            'Das **Übertrittszeugnis**, das über den Weg an Gymnasium, Realschule oder Mittelschule mitentscheidet, folgt am **3. Mai 2027**.[^by_km]',
            'Zwischen Januar und Mai liegen damit gut drei Monate – Zeit, in der sich Noten noch bewegen können. Die Zwischeninformation ist ein Stand, keine Entscheidung.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Weil die Frühjahrsferien vor dem Zeugnis liegen, fällt das Gespräch in die Schulzeit; ein ruhiger Abend am Zeugnisfreitag oder das Wochenende danach eignet sich gut.',
    faqs: [
      {
        question: 'Wann gibt es 2027 in Bayern Zwischenzeugnisse?',
        answer:
          'Am Freitag, 19. Februar 2027. In der Jahrgangsstufe 4 gibt es stattdessen schon am 22. Januar 2027 eine Zwischeninformation.',
      },
      {
        question: 'Wann ist das Übertrittszeugnis 2027?',
        answer:
          'Am 3. Mai 2027. Es betrifft die Jahrgangsstufe 4 und ist die Grundlage für den Übertritt an die weiterführende Schule.',
      },
      {
        question: 'Wann sind in Bayern 2027 Faschings- bzw. Frühjahrsferien?',
        answer:
          'Vom 8. bis 12. Februar 2027 – eine Woche vor dem Zwischenzeugnis. Die Osterferien folgen vom 22. März bis 2. April.',
      },
    ],
  },
  {
    slug: 'berlin',
    name: 'Berlin',
    abbr: 'BE',
    description:
      'Halbjahreszeugnis Berlin 2027: Freitag, 29. Januar, Unterricht nur bis zur 3. Stunde. Danach Winterferien vom 1. bis 6. Februar. Mit Sonderregel für die Oberstufe und amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'Winterferien 1. – 6. Februar 2027',
    },
    intro: [
      'In Berlin gibt es die Halbjahreszeugnisse am **Freitag, 29. Januar 2027**. Der Tag steht in der Ferienordnung des Landes, gilt also für alle Schulen.[^be_ferien]',
      'Gleich danach beginnen die Winterferien – das Zeugnis kommt mit einer Woche Abstand zum Schulalltag nach Hause.[^kmk]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Am Zeugnistag **endet der Unterricht nach der dritten Stunde**.[^be_ferien] Rechnen Sie also damit, dass Ihr Kind früher zu Hause ist als sonst.',
      },
      {
        type: 'p',
        text: 'Eine Ausnahme gilt für die **Kursphase der gymnasialen Oberstufe**: Dort endet das Halbjahr schon vor den Weihnachtsferien, und die Zeugnisse tragen das Datum 22. Dezember 2026 oder 6. Januar 2027.[^be_ferien]',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Die Winterferien dauern vom **1. bis 6. Februar 2027**.[^kmk] Die Osterferien folgen vom 22. März bis 2. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Berlin anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Kurzer Schultag:** Unterricht nur bis zur dritten Stunde.[^be_ferien]',
            '**Oberstufe:** In der Kursphase gibt es das Halbjahreszeugnis schon im Dezember beziehungsweise mit dem Datum 6. Januar.[^be_ferien]',
            '**Ferien direkt danach:** Wer über das Zeugnis sprechen will, hat eine Woche ohne Schule und Hausaufgaben dafür.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Die Winterferienwoche ist ein guter Rahmen: Das Gespräch muss nicht am Freitagmittag stattfinden, sondern kann ein, zwei Tage warten.',
    faqs: [
      {
        question: 'Wann gibt es in Berlin 2027 Halbjahreszeugnisse?',
        answer:
          'Am Freitag, 29. Januar 2027. Der Unterricht endet an diesem Tag nach der dritten Stunde. In der Kursphase der Oberstufe sind die Zeugnisse auf den 22. Dezember 2026 oder den 6. Januar 2027 datiert.',
      },
      {
        question: 'Wann sind in Berlin 2027 Winterferien?',
        answer: 'Vom 1. bis 6. Februar 2027, direkt nach dem Zeugnistag.',
      },
      {
        question: 'Ist der Zeugnistag in Berlin ein ganzer Schultag?',
        answer:
          'Nein. Laut Ferienordnung endet der Unterricht am 29. Januar 2027 nach der dritten Stunde.',
      },
    ],
  },
  {
    slug: 'brandenburg',
    name: 'Brandenburg',
    abbr: 'BB',
    description:
      'Halbjahreszeugnis Brandenburg 2027: Freitag, 29. Januar – am selben Tag Grundschulgutachten und Anmeldeformulare für Klasse 7. Winterferien 1. bis 6. Februar. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'Winterferien 1. – 6. Februar 2027',
    },
    intro: [
      'In Brandenburg gibt es die Halbjahreszeugnisse am **Freitag, 29. Januar 2027**.[^bb_kalender]',
      'Für Familien mit einem Kind in Klasse 6 ist der Tag besonders wichtig: Er ist zugleich der Startpunkt für den Übergang an die weiterführende Schule.[^bb_kalender]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Der Schuljahreskalender des Bildungsministeriums nennt den 29. Januar für drei Dinge gleichzeitig: die Ausgabe der **Grundschulgutachten**, der **Halbjahreszeugnisse** und der **Anmeldeformulare für den Übergang in Klasse 7**.[^bb_kalender]',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Direkt danach folgen die Winterferien vom **1. bis 6. Februar 2027**.[^kmk] Die Osterferien dauern vom 22. März bis 3. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Klasse 6: Zeugnis, Gutachten und Anmeldung an einem Tag',
      blocks: [
        {
          type: 'ul',
          items: [
            'Eltern von Sechstklässlern bekommen am Zeugnistag neben dem Zeugnis das **Grundschulgutachten** und die **Formulare für die Anmeldung zur Klasse 7**.[^bb_kalender]',
            'Die Winterferien danach geben Zeit, Gutachten und Zeugnis in Ruhe zu lesen, bevor die Anmeldung ansteht.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Gerade in Klasse 6 lohnt es sich, das Gespräch über Zeugnis und Gutachten in die Ferienwoche zu legen statt auf den Freitagnachmittag.',
    faqs: [
      {
        question: 'Wann gibt es in Brandenburg 2027 Halbjahreszeugnisse?',
        answer: 'Am Freitag, 29. Januar 2027.',
      },
      {
        question: 'Wann bekommen Eltern in Brandenburg das Grundschulgutachten?',
        answer:
          'Am selben Tag wie das Halbjahreszeugnis, am 29. Januar 2027 – zusammen mit den Anmeldeformularen für den Übergang in Klasse 7.',
      },
      {
        question: 'Wann sind in Brandenburg 2027 Winterferien?',
        answer: 'Vom 1. bis 6. Februar 2027.',
      },
    ],
  },
  {
    slug: 'bremen',
    name: 'Bremen',
    abbr: 'HB',
    description:
      'Halbjahreszeugnis Bremen 2027: Freitag, 29. Januar, festgelegt in der Ferienverordnung für Bremen und Bremerhaven. Danach zwei freie Tage am 1. und 2. Februar. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'Winterferien 1. – 2. Februar 2027',
    },
    intro: [
      'In Bremen und Bremerhaven gibt es die Halbjahreszeugnisse am **Freitag, 29. Januar 2027**. Der Termin steht nicht in einem Rundschreiben, sondern in der Ferienverordnung selbst.[^hb_ferien]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Verordnung über die Ferien für die Schulen der Stadtgemeinden Bremen und Bremerhaven legt den Zeugnistag für die Schuljahre bis 2029/30 fest; für 2026/27 ist es der 29. Januar.[^hb_ferien] Er gilt damit in beiden Städten gleich.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Die Winterferien sind kurz: **Montag, 1., und Dienstag, 2. Februar 2027**.[^kmk] Mit dem Wochenende ergibt das vier freie Tage direkt nach dem Zeugnis. Die Osterferien dauern vom 22. März bis 3. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Bremen anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Termin per Verordnung:** Der Zeugnistag ist für mehrere Schuljahre im Voraus rechtlich festgelegt.[^hb_ferien]',
            '**Langes Wochenende:** Zwischen Zeugnis und Unterricht liegen vier Tage – genug für ein Gespräch, aber keine ganze Ferienwoche.',
            '**Lange Weihnachtsferien davor:** Sie dauern bis zum 9. Januar 2027;[^kmk] bis zum Zeugnis bleiben danach drei Schulwochen.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Das lange Wochenende nach dem 29. Januar ist der natürliche Moment für das Zeugnisgespräch.',
    faqs: [
      {
        question: 'Wann gibt es in Bremen 2027 Halbjahreszeugnisse?',
        answer:
          'Am Freitag, 29. Januar 2027 – in Bremen und Bremerhaven gleichermaßen, festgelegt in der Ferienverordnung.',
      },
      {
        question: 'Wann sind in Bremen 2027 Winterferien?',
        answer: 'Am Montag, 1., und Dienstag, 2. Februar 2027.',
      },
    ],
  },
  {
    slug: 'hamburg',
    name: 'Hamburg',
    abbr: 'HH',
    description:
      'Halbjahreszeugnis Hamburg 2027: Einen landesweiten Zeugnistag gibt es nicht. Die Halbjahrespause ist am Freitag, 29. Januar; den Tag der Zeugnisse nennt die Schule. Ehrlich erklärt, mit Quellen.',
    facts: {
      zeugnis: 'kein landesweiter Termin – Halbjahrespause Fr, 29. Januar 2027',
      ferien: 'keine Winterferien; Frühjahrsferien 1. – 12. März 2027',
    },
    intro: [
      'Für Hamburg gibt es **keinen landesweit veröffentlichten Zeugnistag** – und wir nennen deshalb auch keinen. Was feststeht, ist die **Halbjahrespause am Freitag, 29. Januar 2027**, ein unterrichtsfreier Tag zwischen den beiden Schulhalbjahren.[^hh_ferien]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Hamburger Ferienordnung legt für jedes Schuljahr bis 2029/30 eine Halbjahrespause fest, aber keinen Zeugnistag.[^hh_ferien] Den Tag, an dem die Halbjahreszeugnisse ausgegeben werden, bestimmt die Schule.',
      },
      {
        type: 'p',
        text: '**Wann wird es bekannt?** Eine landesweite Festlegung hat die Schulbehörde weder für 2026/27 noch für die Vorjahre veröffentlicht, soweit wir es prüfen konnten. Im vergangenen Schuljahr endete das Halbjahr mit der Ausgabe der Halbjahreszeugnisse vor der Halbjahrespause am 30. Januar 2026.[^hh_elternkammer][^hh_ferien] Den Tag für 2027 erfahren Sie von der Schule, zum Beispiel aus ihrem Terminplan.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Hamburg hat **keine Winterferien**, sondern nur die eintägige Halbjahrespause am 29. Januar.[^hh_ferien] Die nächsten Ferien sind die **Frühjahrsferien vom 1. bis 12. März 2027**.[^hh_ferien]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Hamburg anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Kein amtlicher Zeugnistag:** Ein festes Datum für Hamburg ist deshalb immer eine Schätzung – oder die Halbjahrespause.',
            '**Halbjahrespause statt Ferien:** Ein freier Freitag, danach beginnt das zweite Halbjahr.[^hh_ferien]',
            '**Frühjahrsferien schon Anfang März:** Zwischen Zeugnis und den nächsten Ferien liegen gut vier Schulwochen.[^hh_ferien]',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Fragen Sie früh im Januar nach dem Zeugnistag der Schule; die Halbjahrespause am 29. Januar bietet sich danach für das Gespräch an.',
    faqs: [
      {
        question: 'Wann gibt es in Hamburg 2027 Halbjahreszeugnisse?',
        answer:
          'Einen landesweit festgelegten Tag gibt es nicht; den Tag bestimmt die Schule. Fest steht die Halbjahrespause am Freitag, 29. Januar 2027. Im Jahr 2026 wurden die Zeugnisse zum Ende des Halbjahres vor der Halbjahrespause ausgegeben.',
      },
      {
        question: 'Hat Hamburg 2027 Winterferien?',
        answer:
          'Nein. Es gibt nur die Halbjahrespause am 29. Januar 2027. Die Frühjahrsferien dauern vom 1. bis 12. März 2027.',
      },
      {
        question: 'Wo erfahre ich den Zeugnistag in Hamburg?',
        answer:
          'Bei der Schule Ihres Kindes, zum Beispiel aus dem Terminplan des Schuljahres oder einem Elternbrief. Eine landesweite Veröffentlichung haben wir nicht gefunden.',
      },
    ],
  },
  {
    slug: 'hessen',
    name: 'Hessen',
    abbr: 'HE',
    description:
      'Halbjahreszeugnis Hessen 2027: in der Regel Freitag, 29. Januar – nach der Regel „letzter Unterrichtstag vor dem ersten Montag im Februar“. Keine Winterferien, lange Weihnachtsferien. Mit Quellen.',
    facts: {
      zeugnis: 'in der Regel Freitag, 29. Januar 2027',
      ferien: 'keine Winterferien; Osterferien 22. März – 2. April',
    },
    intro: [
      'Hessen legt keinen festen Kalendertag fest, sondern eine **Regel**: Das Halbjahreszeugnis gibt es am letzten Unterrichtstag vor dem ersten Montag im Februar.[^he_vogsv] 2027 ist das **Freitag, der 29. Januar**.',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Regel steht in der Verordnung zur Gestaltung des Schulverhältnisses.[^he_vogsv] Der erste Montag im Februar 2027 ist der 1. Februar; der letzte Unterrichtstag davor ist der 29. Januar.',
      },
      {
        type: 'p',
        text: 'Eine Ausnahme ist vorgesehen: In Jahren, in denen die Sommerferien früh beginnen, darf das Kultusministerium einen früheren landeseinheitlichen Termin festlegen.[^he_vogsv] 2027 beginnen die Sommerferien schon am 28. Juni.[^he_ferien] Eine solche Festlegung für 2026/27 haben wir bis zum 27. November 2026 nicht gefunden – deshalb „in der Regel“.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Hessen hat **keine Winterferien**.[^kmk] Dafür sind die Weihnachtsferien lang: Sie dauern bis zum **12. Januar 2027**.[^kmk] Bis zum Zeugnis bleiben danach nur gut zweieinhalb Schulwochen. Die Osterferien folgen vom 22. März bis 2. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Hessen anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Regel statt Datum:** Der Termin ergibt sich jedes Jahr neu aus dem Kalender.[^he_vogsv]',
            '**Möglicher früherer Termin:** Bei frühen Sommerferien kann das Ministerium den Tag vorziehen – achten Sie auf Mitteilungen der Schule.[^he_vogsv]',
            '**Kurzer Januar:** Nach Weihnachtsferien bis zum 12. Januar beruht das Halbjahreszeugnis vor allem auf den Leistungen vor Weihnachten.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Ohne Ferien nach dem Zeugnis bietet sich das Wochenende vom 30. und 31. Januar für das Gespräch an.',
    faqs: [
      {
        question: 'Wann gibt es in Hessen 2027 Halbjahreszeugnisse?',
        answer:
          'In der Regel am Freitag, 29. Januar 2027 – dem letzten Unterrichtstag vor dem ersten Montag im Februar. Bei frühen Sommerferien darf das Kultusministerium einen früheren Termin festlegen; für 2026/27 haben wir keine solche Festlegung gefunden.',
      },
      {
        question: 'Hat Hessen 2027 Winterferien?',
        answer:
          'Nein. Die Weihnachtsferien dauern bis zum 12. Januar 2027, die nächsten Ferien sind die Osterferien vom 22. März bis 2. April.',
      },
      {
        question: 'Wann ist in Hessen das Halbjahresende 2027?',
        answer:
          'Das erste Halbjahr endet mit dem Zeugnistag, in der Regel am Freitag, 29. Januar 2027; das zweite beginnt am Montag, 1. Februar.',
      },
    ],
  },
  {
    slug: 'mecklenburg-vorpommern',
    name: 'Mecklenburg-Vorpommern',
    abbr: 'MV',
    description:
      'Halbjahreszeugnis Mecklenburg-Vorpommern 2027: Ein landesweiter Termin ist nicht veröffentlicht; den Tag nennt die Schule. Winterferien 8. bis 19. Februar. Ehrlich erklärt, mit amtlichen Quellen.',
    facts: {
      zeugnis: 'kein landesweiter Termin veröffentlicht',
      ferien: 'Winterferien 8. – 19. Februar 2027',
    },
    intro: [
      'Für Mecklenburg-Vorpommern haben wir **keinen landesweit festgelegten Zeugnistag** gefunden – und nennen deshalb auch keinen. Im Internet kursierende Daten widersprechen sich.',
      'Fest stehen die Winterferien: **8. bis 19. Februar 2027**.[^mv_ferien][^kmk]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Weder die Ferientermine der Landesregierung noch die Veröffentlichungen des Bildungsministeriums, die wir geprüft haben, nennen einen Ausgabetag für die Halbjahreszeugnisse.[^mv_ferien]',
      },
      {
        type: 'p',
        text: '**Wann wird es bekannt?** Eine landesweite Festlegung haben wir weder für 2026/27 noch für frühere Schuljahre gefunden. Den Termin teilt die Schule mit – fragen Sie im Januar nach, wenn er noch nicht im Terminplan steht.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Die Winterferien dauern zwei Wochen, vom **8. bis 19. Februar 2027**.[^mv_ferien][^kmk] Davor liegen nach den Weihnachtsferien (bis 2. Januar) fünf Schulwochen. Die Osterferien folgen vom 24. März bis 2. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Mecklenburg-Vorpommern anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Späte und lange Winterferien:** Zwei Wochen ab dem 8. Februar – später als in den meisten Ländern.[^kmk]',
            '**Kein amtlicher Zeugnistag:** Ein festes Datum für MV ist eine Schätzung. Verlässlich ist die Auskunft der Schule.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Zwei Wochen Winterferien geben viel Raum: Das Zeugnisgespräch muss nicht am Zeugnistag stattfinden.',
    faqs: [
      {
        question: 'Wann gibt es in Mecklenburg-Vorpommern 2027 Halbjahreszeugnisse?',
        answer:
          'Einen landesweit veröffentlichten Termin haben wir nicht gefunden; den Tag nennt die Schule. Die Winterferien beginnen am Montag, 8. Februar 2027.',
      },
      {
        question: 'Wann sind in Mecklenburg-Vorpommern 2027 Winterferien?',
        answer: 'Vom 8. bis 19. Februar 2027.',
      },
    ],
  },
  {
    slug: 'niedersachsen',
    name: 'Niedersachsen',
    abbr: 'NI',
    description:
      'Halbjahreszeugnis Niedersachsen 2027: Freitag, 29. Januar, laut Ferienordnung des Kultusministeriums. Danach Halbjahresferien am 1. und 2. Februar. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'Halbjahresferien 1. – 2. Februar 2027',
    },
    intro: [
      'In Niedersachsen gibt es die Halbjahreszeugnisse am **Freitag, 29. Januar 2027**. Der Termin steht im Ferienerlass des Kultusministeriums.[^ni_ferien]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Ferienordnung für die Schuljahre 2024/25 bis 2029/30 legt neben den Ferien auch den Zeugnistag fest; für 2026/27 ist es der 29. Januar.[^ni_ferien]',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'In Niedersachsen heißen die freien Tage im Februar **Halbjahresferien**: **Montag, 1., und Dienstag, 2. Februar 2027**.[^ni_ferien] Mit dem Wochenende sind das vier freie Tage nach dem Zeugnis. Die Osterferien dauern vom 22. März bis 3. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Niedersachsen anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Halbjahresferien statt Winterferien:** Zwei Tage, direkt nach dem Zeugnis.[^ni_ferien]',
            '**Lange Weihnachtsferien:** Sie dauern bis zum 9. Januar 2027;[^kmk] danach bleiben drei Schulwochen bis zum Zeugnis.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Das lange Wochenende mit den Halbjahresferien ist ein guter Moment für das Zeugnisgespräch.',
    faqs: [
      {
        question: 'Wann gibt es in Niedersachsen 2027 Halbjahreszeugnisse?',
        answer: 'Am Freitag, 29. Januar 2027.',
      },
      {
        question: 'Wann sind in Niedersachsen 2027 Halbjahresferien?',
        answer: 'Am Montag, 1., und Dienstag, 2. Februar 2027.',
      },
    ],
  },
  {
    slug: 'nordrhein-westfalen',
    name: 'Nordrhein-Westfalen',
    abbr: 'NRW',
    description:
      'Halbjahreszeugnis NRW 2027: Freitag, 12. Februar; Grundschulen zwischen 8. und 12. Februar. Klasse 4: Schulformempfehlung mit dem Halbjahreszeugnis. Blauer Brief, Förderempfehlung – mit Schulgesetz.',
    facts: {
      zeugnis: 'Freitag, 12. Februar 2027 (Grundschulen 8. – 12. Februar)',
      ferien: 'keine Winterferien; Osterferien 22. März – 3. April',
    },
    intro: [
      'In Nordrhein-Westfalen gibt es die Halbjahreszeugnisse am **Freitag, 12. Februar 2027** – deutlich später als in den meisten Ländern.[^nw_bass]',
      'Für Familien mit einem Kind in Klasse 4 hat dieses Zeugnis besonderes Gewicht: Mit ihm kommt die Empfehlung für die weiterführende Schule.[^nw_schulg]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Das Schulministerium legt die Termine für die Aushändigung der Halbjahreszeugnisse zusammen mit der Ferienordnung fest. Für 2026/27: **Freitag, 12. Februar 2027**; **Grundschulen** geben die Zeugnisse **zwischen dem 8. und 12. Februar** aus.[^nw_bass]',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'NRW hat **keine Winterferien**.[^kmk] Nach den Weihnachtsferien (bis 6. Januar) geht der Unterricht bis zu den Osterferien vom 22. März bis 3. April 2027 durch.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was das Schulgesetz NRW zum Halbjahreszeugnis sagt',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Klasse 4:** Mit dem Halbjahreszeugnis gibt die Grundschule eine begründete Empfehlung für die weiterführende Schulform; die Entscheidung treffen danach die Eltern nach Beratung.[^nw_schulg]',
            '**Gefährdete Versetzung:** Zum Ende des Halbjahres gibt es eine individuelle Lern- und Förderempfehlung. Reichen die Leistungen in einem Fach anders als im letzten Zeugnis nicht mehr aus, werden die Eltern schriftlich benachrichtigt – der „blaue Brief“.[^nw_schulg]',
            '**Versetzung erst im Sommer:** Darüber entscheiden die Lehrkräfte, die das Kind im zweiten Halbjahr unterrichtet haben.[^nw_schulg]',
            '**Nachfragen erlaubt:** Lehrkräfte erläutern auf Wunsch ihre Bewertungsmaßstäbe und den Leistungsstand.[^nw_schulg44]',
          ],
        },
      ],
    },
    naechsteSchritte:
      'In Klasse 4 kommt mit dem Zeugnis auch die Schulformempfehlung – planen Sie für Zeugnis und Empfehlung ein eigenes Gespräch und nutzen Sie das Beratungsangebot der Schule.',
    faqs: [
      {
        question: 'Wann gibt es in NRW 2027 Halbjahreszeugnisse?',
        answer:
          'Am Freitag, 12. Februar 2027. Grundschulen geben sie zwischen dem 8. und 12. Februar aus.',
      },
      {
        question: 'Wann kommt in NRW die Schulformempfehlung?',
        answer:
          'Mit dem Halbjahreszeugnis der Klasse 4. Die Entscheidung über die weiterführende Schule treffen danach die Eltern nach Beratung.',
      },
      {
        question: 'Was ist der blaue Brief in NRW?',
        answer:
          'Die schriftliche Benachrichtigung der Eltern, wenn die Leistungen in einem Fach anders als im letzten Zeugnis nicht mehr ausreichen und die Versetzung gefährdet ist. Er ist eine Warnung, keine Entscheidung.',
      },
    ],
  },
  {
    slug: 'rheinland-pfalz',
    name: 'Rheinland-Pfalz',
    abbr: 'RLP',
    description:
      'Halbjahreszeugnis Rheinland-Pfalz 2027: Freitag, 29. Januar – nach der Regel „letzter Freitag im Januar“ der Schulordnung. Keine Winterferien, Osterferien ab 22. März. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'keine Winterferien; Osterferien 22. März – 2. April',
    },
    intro: [
      'In Rheinland-Pfalz gibt es die Halbjahreszeugnisse am **Freitag, 29. Januar 2027**. Das Datum folgt aus einer festen Regel: dem **letzten Freitag im Januar**.[^rp_schulo]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Regel steht in der Schulordnung für die Grundschulen und ebenso in der Übergreifenden Schulordnung für die weiterführenden Schulen.[^rp_schulo] Sie gilt damit für Grundschule, Realschule plus, IGS und Gymnasium gleichermaßen – Geschwister bekommen ihre Zeugnisse am selben Tag.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Rheinland-Pfalz hat **keine Winterferien**.[^kmk] Nach den Weihnachtsferien (bis 8. Januar) sind die nächsten Ferien die Osterferien vom **22. März bis 2. April 2027**.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Rheinland-Pfalz anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Feste Regel für alle Schularten:** Letzter Freitag im Januar – für Grund- und weiterführende Schulen.[^rp_schulo]',
            '**Kein Ferienpuffer:** Am Montag nach dem Zeugnis beginnt das zweite Halbjahr.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Ohne Ferien danach bietet sich das Wochenende vom 30. und 31. Januar für das Zeugnisgespräch an.',
    faqs: [
      {
        question: 'Wann gibt es in Rheinland-Pfalz 2027 Halbjahreszeugnisse?',
        answer:
          'Am Freitag, 29. Januar 2027 – dem letzten Freitag im Januar, wie es die Schulordnungen vorsehen.',
      },
      {
        question: 'Hat Rheinland-Pfalz 2027 Winterferien?',
        answer: 'Nein. Die nächsten Ferien sind die Osterferien vom 22. März bis 2. April 2027.',
      },
    ],
  },
  {
    slug: 'saarland',
    name: 'Saarland',
    abbr: 'SL',
    description:
      'Halbjahreszeugnis Saarland 2027: Freitag, 29. Januar an Gymnasien und Gemeinschaftsschulen, Oberstufe schon am 18. Dezember 2026. Winterferien 8. bis 12. Februar. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027 (Gymnasien, Gemeinschaftsschulen)',
      ferien: 'Winterferien 8. – 12. Februar 2027',
    },
    intro: [
      'Im Saarland gibt es die Halbjahreszeugnisse an **Gymnasien und Gemeinschaftsschulen ab Klasse 5** am **Freitag, 29. Januar 2027**.[^sl_termine]',
      'Für die Hauptphase der gymnasialen Oberstufe gilt ein früherer Termin.[^sl_termine]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Terminplanung des Bildungsministeriums für Gymnasien und Gemeinschaftsschulen nennt den 29. Januar 2027; in der **Hauptphase der Oberstufe** gibt es die Halbjahreszeugnisse schon am **18. Dezember 2026**.[^sl_termine]',
      },
      {
        type: 'p',
        text: 'Für **Grundschulen** nennt diese Terminplanung keinen Tag. Fragen Sie dort bei der Schule nach.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Die Winterferien liegen nicht direkt nach dem Zeugnis, sondern eine Woche später: **8. bis 12. Februar 2027**.[^kmk] Die Osterferien dauern vom 30. März bis 9. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was im Saarland anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Oberstufe vor Weihnachten:** In der Hauptphase kommt das Halbjahreszeugnis am 18. Dezember 2026.[^sl_termine]',
            '**Eine Schulwoche Puffer:** Zwischen Zeugnis (29. Januar) und Winterferien (ab 8. Februar) liegt noch eine Unterrichtswoche – Zeit, um mit Lehrkräften zu sprechen, bevor die Ferien beginnen.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Die Schulwoche zwischen Zeugnis und Winterferien eignet sich gut für ein Gespräch mit der Lehrkraft, wenn Fragen offen sind.',
    faqs: [
      {
        question: 'Wann gibt es im Saarland 2027 Halbjahreszeugnisse?',
        answer:
          'An Gymnasien und Gemeinschaftsschulen ab Klasse 5 am Freitag, 29. Januar 2027; in der Hauptphase der Oberstufe schon am 18. Dezember 2026. Für Grundschulen nennt die Terminplanung keinen Tag.',
      },
      {
        question: 'Wann sind im Saarland 2027 Winterferien?',
        answer: 'Vom 8. bis 12. Februar 2027.',
      },
    ],
  },
  {
    slug: 'sachsen',
    name: 'Sachsen',
    abbr: 'SN',
    description:
      'Halbjahreszeugnis Sachsen 2027: Freitag, 5. Februar – Halbjahreszeugnisse und Halbjahresinformationen, in Klasse 4 die Bildungsempfehlung. Winterferien 8. bis 19. Februar. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 5. Februar 2027',
      ferien: 'Winterferien 8. – 19. Februar 2027',
    },
    intro: [
      'In Sachsen gibt es die Halbjahreszeugnisse und Halbjahresinformationen am **Freitag, 5. Februar 2027** – eine Woche später als in vielen anderen Ländern.[^sn_vwv]',
      'Für Viertklässler ist es ein besonderer Tag: Ihre Eltern erhalten gleichzeitig die **Bildungsempfehlung**.[^sn_vwv]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Verwaltungsvorschrift zum Schuljahresablauf 2026/27 legt fest: Halbjahresinformationen, Halbjahreszeugnisse und die Zeugnisse des Kurshalbjahres 11/I werden am **5. Februar 2027** ausgegeben. Die Zeugnisse des **Kurshalbjahres 12/I** gibt es schon am **22. Dezember 2026**.[^sn_vwv]',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Direkt nach dem Zeugnis beginnen die Winterferien: **8. bis 19. Februar 2027**, zwei volle Wochen.[^sn_vwv] Die Osterferien folgen vom 26. März bis 2. April.[^sn_vwv]',
      },
    ],
    besonderheiten: {
      heading: 'Klasse 4: Bildungsempfehlung am Zeugnistag',
      blocks: [
        {
          type: 'ul',
          items: [
            'Die **Bildungsempfehlung** in Klasse 4 der Grundschule wird den Eltern am **5. Februar 2027 schriftlich** bekannt gegeben – am selben Tag wie die Halbjahresinformation.[^sn_vwv]',
            'Kann eine Empfehlung für das Gymnasium erst am Schuljahresende erteilt werden, erhalten die Eltern sie am **25. Juni 2027**.[^sn_vwv]',
            'Am Gymnasium sollen die Gespräche mit Eltern von Sechstklässlern zur Schullaufbahnempfehlung bis zum **5. Mai 2027** stattfinden.[^sn_vwv]',
            '**Halbjahresinformation oder -zeugnis:** In Sachsen gibt es beides; am 5. Februar werden beide ausgegeben.[^sn_vwv]',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Zwei Wochen Winterferien direkt nach dem Zeugnis lassen Zeit – in Klasse 4 auch, um die Bildungsempfehlung in Ruhe zu besprechen.',
    faqs: [
      {
        question: 'Wann gibt es in Sachsen 2027 Halbjahreszeugnisse?',
        answer:
          'Am Freitag, 5. Februar 2027 – Halbjahreszeugnisse und Halbjahresinformationen. Die Zeugnisse des Kurshalbjahres 12/I gibt es schon am 22. Dezember 2026.',
      },
      {
        question: 'Wann kommt in Sachsen 2027 die Bildungsempfehlung?',
        answer:
          'Am 5. Februar 2027, schriftlich an die Eltern der Klasse 4. Kann eine Empfehlung für das Gymnasium erst am Schuljahresende erteilt werden, folgt sie am 25. Juni 2027.',
      },
      {
        question: 'Wann sind in Sachsen 2027 Winterferien?',
        answer: 'Vom 8. bis 19. Februar 2027, direkt nach dem Zeugnistag.',
      },
    ],
  },
  {
    slug: 'sachsen-anhalt',
    name: 'Sachsen-Anhalt',
    abbr: 'ST',
    description:
      'Halbjahreszeugnis Sachsen-Anhalt 2027: Freitag, 29. Januar, laut Ferientermine des Bildungsministeriums. Danach Winterferien vom 1. bis 6. Februar, kurze Osterferien. Mit amtlicher Quelle.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'Winterferien 1. – 6. Februar 2027',
    },
    intro: [
      'In Sachsen-Anhalt gibt es die Halbjahreszeugnisse am **Freitag, 29. Januar 2027**.[^st_ferien] Am Montag danach beginnen die Winterferien.[^kmk]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Das Bildungsministerium veröffentlicht den Zeugnistag zusammen mit den Ferienterminen bis 2030; für das Schuljahr 2026/27 ist es der 29. Januar.[^st_ferien]',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Die Winterferien dauern vom **1. bis 6. Februar 2027**.[^kmk] Auffällig kurz sind die Osterferien: nur vom 22. bis 27. März 2027.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Sachsen-Anhalt anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Ferien direkt danach:** Eine Woche Winterferien unmittelbar nach dem Zeugnis.[^kmk]',
            '**Kurze Weihnachtsferien vorher:** Sie beginnen schon am 21. Dezember und enden am 2. Januar;[^kmk] danach folgen vier Schulwochen bis zum Zeugnis.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Die Winterferienwoche nach dem 29. Januar gibt Raum für ein Gespräch ohne Zeitdruck.',
    faqs: [
      {
        question: 'Wann gibt es in Sachsen-Anhalt 2027 Halbjahreszeugnisse?',
        answer: 'Am Freitag, 29. Januar 2027.',
      },
      {
        question: 'Wann sind in Sachsen-Anhalt 2027 Winterferien?',
        answer: 'Vom 1. bis 6. Februar 2027.',
      },
    ],
  },
  {
    slug: 'schleswig-holstein',
    name: 'Schleswig-Holstein',
    abbr: 'SH',
    description:
      'Halbjahreszeugnis Schleswig-Holstein 2027: Freitag, 29. Januar – nach der Regel „letzter Freitag vor dem Halbjahresende am 31. Januar“. Keine Winterferien. Mit Zeugnis- und Ferienverordnung.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'keine Winterferien; Osterferien 30. März – 10. April',
    },
    intro: [
      'In Schleswig-Holstein gibt es die Halbjahreszeugnisse am **Freitag, 29. Januar 2027**. Das Datum folgt aus zwei Verordnungen: Das Schulhalbjahr endet am 31. Januar, und das Zeugnis soll am letzten Freitag davor ausgegeben werden.[^sh_zvo][^sh_ferienvo]',
    ],
    termin: [
      {
        type: 'p',
        text: 'Die Ferienverordnung legt das Ende des ersten Halbjahres auf den **31. Januar**.[^sh_ferienvo] Die Zeugnisverordnung bestimmt, dass das Halbjahreszeugnis am letzten Freitag davor ausgegeben werden **soll**.[^sh_zvo] 2027 fällt der 31. Januar auf einen Sonntag – der letzte Freitag davor ist der 29. Januar.',
      },
      {
        type: 'p',
        text: 'Weil es eine Soll-Regel ist, sind Abweichungen möglich.[^sh_zvo] Maßgeblich ist der Termin, den die Schule nennt.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Schleswig-Holstein hat **keine Winterferien**.[^kmk] Nach den Weihnachtsferien (21. Dezember bis 6. Januar) sind die nächsten Ferien die Osterferien vom **30. März bis 10. April 2027**.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Was in Schleswig-Holstein anders ist',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Halbjahresende per Verordnung:** immer der 31. Januar.[^sh_ferienvo]',
            '**Soll-Regel:** Der Zeugnisfreitag ist der Regelfall, kein starres Datum.[^sh_zvo]',
            '**Lange Strecke bis Ostern:** Zwischen Zeugnis und Osterferien liegen rund acht Schulwochen.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Ohne Ferien danach bietet sich das Wochenende vom 30. und 31. Januar für das Gespräch an.',
    faqs: [
      {
        question: 'Wann gibt es in Schleswig-Holstein 2027 Halbjahreszeugnisse?',
        answer:
          'Am Freitag, 29. Januar 2027 – dem letzten Freitag vor dem Halbjahresende am 31. Januar. Die Zeugnisverordnung formuliert das als Soll-Regel.',
      },
      {
        question: 'Hat Schleswig-Holstein 2027 Winterferien?',
        answer: 'Nein. Die nächsten Ferien sind die Osterferien vom 30. März bis 10. April 2027.',
      },
    ],
  },
  {
    slug: 'thueringen',
    name: 'Thüringen',
    abbr: 'TH',
    description:
      'Halbjahreszeugnis Thüringen 2027: Freitag, 29. Januar – laut Schulordnung am letzten Schultag vor den Winterferien (1. bis 6. Februar). Neu seit 2025: Versetzungsgefährdung im Zeugnis vermerkt.',
    facts: {
      zeugnis: 'Freitag, 29. Januar 2027',
      ferien: 'Winterferien 1. – 6. Februar 2027',
    },
    intro: [
      'In Thüringen gibt es die Halbjahreszeugnisse am **letzten Schultag vor den Winterferien**; so bestimmt es die Thüringer Schulordnung.[^th_schulo] Die Winterferien beginnen am 1. Februar 2027[^kmk] – Zeugnistag ist damit **Freitag, der 29. Januar 2027**.',
      'Seit dem Schuljahr 2025/26 steht im Halbjahreszeugnis außerdem, wenn die Versetzung gefährdet ist.[^th_schulo][^th_gvbl]',
    ],
    termin: [
      {
        type: 'p',
        text: '„Am letzten Schultag vor den Winterferien werden Zeugnisse für das Schulhalbjahr … ausgegeben“, heißt es in § 60 der Schulordnung.[^th_schulo] Die Änderungen der Schulordnung aus dem Jahr 2025 haben diese Regel nicht berührt.[^th_gvbl] Ein eigener Erlass mit Datum ist deshalb nicht nötig: Der Tag ergibt sich aus dem Ferienkalender.',
      },
    ],
    ferien: [
      {
        type: 'p',
        text: 'Die Winterferien dauern vom **1. bis 6. Februar 2027**.[^kmk] Die Osterferien folgen vom 22. März bis 3. April.[^kmk]',
      },
    ],
    besonderheiten: {
      heading: 'Neu seit 2025: Gefährdung der Versetzung im Halbjahreszeugnis',
      blocks: [
        {
          type: 'p',
          text: 'Seit dem 1. August 2025 gilt: Besteht nach den Leistungen im ersten Halbjahr die Gefahr, dass ein Kind am Schuljahresende nicht versetzt werden kann, wird die **Gefährdung im Halbjahreszeugnis vermerkt**.[^th_schulo][^th_gvbl]',
        },
        {
          type: 'ul',
          items: [
            'Das betrifft die Klassenstufen, in denen eine Versetzungsentscheidung fällt – etwa Klasse 4 der Grundschule und die Klassen 6 bis 10 des Gymnasiums.[^th_gvbl]',
            'Der Vermerk ist eine Warnung, keine Entscheidung: Über die Versetzung wird am Ende des Schuljahres entschieden.',
            'Steht der Vermerk im Zeugnis, ist das ein guter Anlass, früh mit der Klassenleitung über Unterstützung im zweiten Halbjahr zu sprechen.',
          ],
        },
      ],
    },
    naechsteSchritte:
      'Die Winterferienwoche vom 1. bis 6. Februar lässt Zeit für das Gespräch – und, falls ein Versetzungsvermerk im Zeugnis steht, für einen Plan bis zum Sommer.',
    faqs: [
      {
        question: 'Wann gibt es in Thüringen 2027 Halbjahreszeugnisse?',
        answer:
          'Am Freitag, 29. Januar 2027. Die Schulordnung schreibt den letzten Schultag vor den Winterferien vor, und die Winterferien beginnen am 1. Februar.',
      },
      {
        question: 'Was bedeutet ein Versetzungsvermerk im Thüringer Halbjahreszeugnis?',
        answer:
          'Seit August 2025 wird im Halbjahreszeugnis vermerkt, wenn nach den Leistungen im ersten Halbjahr die Versetzung gefährdet ist. Es ist eine Warnung; entschieden wird am Schuljahresende.',
      },
      {
        question: 'Wann sind in Thüringen 2027 Winterferien?',
        answer: 'Vom 1. bis 6. Februar 2027.',
      },
    ],
  },
]

/** Shared links for "what parents do next" (kept here so tests see them). */
export const NEXT_STEP_LINKS = {
  gespraech: ZG,
  schlecht: '/ratgeber/schlechtes-zeugnis-was-tun',
  overview: '/ratgeber/halbjahreszeugnis-bedeutung',
}
