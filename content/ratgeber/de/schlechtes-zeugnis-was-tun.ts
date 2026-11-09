import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    'Das Zeugnis liegt auf dem Tisch, und es ist schlechter als erhofft. Vielleicht ist es eine Fünf in Mathe, vielleicht sind es mehrere Noten, die abgerutscht sind. Wenn Sie diese Seite lesen, machen Sie sich wahrscheinlich Sorgen – um die Noten, vor allem aber um Ihr Kind.',
    'Vorweg das Wichtigste: Ein einzelnes Zeugnis sagt wenig darüber, was aus einem Kind wird. Und eine Seite im Internet kann Ihnen nicht sagen, ob Ihr Kind Unterstützung braucht und welche. Das können die Lehrkräfte, die Ihr Kind jeden Tag erleben – und Ihr Kind selbst. Dieser Ratgeber zeigt, was die Forschung über den Umgang mit schlechten Noten weiß, und wie Sie herausfinden, was hinter dem Zeugnis steckt.',
  ],
  sections: [
    {
      id: 'momentaufnahme',
      heading: 'Ein Zeugnis ist eine Momentaufnahme',
      blocks: [
        {
          type: 'p',
          text: 'Noten beruhen auf dem Urteil von Lehrkräften. Diese Urteile sind nicht beliebig: Eine Meta-Analyse über 75 Studien fand, dass Lehrkräfte die Leistungen ihrer Schülerinnen und Schüler recht gut einschätzen – die Übereinstimmung mit standardisierten Leistungstests lag im Mittel bei einer Korrelation von 0,63.[^1] Das ist ein deutlicher Zusammenhang, aber kein exakter Messwert.',
        },
        {
          type: 'p',
          text: 'Für Eltern heißt das: Eine schlechte Note ist ein ernst zu nehmender Hinweis, dass in einem Fach etwas nicht rund läuft. Sie ist kein Urteil über die Begabung Ihres Kindes und keine Vorhersage. Sie fasst ein halbes Jahr zusammen – einschließlich der Klassenarbeit, die an einem schlechten Tag geschrieben wurde.',
        },
      ],
    },
    {
      id: 'strafen',
      heading: 'Was Druck und Strafen bewirken',
      blocks: [
        {
          type: 'p',
          text: 'Der Impuls ist verständlich: Wer sich sorgt, will reagieren, und eine Strafe fühlt sich nach Handeln an. Die Forschung spricht dagegen, auf schlechte Noten mit Härte zu antworten.',
        },
        {
          type: 'ul',
          items: [
            '**Harte Worte schaden.** In einer Längsschnittstudie mit Familien sagte harsche verbale Disziplin der Eltern, wenn die Kinder 13 waren, eine Zunahme von Verhaltensproblemen und depressiven Symptomen im folgenden Jahr voraus. Elterliche Wärme glich das nicht aus. Umgekehrt führte schwieriges Verhalten der Jugendlichen auch zu mehr harschen Worten – ein Kreislauf.[^2]',
            '**Körperliche Strafen helfen nicht.** Eine Meta-Analyse mit Daten von über 160.000 Kindern fand Klapse in 13 von 17 Auswertungen mit einem höheren Risiko für ungünstige Entwicklungen verbunden – und in keiner mit besserem Verhalten.[^3] In Deutschland ist das ohnehin keine Option: Kinder haben ein gesetzliches Recht auf eine Erziehung ohne Gewalt, körperliche Bestrafungen und seelische Verletzungen.[^4]',
          ],
        },
        {
          type: 'p',
          text: 'Ob ein Handyverbot schadet, beantworten diese Studien nicht. Sie zeigen aber eine Richtung: Druck allein löst das Problem nicht, das zur schlechten Note geführt hat – er macht es nur schwerer, darüber zu sprechen.',
        },
      ],
    },
    {
      id: 'reaktion',
      heading: 'Ihre Reaktion prägt, was Ihr Kind über sich lernt',
      blocks: [
        {
          type: 'p',
          text: 'Kyla Haimovitz und Carol Dweck von der Stanford University untersuchten, wie Eltern über Misserfolg denken. Manche sehen ihn als lähmend, andere als Teil des Lernens. Diese Haltung war für Kinder sichtbar und hing mit dem zusammen, was die Kinder über ihre eigene Intelligenz glaubten. Eltern, die Misserfolg als lähmend sehen, achten stärker auf Leistung und Begabung als auf das Lernen – und ihre Kinder halten Intelligenz eher für unveränderlich. In einem Experiment veränderte die Haltung der Eltern direkt, wie sie auf ein schlechtes Ergebnis ihres Kindes reagierten.[^5]',
        },
        {
          type: 'callout',
          text: '**Daraus folgt:** Der Satz „Du bist halt nicht gut in Mathe“ richtet mehr Schaden an als die Fünf. Hilfreicher ist die Frage: „Was war schwierig – und was könnte helfen?“',
        },
      ],
    },
    {
      id: 'diagnose',
      heading: 'Diagnose statt Urteil: die richtigen Fragen',
      blocks: [
        {
          type: 'p',
          text: 'Bevor Sie über Konsequenzen oder Nachhilfe nachdenken, lohnt es sich herauszufinden, was hinter den Noten steckt. Diese Fragen helfen beim Sortieren:',
        },
        {
          type: 'ul',
          items: [
            '**Ein Fach oder viele?** Eine einzelne schwache Note hat oft fachliche Gründe – eine Lücke im Stoff, eine neue Lehrkraft. Wenn mehrere Fächer gleichzeitig abrutschen, liegt die Ursache nach unserer Einschätzung eher außerhalb des Stoffs.',
            '**Plötzlich oder schleichend?** Vergleichen Sie mit dem letzten Zeugnis und den Klassenarbeiten des Halbjahres.',
            '**Was sagt Ihr Kind?** Fragen Sie offen, ohne Vorwurf. Kinder wissen oft genau, wo es hakt – und manchmal, dass es gar nicht um den Unterricht geht, sondern um Streit in der Klasse, Mobbing oder Sorgen zu Hause.',
            '**Wie geht es Ihrem Kind insgesamt?** Schläft es genug, geht es gern zur Schule, hat es Freunde? Das Zeugnis ist manchmal das erste sichtbare Zeichen einer Belastung.',
          ],
        },
      ],
    },
    {
      id: 'lehrkraft',
      heading: 'Das Gespräch mit der Lehrkraft',
      blocks: [
        {
          type: 'p',
          text: 'Die Lehrkräfte sind die wichtigste Quelle für eine Einschätzung. In Nordrhein-Westfalen etwa schreibt das Schulgesetz vor, dass Lehrkräfte Eltern über die Lern- und Leistungsentwicklung informieren und ihnen auf Wunsch einzelne Beurteilungen erläutern.[^6] Fragen Sie konkret:',
        },
        {
          type: 'ul',
          items: [
            'Woran liegt die Note – an schriftlichen Arbeiten, an der Mitarbeit, an fehlenden Grundlagen?',
            'Wie erleben Sie mein Kind im Unterricht?',
            'Was kann mein Kind bis zum Sommer konkret tun, und wie können wir zu Hause helfen?',
            'Ist die Versetzung gefährdet?',
          ],
        },
        {
          type: 'p',
          text: 'Zur letzten Frage: Das Halbjahreszeugnis ist in der Regel keine Versetzungsentscheidung. Was es bedeutet und wann es doch Gewicht hat, erklärt der Ratgeber [Halbjahreszeugnis: Was es bedeutet](/ratgeber/halbjahreszeugnis-bedeutung).',
        },
      ],
    },
    {
      id: 'hilfe',
      heading: 'Wann Sie sich Hilfe holen sollten',
      blocks: [
        {
          type: 'p',
          text: 'Wenn Ihr Kind sich zurückzieht, Angst vor der Schule äußert oder die Sorgen sich im Gespräch nicht lösen lassen, müssen Sie das nicht allein klären. Die Beratungslehrkraft und der schulpsychologische Dienst sind dafür da. Anonym und kostenlos hilft die Nummer gegen Kummer:[^7]',
        },
        {
          type: 'ul',
          items: [
            '**Elterntelefon:** 0800 111 0 550, montags bis freitags 9 bis 17 Uhr, dienstags und donnerstags bis 19 Uhr.',
            '**Kinder- und Jugendtelefon:** 116 111, montags bis samstags 14 bis 20 Uhr.',
          ],
        },
      ],
    },
    {
      id: 'naechstes-halbjahr',
      heading: 'Und das nächste Halbjahr?',
      blocks: [
        {
          type: 'p',
          text: 'Wenn klar ist, woran es liegt, hilft ein kleiner, gemeinsamer Plan: ein oder zwei Ziele bis zum Sommer, die Ihr Kind selbst beeinflussen kann, und ein fester Termin, an dem Sie gemeinsam schauen, wie es läuft. Wie Sie über das Zeugnis sprechen, ohne dass es zum Streit wird, zeigt der Ratgeber [Das Zeugnisgespräch](/ratgeber/zeugnis-gespraech-fuehren).',
        },
        {
          type: 'p',
          text: 'Wenn Sie Fortschritte anerkennen möchten, dann für Verbesserungen – nicht nur für Bestnoten. Ein Sprung von einer Fünf auf eine Drei ist eine Leistung. Was dabei zu beachten ist, steht im Ratgeber [Belohnen ohne Geld](/ratgeber/belohnen-ohne-geld).',
        },
        { type: 'cta' },
      ],
    },
  ],
  cta: {
    title: 'Verbesserung sichtbar machen',
    text: 'Wenn Sie für das nächste Halbjahr eine Regel vereinbaren möchten, die Fortschritte zählt statt nur Einsen: Im kostenlosen Noten-Belohnungsrechner sehen Sie vorab, was eine solche Regel bei einem echten Zeugnis ergibt. Ohne Anmeldung.',
    button: 'Zum Noten-Belohnungsrechner',
    href: '/tools/grade-reward-calculator',
  },
  faqs: [
    {
      question: 'Soll ich mein Kind für ein schlechtes Zeugnis bestrafen?',
      answer:
        'Die Forschung spricht dagegen. Harte Worte sagten in Studien mehr Verhaltensprobleme und depressive Symptome voraus, körperliche Strafen sind in Deutschland verboten und gehen mit ungünstigen Entwicklungen einher. Hilfreicher ist es herauszufinden, warum die Noten schlecht sind, und gemeinsam einen Plan zu machen.',
    },
    {
      question: 'Wird mein Kind wegen des Halbjahreszeugnisses sitzen bleiben?',
      answer:
        'In der Regel wird über die Versetzung erst am Ende des Schuljahres entschieden. Das Halbjahreszeugnis zeigt aber, wo es eng werden könnte. Fragen Sie die Lehrkraft direkt, ob die Versetzung gefährdet ist und was bis zum Sommer helfen würde.',
    },
    {
      question: 'Braucht mein Kind jetzt Nachhilfe?',
      answer:
        'Das hängt davon ab, woran es liegt. Bei Lücken im Stoff kann gezielte Unterstützung helfen. Liegt die Ursache woanders – Überforderung, Konflikte, Sorgen –, löst Nachhilfe das Problem nicht. Klären Sie das zuerst im Gespräch mit Ihrem Kind und der Lehrkraft.',
    },
    {
      question: 'Wie spreche ich mit meinem Kind über das Zeugnis?',
      answer:
        'Lassen Sie Ihr Kind zuerst erzählen, fragen Sie offen nach, was schwierig war, und benennen Sie auch, was gut lief. Vermeiden Sie Sätze, die eine Note zur Eigenschaft machen, etwa „Du kannst das eben nicht“.',
    },
  ],
  sources: [
    {
      text: 'Südkamp, A., Kaiser, J. & Möller, J. (2012): Accuracy of teachers’ judgments of students’ academic achievement: A meta-analysis. Journal of Educational Psychology, 104(3), 743–762.',
      url: 'https://doi.org/10.1037/a0027627',
    },
    {
      text: 'Wang, M.-T. & Kenny, S. (2014): Longitudinal links between fathers’ and mothers’ harsh verbal discipline and adolescents’ conduct problems and depressive symptoms. Child Development, 85(3), 908–923.',
      url: 'https://doi.org/10.1111/cdev.12143',
    },
    {
      text: 'Gershoff, E. T. & Grogan-Kaylor, A. (2016): Spanking and child outcomes: Old controversies and new meta-analyses. Journal of Family Psychology, 30(4), 453–469.',
      url: 'https://doi.org/10.1037/fam0000191',
    },
    {
      text: 'Bürgerliches Gesetzbuch (BGB), § 1631 Abs. 2 – Inhalt und Grenzen der Personensorge.',
      url: 'https://www.gesetze-im-internet.de/bgb/__1631.html',
    },
    {
      text: 'Haimovitz, K. & Dweck, C. S. (2016): Parents’ views of failure predict children’s fixed and growth intelligence mind-sets. Psychological Science, 27(6), 859–869.',
      url: 'https://doi.org/10.1177/0956797616639727',
    },
    {
      text: 'Schulgesetz für das Land Nordrhein-Westfalen (SchulG), § 44 Information und Beratung.',
      url: 'https://bass.schule.nrw/6043.htm',
    },
    {
      text: 'Nummer gegen Kummer e. V. & Bundesschülerkonferenz: „Gemeinsam stark in der Zeugnisphase“ – Pressemitteilung zu den Halbjahreszeugnissen, 26.01.2026.',
      url: 'https://www.nummergegenkummer.de/wp-content/uploads/2026/01/PM_NgK_BSK_Halbjahreszeugnisse.pdf',
    },
  ],
  related: ['halbjahreszeugnis-bedeutung', 'zeugnis-gespraech-fuehren', 'belohnen-ohne-geld'],
}

export default body
