import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    'Kaum ein Erziehungsthema wird so gegensätzlich diskutiert wie Belohnungen für Schulnoten. Die einen sagen: Erwachsene werden für ihre Arbeit bezahlt, warum nicht auch Kinder für ihre? Die anderen warnen: Wer für Noten bezahlt, erzieht Kinder dazu, nur noch für Geld zu lernen.',
    'Beide Seiten haben Argumente. Dieser Ratgeber stellt die Forschung so dar, wie sie ist – einschließlich der Ergebnisse, die gegen Belohnungen sprechen. Vorweg: Bonifatus ist eine App für Notenbelohnungen. Gerade deshalb halten wir es für wichtig, die Einwände nicht kleinzureden.',
  ],
  sections: [
    {
      id: 'einwand',
      heading: 'Der stärkste Einwand: Belohnungen können die eigene Motivation verdrängen',
      blocks: [
        {
          type: 'p',
          text: 'Die Psychologie unterscheidet zwischen intrinsischer Motivation – etwas tun, weil es einen interessiert – und extrinsischer Motivation – etwas tun, um eine Belohnung zu bekommen. Seit den 1970er-Jahren zeigen Experimente immer wieder, dass Belohnungen die intrinsische Motivation schwächen können.',
        },
        {
          type: 'p',
          text: 'Die bekannteste Zusammenfassung dieser Forschung ist eine Meta-Analyse von Edward Deci, Richard Koestner und Richard Ryan aus dem Jahr 1999, die 128 Studien auswertet.[^1] Die zentralen Ergebnisse:',
        },
        {
          type: 'ul',
          items: [
            '**Greifbare, erwartete Belohnungen** – etwa Geld, das vorher in Aussicht gestellt wird – senkten die Bereitschaft, sich in der freien Zeit weiter mit einer Aufgabe zu beschäftigen.',
            '**Leistungsabhängige Belohnungen** wirkten ebenfalls dämpfend, wenn auch etwas schwächer.',
            '**Bei Kindern** fiel der negative Effekt greifbarer Belohnungen tendenziell stärker aus als bei Studierenden.',
            '**Unerwartete Belohnungen**, die erst nach der Aufgabe überraschend kamen, hatten keinen messbaren Effekt.',
            '**Positives Feedback**, also ernst gemeintes Lob, steigerte die Motivation dagegen.',
          ],
        },
        {
          type: 'p',
          text: 'Für eine Notenregel ist das unbequem: Ein vorher vereinbarter Betrag pro Note ist genau die Art von erwarteter, greifbarer Belohnung, die in diesen Studien am deutlichsten negativ wirkte.',
        },
        {
          type: 'p',
          text: 'Unumstritten sind die Ergebnisse allerdings nicht. Judy Cameron und W. David Pierce kamen in ihrer eigenen Meta-Analyse zu dem Schluss, dass der Verdrängungseffekt kleiner und an engere Bedingungen geknüpft ist.[^2] Außerdem stammen die meisten Befunde aus kurzen Laborexperimenten mit Aufgaben, die die Teilnehmenden ohnehin interessant fanden. Schularbeit über ein ganzes Halbjahr ist eine andere Situation.',
        },
      ],
    },
    {
      id: 'feldstudie',
      heading: 'Was passiert, wenn man Schülerinnen und Schüler tatsächlich bezahlt?',
      blocks: [
        {
          type: 'p',
          text: 'Die größte Feldstudie dazu stammt vom Harvard-Ökonomen Roland Fryer. In den Schuljahren 2007/08 und 2008/09 lief an 203 Schulen in Chicago, Dallas und New York ein randomisiertes Experiment mit rund 27.000 Schülerinnen und Schülern (Versuchs- und Kontrollgruppen zusammen).[^3] Was belohnt wurde, unterschied sich je nach Stadt:',
        },
        {
          type: 'ul',
          items: [
            '**Dallas:** Zweitklässler bekamen 2 US-Dollar pro gelesenem Buch, wenn sie danach einen kurzen Test bestanden.',
            '**New York:** Viert- und Siebtklässler wurden für ihre Ergebnisse in Zwischentests bezahlt.',
            '**Chicago:** Neuntklässler erhielten Geld für ihre Noten in fünf Kernfächern.',
          ],
        },
        {
          type: 'p',
          text: 'Das Ergebnis war ernüchternd: Auf die Ergebnisse in den staatlichen Leistungstests hatten die Zahlungen in keiner der drei Städte einen statistisch nachweisbaren Effekt. In Chicago stiegen die bezahlten Noten leicht, der Effekt war aber nur knapp signifikant. Die einzige deutliche Verbesserung zeigte sich in Dallas – bei englischsprachigen Kindern, die fürs Lesen bezahlt wurden. Fryer weist selbst darauf hin, dass seine Studie kleine Effekte nicht ausschließen kann.[^3]',
        },
        {
          type: 'p',
          text: 'Zwei weitere Befunde sind für Eltern interessant. Erstens fand Fryer kaum Hinweise darauf, dass die Bezahlung die intrinsische Motivation der Kinder gesenkt hätte – anders, als die Laborstudien befürchten lassen. Zweitens fiel es den New Yorker Schülerinnen und Schülern schwer zu sagen, was sie tun könnten, um beim nächsten Test mehr Geld zu verdienen. Sie nannten Test-Tricks wie „die Fragen genauer lesen“ – aber niemand nannte, mehr zu lernen, Hausaufgaben zu machen oder Lehrkräfte um Hilfe zu bitten.[^3]',
        },
        {
          type: 'p',
          text: 'Fryers eigene, ausdrücklich vorsichtige Deutung: Belohnungen wirken eher, wenn sie an Dinge geknüpft sind, die Kinder direkt beeinflussen können – wie das Lesen eines Buches –, als an Ergebnisse, bei denen sie nicht wissen, wie sie sie verbessern sollen.',
        },
      ],
    },
    {
      id: 'was-folgt',
      heading: 'Was daraus für Familien folgt',
      blocks: [
        {
          type: 'p',
          text: 'Ein einfaches Ja oder Nein lässt sich aus der Forschung nicht ableiten. Ziemlich klar ist aber:',
        },
        {
          type: 'ul',
          items: [
            '**Geld für Noten ist kein Wundermittel.** Wer erwartet, dass ein Bonus allein die Noten verbessert, wird nach der Studienlage wahrscheinlich enttäuscht.',
            '**Das Verdrängungsrisiko ist ernst zu nehmen** – nach der Theorie hinter diesen Studien vor allem dann, wenn Kinder sich ohnehin für ein Fach interessieren und eine Belohnung als Kontrolle erleben.',
            '**Lob und echtes Interesse wirken.** Konkretes, ehrliches Feedback hatte in der Meta-Analyse einen positiven Effekt auf die Motivation.[^1]',
            '**Kinder brauchen einen Weg.** Eine Belohnung hilft wenig, wenn das Kind nicht weiß, was es anders machen soll.',
          ],
        },
      ],
    },
    {
      id: 'verzichten',
      heading: 'Wann Sie besser auf Belohnungen verzichten',
      blocks: [
        {
          type: 'ul',
          items: [
            'Ihr Kind lernt gern und aus eigenem Antrieb. Dann gibt es wenig zu gewinnen – und etwas zu verlieren.',
            'Ihr Kind steht ohnehin unter starkem Leistungsdruck oder hat Prüfungsangst. Geld kann den Druck erhöhen.',
            'Die Belohnung soll eine Lernschwierigkeit lösen. Hier helfen eher Gespräche mit den Lehrkräften und gezielte Förderung.',
            'Sie wissen schon jetzt, dass Sie die Regel nicht durchhalten oder bei schlechten Noten in Abzüge umwandeln würden.',
          ],
        },
      ],
    },
    {
      id: 'risiko-klein-halten',
      heading: 'Wenn Sie belohnen: So halten Sie das Risiko klein',
      blocks: [
        {
          type: 'p',
          text: 'Viele Familien entscheiden sich trotzdem für eine Form der Anerkennung – knapp 60 Prozent der Eltern belohnen das Zeugnis in irgendeiner Form.[^4] Dann hilft ein System, das die Forschung ernst nimmt:',
        },
        {
          type: 'ol',
          items: [
            '**Transparent statt spontan.** Eine vorher vereinbarte Regel nimmt dem Zeugnistag die Verhandlung und behandelt Geschwister gleich. Der Preis dafür: Die Belohnung ist erwartet. Umso wichtiger sind die folgenden Punkte.',
            '**Verbesserung und Anstrengung zählen lassen**, nicht nur Bestnoten. Ein Bonus für eine verbesserte Note belohnt etwas, das Ihr Kind selbst beeinflussen kann.',
            '**Klein halten.** Der Bonus sollte eine Anerkennung bleiben, nicht der Grund zum Lernen. Ein Anhaltspunkt ist das monatliche Taschengeld.',
            '**Vom Taschengeld trennen.** Das Deutsche Jugendinstitut rät, Taschengeld nicht an Noten zu koppeln und nicht zur Strafe zu kürzen.[^5]',
            '**Keine Abzüge.** Schlechte Noten sind ein Anlass für Unterstützung, nicht für Strafen.',
            '**Mit Lob verbinden.** Sprechen Sie über das, was gut lief, und darüber, was Ihr Kind gelernt hat – nicht nur über den Betrag.',
            '**Mitgestalten lassen.** Wenn Ihr Kind die Regel mit aushandelt, erlebt es sie eher als Vereinbarung denn als Kontrolle.',
          ],
        },
        {
          type: 'p',
          text: 'Wie eine solche Regel konkret aussehen kann, zeigt der Ratgeber [Zeugnisgeld: Wie viel ist fair?](/ratgeber/zeugnisgeld)',
        },
        { type: 'cta' },
      ],
    },
  ],
  cta: {
    title: 'Erst rechnen, dann vereinbaren',
    text: 'Mit dem kostenlosen Noten-Belohnungsrechner sehen Sie, was eine Regel bei einem echten Zeugnis ergibt – bevor Sie sie mit Ihrem Kind besprechen. Ohne Anmeldung.',
    button: 'Zum Noten-Belohnungsrechner',
    href: '/tools/grade-reward-calculator',
  },
  faqs: [
    {
      question: 'Ist Geld für gute Noten schädlich?',
      answer:
        'Nicht zwangsläufig, aber es ist auch kein Wundermittel. Laborstudien zeigen, dass erwartete Geldbelohnungen das eigene Interesse an einer Aufgabe schwächen können, besonders bei Kindern. In einer großen Feldstudie an US-Schulen fand sich dieser Effekt kaum – die Leistungen verbesserten sich durch Geld aber auch nicht nennenswert.',
    },
    {
      question: 'Was wirkt besser als Geld?',
      answer:
        'Konkretes Lob, Interesse an dem, was Ihr Kind lernt, und Unterstützung bei Schwierigkeiten. Positives Feedback hat in der Meta-Analyse von Deci, Koestner und Ryan die Motivation gesteigert.',
    },
    {
      question: 'Soll man Anstrengung oder Noten belohnen?',
      answer:
        'Wenn Sie belohnen, dann eher etwas, das Ihr Kind selbst beeinflussen kann – zum Beispiel Verbesserungen. In der Studie von Roland Fryer zeigte die Belohnung fürs Lesen als einzige einen deutlichen Effekt, Geld für Testergebnisse dagegen nicht.',
    },
    {
      question: 'Ist eine vorher vereinbarte Belohnung besser als eine spontane?',
      answer:
        'Hier gibt es einen echten Zielkonflikt. Unerwartete Belohnungen schwächten die Motivation in Studien nicht, vorher zugesagte schon eher. Eine vorher vereinbarte Regel ist dafür fairer und vermeidet Streit am Zeugnistag. Wer sich für eine Regel entscheidet, sollte sie klein halten, Verbesserungen einbeziehen und mit Lob verbinden.',
    },
  ],
  sources: [
    {
      text: 'Deci, E. L., Koestner, R. & Ryan, R. M. (1999): A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. Psychological Bulletin, 125(6), 627–668.',
      url: 'https://doi.org/10.1037/0033-2909.125.6.627',
    },
    {
      text: 'Cameron, J. & Pierce, W. D. (1994): Reinforcement, reward, and intrinsic motivation: A meta-analysis. Review of Educational Research, 64(3), 363–423.',
      url: 'https://doi.org/10.3102/00346543064003363',
    },
    {
      text: 'Fryer, R. G. (2011): Financial Incentives and Student Achievement: Evidence from Randomized Trials. The Quarterly Journal of Economics, 126(4), 1755–1798.',
      url: 'https://www.povertyactionlab.org/sites/default/files/research-paper/919_Financialincentives_and_student_Fryer_2011.pdf',
    },
    {
      text: 'Studienkreis: „Belohnung zum Zeugnis“ – repräsentative forsa-Umfrage unter rund 1.000 Eltern schulpflichtiger Kinder, 2018.',
      url: 'https://www.studienkreis.de/infothek/journal/belohnung-zum-zeugnis/',
    },
    {
      text: 'Chabursky, S. & Langmeyer, A. (2025): Taschengeld und Gelderziehung. Eine Expertise mit aktualisierten Empfehlungen zum Thema Taschengeld. Deutsches Jugendinstitut, München.',
      url: 'https://www.dji.de/fileadmin/user_upload/dasdji/publikationen/Broschueren_2025/Expertise_Taschengeld_ChaburskyLangmeyer2025_aktualisiert.pdf',
    },
  ],
  related: ['zeugnisgeld', 'taschengeld-tabelle'],
}

export default body
