import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    'Wann gibt es 2027 Halbjahreszeugnisse? In den meisten Ländern am Freitag, 29. Januar 2027. Sachsen folgt am 5. Februar, Nordrhein-Westfalen am 12. Februar und Bayern am 19. Februar; in Baden-Württemberg legt die Schule den Tag zwischen dem 1. und 10. Februar fest. Die Tabelle zeigt alle 16 Länder, jeweils mit amtlicher Quelle.',
    'Für viele Familien ist der Zeugnistag angespannt – oft angespannter, als nötig wäre. Denn das Halbjahreszeugnis wird häufig behandelt, als ginge es schon um Versetzung oder Schulwechsel. Meistens geht es darum noch nicht. Dieser Ratgeber erklärt, was ein Halbjahreszeugnis aussagt, was es nicht entscheidet – und wann es doch Gewicht hat. Schulrecht ist Ländersache; wo wir Beispiele nennen, geben wir an, für welches Land sie gelten.',
  ],
  sections: [
    {
      id: 'termine-2027',
      heading: 'Halbjahreszeugnis 2027: Termine nach Bundesland',
      blocks: [
        {
          type: 'p',
          text: 'Einen bundesweit einheitlichen Termin gibt es nicht. Wir haben für alle 16 Länder die amtlichen Quellen geprüft – Erlasse und Terminpläne der Kultusministerien und das Landesrecht. Manche Länder legen einen Tag fest, andere eine Regel, aus der sich der Tag ergibt. Drei Länder haben für 2026/27 keinen landesweiten Termin veröffentlicht; dort nennen wir auch keinen.',
        },
        {
          type: 'table',
          head: ['Bundesland', 'Halbjahreszeugnis 2026/27'],
          rows: [
            [
              'Baden-Württemberg (BW)',
              'in der Regel zwischen 1. und 10. Februar 2027; den Tag legt die Schule fest[^1]',
            ],
            ['Bayern (BY)', 'Freitag, 19. Februar 2027[^2]'],
            ['Berlin (BE)', 'Freitag, 29. Januar 2027[^3]'],
            ['Brandenburg (BB)', 'Freitag, 29. Januar 2027[^4]'],
            ['Bremen (HB)', 'Freitag, 29. Januar 2027[^5]'],
            [
              'Hamburg (HH)',
              'kein landesweiter Termin veröffentlicht (Halbjahrespause: Freitag, 29. Januar 2027)[^6]',
            ],
            [
              'Hessen (HE)',
              'in der Regel Freitag, 29. Januar 2027 – letzter Unterrichtstag vor dem ersten Montag im Februar[^7]',
            ],
            [
              'Mecklenburg-Vorpommern (MV)',
              'kein landesweiter Termin veröffentlicht (Winterferien ab 8. Februar 2027)[^8]',
            ],
            ['Niedersachsen (NI)', 'Freitag, 29. Januar 2027[^9]'],
            ['Nordrhein-Westfalen (NRW)', 'Freitag, 12. Februar 2027[^10]'],
            [
              'Rheinland-Pfalz (RLP)',
              'Freitag, 29. Januar 2027 – Regel: letzter Freitag im Januar[^11]',
            ],
            [
              'Saarland (SL)',
              'Freitag, 29. Januar 2027 (Gymnasien und Gemeinschaftsschulen ab Klasse 5)[^12]',
            ],
            ['Sachsen (SN)', 'Freitag, 5. Februar 2027[^13]'],
            ['Sachsen-Anhalt (ST)', 'Freitag, 29. Januar 2027[^14]'],
            [
              'Schleswig-Holstein (SH)',
              'Freitag, 29. Januar 2027 – Regel: letzter Freitag vor dem Halbjahresende am 31. Januar[^15][^16]',
            ],
            [
              'Thüringen (TH)',
              'legt das Bildungsministerium fest; für 2026/27 haben wir keine Veröffentlichung gefunden[^17]',
            ],
          ],
          note: 'Stand: 27. November 2026. Maßgeblich ist der Termin, den die Schule nennt.',
        },
        {
          type: 'ul',
          items: [
            '**Baden-Württemberg:** Ein Halbjahreszeugnis gibt es nur in Abschlussklassen; die Klasse 4 der Grundschule erhält eine Halbjahresinformation.[^1]',
            '**Bayern:** In der Jahrgangsstufe 4 gibt es statt des Zwischenzeugnisses schon am 22. Januar eine Zwischeninformation.[^2]',
            '**Berlin:** Der Unterricht endet an diesem Tag nach der dritten Stunde. In der Kursphase der gymnasialen Oberstufe endet das Halbjahr schon vor den Weihnachtsferien; die Zeugnisse tragen dort das Datum 22. Dezember 2026 oder 6. Januar 2027.[^3]',
            '**Brandenburg:** Der Kalender des Bildungsministeriums nennt den 29. Januar für die Ausgabe der Grundschulgutachten, der Halbjahreszeugnisse und der Anmeldeformulare für den Übergang in Klasse 7.[^4]',
            '**Hessen:** Weil die Sommerferien 2027 schon am 28. Juni beginnen[^18], darf das Kultusministerium einen früheren landeseinheitlichen Termin festlegen.[^7] Eine solche Festlegung für 2026/27 haben wir nicht gefunden.',
            '**Niedersachsen:** Danach folgen am 1. und 2. Februar die Halbjahresferien.[^9]',
            '**Nordrhein-Westfalen:** Grundschulen geben die Zeugnisse zwischen dem 8. und 12. Februar aus.[^10]',
            '**Saarland:** In der Hauptphase der gymnasialen Oberstufe gibt es die Halbjahreszeugnisse schon am 18. Dezember 2026.[^12]',
            '**Sachsen:** An diesem Tag werden Halbjahreszeugnisse und Halbjahresinformationen ausgegeben.[^13]',
            '**Schleswig-Holstein:** Die Zeugnisverordnung formuliert eine Soll-Regel; Abweichungen sind möglich.[^15]',
          ],
        },
        {
          type: 'p',
          text: 'Für Hamburg, Mecklenburg-Vorpommern und Thüringen schätzen wir keinen Termin: Im Internet kursierende Daten widersprechen sich, und eine amtliche Festlegung lag uns nicht vor. Verlässlich ist der Terminplan Ihrer Schule. Wann in Ihrem Land die Winterferien liegen, zeigt der Ferienkalender der Kultusministerkonferenz.[^19]',
        },
      ],
    },
    {
      id: 'was-ist-das',
      heading: 'Was ein Halbjahreszeugnis ist',
      blocks: [
        {
          type: 'p',
          text: 'Das Schuljahr ist in zwei Halbjahre geteilt. Am Ende des Schuljahres gibt es das Jahreszeugnis, am Ende des ersten Halbjahres in der Regel ein Zeugnis über die bis dahin erbrachten Leistungen. So steht es zum Beispiel im nordrhein-westfälischen Schulgesetz.[^20] Neben den Noten kann es Fehlzeiten und Aussagen zum Arbeits- und Sozialverhalten enthalten.[^20]',
        },
        {
          type: 'p',
          text: 'Der Name unterscheidet sich je nach Land: In Bayern heißt es **Zwischenzeugnis**[^2], in Sachsen gibt es neben Halbjahreszeugnissen auch **Halbjahresinformationen**[^13]. Gemeint ist jeweils die Zwischenbilanz nach dem ersten Halbjahr.',
        },
      ],
    },
    {
      id: 'keine-versetzung',
      heading: 'Was das Halbjahreszeugnis nicht ist: eine Versetzungsentscheidung',
      blocks: [
        {
          type: 'p',
          text: 'Über die Versetzung wird in der Regel am Ende des Schuljahres entschieden. Das nordrhein-westfälische Schulgesetz regelt das ausdrücklich – und legt fest, dass in der Versetzungskonferenz die Lehrkräfte sitzen, die das Kind **im zweiten Halbjahr** unterrichtet haben.[^20] Das zweite Halbjahr zählt also voll. Eine schwache Note im Februar ist ein Zwischenstand, kein Endergebnis.',
        },
        {
          type: 'p',
          text: 'Das Gesetz sieht die Schule dabei in der Pflicht: Sie hat ihren Unterricht so zu gestalten und die Kinder so zu fördern, dass die Versetzung der Regelfall ist. Wessen Versetzung gefährdet ist, soll an schulischen Förderangeboten teilnehmen können – mit dem Ziel, die Lücken unter Einbeziehung der Eltern bis zur Versetzungsentscheidung zu schließen.[^20] Für Eltern heißt das: Ein schwaches Halbjahreszeugnis ist der richtige Moment, nach genau diesen Angeboten zu fragen.',
        },
        {
          type: 'p',
          text: 'Ebenso wenig ist das Halbjahreszeugnis ein Urteil über die Fähigkeiten eines Kindes. Noten beruhen auf dem Urteil von Lehrkräften, die die Leistungen ihrer Schülerinnen und Schüler zwar recht gut, aber nicht fehlerfrei einschätzen.[^21] Ein Halbjahr ist zudem kurz: Wenige Klassenarbeiten können eine Note stark prägen.',
        },
      ],
    },
    {
      id: 'wann-gewicht',
      heading: 'Wann das Halbjahreszeugnis doch Gewicht hat',
      blocks: [
        {
          type: 'p',
          text: 'In einigen Situationen ist das Halbjahreszeugnis mehr als eine Zwischenbilanz:',
        },
        {
          type: 'ul',
          items: [
            '**Übergang nach Klasse 4.** In Nordrhein-Westfalen gibt die Grundschule mit dem Halbjahreszeugnis der Klasse 4 eine begründete Empfehlung für die weiterführende Schulform; die Entscheidung treffen danach die Eltern nach Beratung.[^20] In Bayern erhalten Viertklässler am 22. Januar 2027 eine Zwischeninformation; das Übertrittszeugnis folgt am 3. Mai 2027.[^2]',
            '**Gefährdete Versetzung.** Wenn die Versetzung gefährdet ist, sieht etwa das nordrhein-westfälische Schulgesetz zum Ende des Halbjahres eine individuelle Lern- und Förderempfehlung vor. Reichen die Leistungen in einem Fach anders als im letzten Zeugnis nicht mehr aus, müssen die Eltern schriftlich benachrichtigt werden – umgangssprachlich der „blaue Brief“.[^20]',
          ],
        },
      ],
    },
    {
      id: 'lesen',
      heading: 'Wie Sie ein Halbjahreszeugnis lesen',
      blocks: [
        {
          type: 'ol',
          items: [
            '**Mit dem letzten Jahreszeugnis vergleichen.** Entscheidend ist die Richtung: Hat sich ein Fach verschlechtert, ist es gleich geblieben, gibt es Fortschritte?',
            '**Auf die Bemerkungen achten.** Aussagen zum Arbeits- und Sozialverhalten und Fehlzeiten sagen oft mehr über das Halbjahr als eine einzelne Note.',
            '**Einzelne Noten nicht überbewerten.** Eine Drei statt einer Zwei in einem Fach ist kein Alarmsignal. Mehrere Fächer, die gleichzeitig abrutschen, sind ein Anlass für ein Gespräch.',
            '**Nachfragen.** Lehrkräfte müssen ihre Bewertungsmaßstäbe erläutern und informieren auf Wunsch über den Leistungsstand – so regelt es zum Beispiel Nordrhein-Westfalen.[^22]',
          ],
        },
      ],
    },
    {
      id: 'was-jetzt',
      heading: 'Was jetzt sinnvoll ist',
      blocks: [
        {
          type: 'p',
          text: 'Das Halbjahreszeugnis ist vor allem eine Chance: Es kommt zu einem Zeitpunkt, an dem noch ein halbes Schuljahr Zeit bleibt. Sprechen Sie mit Ihrem Kind darüber, was gut lief und was schwierig war – Anregungen dafür gibt der Ratgeber [Das Zeugnisgespräch](/ratgeber/zeugnis-gespraech-fuehren). Wenn die Noten deutlich schlechter sind als erwartet, finden Sie im Ratgeber [Schlechtes Zeugnis: Was tun?](/ratgeber/schlechtes-zeugnis-was-tun) Fragen, die beim Sortieren helfen.',
        },
        {
          type: 'p',
          text: 'Und wenn Sie gute Leistungen oder Fortschritte anerkennen möchten, ist das Halbjahr ein guter Zeitpunkt, eine Regel für das Jahreszeugnis zu vereinbaren – vorher, nicht am Zeugnistag.',
        },
        { type: 'cta' },
      ],
    },
  ],
  cta: {
    title: 'Die Regel fürs Jahreszeugnis jetzt festlegen',
    text: 'Rechnen Sie mit den Noten des Halbjahreszeugnisses durch, was eine Regel fürs Jahreszeugnis ergäbe – pro Note, pro Verbesserung oder pauschal.',
  },
  faqs: [
    {
      question: 'Wann gibt es 2027 Halbjahreszeugnisse?',
      answer:
        'Das hängt vom Land ab. Am Freitag, 29. Januar 2027 in Berlin, Brandenburg, Bremen, Niedersachsen, Rheinland-Pfalz, Sachsen-Anhalt und Schleswig-Holstein, im Saarland an Gymnasien und Gemeinschaftsschulen, in der Regel auch in Hessen. In Sachsen am 5. Februar, in Baden-Württemberg zwischen dem 1. und 10. Februar (den Tag legt die Schule fest), in Nordrhein-Westfalen am 12. Februar und in Bayern am 19. Februar. Für Hamburg, Mecklenburg-Vorpommern und Thüringen ist kein landesweiter Termin veröffentlicht; dort nennt die Schule den Tag.',
    },
    {
      question: 'Zählt das Halbjahreszeugnis für die Versetzung?',
      answer:
        'Über die Versetzung wird in der Regel am Ende des Schuljahres entschieden, auf Grundlage der Leistungen im ganzen Jahr. Das Halbjahreszeugnis ist ein Zwischenstand. Wenn die Versetzung gefährdet ist, müssen Eltern zum Beispiel in Nordrhein-Westfalen schriftlich benachrichtigt werden.',
    },
    {
      question: 'Heißt das Halbjahreszeugnis überall so?',
      answer:
        'Nein. In Bayern heißt es Zwischenzeugnis, in der Jahrgangsstufe 4 gibt es stattdessen eine Zwischeninformation. In Sachsen gibt es neben Halbjahreszeugnissen auch Halbjahresinformationen. In Baden-Württemberg bekommen nur Abschlussklassen ein Halbjahreszeugnis; die Klasse 4 erhält eine Halbjahresinformation.',
    },
    {
      question: 'Was ist ein „blauer Brief“?',
      answer:
        'So nennt man umgangssprachlich die schriftliche Benachrichtigung der Eltern, wenn die Versetzung gefährdet ist. Ob und wann er verschickt wird, regelt das jeweilige Land. Er ist eine Warnung, keine Entscheidung.',
    },
    {
      question: 'Ist das Halbjahreszeugnis in Klasse 4 wichtig?',
      answer:
        'Ja, in einigen Ländern besonders. In Nordrhein-Westfalen wird mit dem Halbjahreszeugnis der Klasse 4 die Schulformempfehlung erteilt. In Bayern gibt es im Januar eine Zwischeninformation, das Übertrittszeugnis folgt im Mai.',
    },
    {
      question: 'Was tun, wenn das Halbjahreszeugnis schlecht ist?',
      answer:
        'Es bleibt ein halbes Schuljahr. Sprechen Sie mit Ihrem Kind darüber, was schwierig war, und fragen Sie die Schule nach Förderangeboten – in Nordrhein-Westfalen muss sie Kinder mit gefährdeter Versetzung fördern. Mehr im Ratgeber [Schlechtes Zeugnis: Was tun?](/ratgeber/schlechtes-zeugnis-was-tun).',
    },
    {
      question: 'Gibt es für das Halbjahreszeugnis Zeugnisgeld?',
      answer:
        'Das entscheidet jede Familie selbst. Viele belohnen nur das Jahreszeugnis und nutzen das Halbjahreszeugnis als Zwischenstand. Wichtig ist, dass die Regel vorher feststeht und für beide Zeugnisse klar ist. Was eine Regel pro Note, pro Verbesserung oder pauschal ergibt, zeigt der [Zeugnisgeld-Rechner](/tools/zeugnisgeld-rechner).',
    },
  ],
  sources: [
    {
      text: 'Notenbildungsverordnung Baden-Württemberg (NVO), § 3 Abs. 2 und 4, gültig ab 05.02.2025.',
      url: 'https://www.landesrecht-bw.de/perma?d=jlr-NNLBW00007BBDNN00000000016',
    },
    {
      text: 'Bayerisches Staatsministerium für Unterricht und Kultus: Prüfungen und Zeugnisse – Termine für das Schuljahr 2026/2027 (Stand 05.10.2026).',
      url: 'https://www.km.bayern.de/termine/pruefungen-und-zeugnisse',
    },
    {
      text: 'Senatsverwaltung für Bildung, Jugend und Familie Berlin: Änderung der Ferienordnung für das Land Berlin von 2024/2025 bis 2029/2030 vom 30.08.2024, Nr. 3 (Schuljahr 2026/2027).',
      url: 'https://www.berlin.de/sen/bjf/service/kalender/ferien/ferienordnung-des-landes-berlin-2024_2025-bis-2029_2030.pdf',
    },
    {
      text: 'Ministerium für Bildung, Jugend und Sport Brandenburg: Schuljahreskalender.',
      url: 'https://mbjs-fachportal.brandenburg.de/bildung/infos-fuer-schulen/schuljahreskalender.html',
    },
    {
      text: 'Verordnung über die Ferien für die Schulen der Stadtgemeinden Bremen und Bremerhaven für die Schuljahre 2024/2025 bis 2029/2030 vom 1. November 2022 (Brem.GBl. 2022, 871), § 9.',
      url: 'https://www.transparenz.bremen.de/metainformationen/verordnung-ueber-die-ferien-fuer-die-schulender-stadtgemeinden-bremen-und-bremerhaven-fuer-die-schuljahre-2024-2025-bis-2029-2030-vom-1-november-2022-186886?template=20_gp_ifg_meta_detail_d',
    },
    {
      text: 'Behörde für Schule und Berufsbildung Hamburg: Ferienordnung für die Schuljahre 2024/25 bis 2029/30.',
      url: 'https://dokumente.hamburg.de/resource/blob/134372/5bc131bdd36a604f67b361d21f7df37e/ferienordnung-hamburg-2024-2030-data.pdf',
    },
    {
      text: 'Verordnung zur Gestaltung des Schulverhältnisses (VOGSV) Hessen, § 62 Abs. 1, i. d. F. v. 20.07.2023.',
      url: 'https://www.rv.hessenrecht.hessen.de/perma?d=hevr-SchulVerhGVHE2011V10P62',
    },
    {
      text: 'Landesregierung Mecklenburg-Vorpommern: Ferientermine (Schuljahr 2026/2027).',
      url: 'https://land-mv.de/seite/ferientermine',
    },
    {
      text: 'Niedersächsisches Kultusministerium: Ferienordnung für die Schuljahre 2024/2025 bis 2029/2030, RdErl. v. 18.11.2022, Nr. 1.3 und 4.',
      url: 'https://www.mk.niedersachsen.de/download/190060/Ferienordnung_2024_25-_2029_30.pdf',
    },
    {
      text: 'Ministerium für Schule und Bildung NRW: Ordnung der Ferien und Termine für die Aushändigung der Halbjahreszeugnisse (BASS 12-65 Nr. 1).',
      url: 'https://bass.schule.nrw/191.htm',
    },
    {
      text: 'Schulordnung für die öffentlichen Grundschulen Rheinland-Pfalz, § 40 Abs. 1; ebenso Übergreifende Schulordnung, § 58.',
      url: 'https://landesrecht.rlp.de/bsrp/document/jlr-NNLRP00005A37NN00000000079',
    },
    {
      text: 'Ministerium für Bildung und Kultur Saarland: Terminplanung für das Schuljahr 2026/2027 (Gymnasien und Gemeinschaftsschulen), Nr. 7.',
      url: 'https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Bildungsserver/allgemeine-informationen/Termine_Gymnasien-Gemeinschaftsschulen.pdf?__blob=publicationFile&v=22',
    },
    {
      text: 'Sächsisches Staatsministerium für Kultus: Verwaltungsvorschrift Bedarf und Schuljahresablauf 2026/2027 vom 23. April 2026, Teil C.',
      url: 'https://www.revosax.sachsen.de/vorschrift/21547-VwV-Bedarf-und-Schuljahresablauf-2026-2027',
    },
    {
      text: 'Ministerium für Bildung Sachsen-Anhalt: Ferientermine 2024 bis 2030 (Schuljahr 2026/2027).',
      url: 'https://mb.sachsen-anhalt.de/api/media/Ferientermine_2024_bis_2030.pdf?collection=document',
    },
    {
      text: 'Zeugnisverordnung Schleswig-Holstein (ZVO) vom 18. Juni 2018, § 8 Abs. 5.',
      url: 'https://www.gesetze-rechtsprechung.sh.juris.de/perma?d=jlr-NNLSH00002BC4NN00000000020',
    },
    {
      text: 'Ferienverordnung Schleswig-Holstein 2024/25 bis 2030/31 vom 2. September 2022, § 1 Abs. 4.',
      url: 'https://www.gesetze-rechtsprechung.sh.juris.de/perma?d=jlr-NNLSH000032C8NN00000000002',
    },
    {
      text: 'Thüringer Schulordnung (ThürSchulO), § 60 Abs. 2, gültig ab 01.08.2025.',
      url: 'https://landesrecht.thueringen.de/bsth/document/jlr-NNLTH0000384ENN00000000302',
    },
    {
      text: 'Hessisches Kultusministerium: Ferientermine (Schuljahr 2026/2027).',
      url: 'https://kultus.hessen.de/schulsystem/ferien/ferientermine',
    },
    {
      text: 'Kultusministerkonferenz: Ferien im Schuljahr 2026/2027 (Stand 09.10.2025).',
      url: 'https://www.kmk.org/service/ferienregelung/ferienkalender.html',
    },
    {
      text: 'Schulgesetz für das Land Nordrhein-Westfalen (SchulG), § 11 Abs. 5 und 6, § 49 Abs. 1 und 2, § 50 Abs. 1 bis 4.',
      url: 'https://bass.schule.nrw/6043.htm',
    },
    {
      text: 'Südkamp, A., Kaiser, J. & Möller, J. (2012): Accuracy of teachers’ judgments of students’ academic achievement: A meta-analysis. Journal of Educational Psychology, 104(3), 743–762.',
      url: 'https://doi.org/10.1037/a0027627',
    },
    {
      text: 'Schulgesetz für das Land Nordrhein-Westfalen (SchulG), § 44 Abs. 2 – Information und Beratung.',
      url: 'https://bass.schule.nrw/6043.htm#1-1p44',
    },
  ],
  related: ['schlechtes-zeugnis-was-tun', 'zeugnis-gespraech-fuehren', 'zeugnisgeld'],
}

export default body
