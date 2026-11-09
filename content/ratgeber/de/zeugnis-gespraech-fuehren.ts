import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    'Am Zeugnistag reichen oft ein paar Sekunden, um den Ton für den ganzen Abend zu setzen: der erste Blick auf die Noten, der erste Satz. Kinder merken genau, ob zuerst nach der Mathenote gefragt wird oder danach, wie es ihnen geht.',
    'Dieser Ratgeber zeigt, wie Sie das Gespräch über das Zeugnis so führen, dass Ihr Kind etwas davon hat – bei guten wie bei schlechten Noten. Er stützt sich auf Studien dazu, wie Lob und die Haltung der Eltern zu Misserfolg auf Kinder wirken, und endet mit einem kurzen Leitfaden für den Tag selbst.',
  ],
  sections: [
    {
      id: 'vorher',
      heading: 'Bevor Sie das Zeugnis sehen',
      blocks: [
        {
          type: 'p',
          text: 'Das beste Zeugnisgespräch beginnt, bevor das Zeugnis da ist. Überlegen Sie vorher, was Ihnen an diesem Tag wichtig ist – und was nicht. Nummer gegen Kummer und die Bundesschülerkonferenz haben es zu den Halbjahreszeugnissen 2026 so formuliert: Zeugnisse sollten nicht zum einzigen Gradmesser für den Wert oder die Zukunft junger Menschen werden.[^1]',
        },
        {
          type: 'ul',
          items: [
            '**Zeit einplanen.** Nicht zwischen Tür und Angel, nicht vor den Geschwistern, nicht am Telefon.',
            '**Eigene Erwartungen prüfen.** Wenn Sie schon ahnen, dass eine Note schlecht ist, legen Sie sich vorher einen ruhigen ersten Satz zurecht.',
            '**Belohnung vorher klären.** Ob und wie Sie gute Leistungen anerkennen, sollte vor dem Zeugnistag feststehen – sonst wird das Gespräch zur Verhandlung. Mehr dazu im Ratgeber [Zeugnisgeld: Wie viel ist fair?](/ratgeber/zeugnisgeld)',
          ],
        },
      ],
    },
    {
      id: 'erste-minuten',
      heading: 'Die ersten Minuten: erst das Kind, dann die Noten',
      blocks: [
        {
          type: 'p',
          text: 'Lassen Sie Ihr Kind erzählen, bevor Sie die Noten kommentieren. Fragen wie „Wie war der Tag?“ oder „Bist du zufrieden?“ geben ihm die Chance, selbst einzuordnen, was es mitbringt. Viele Kinder wissen sehr genau, wo es gut lief und wo nicht – und sind erleichtert, wenn sie es zuerst sagen dürfen.',
        },
        {
          type: 'p',
          text: 'Wenn Ihr Kind enttäuscht oder ängstlich ist, hat das Gefühl Vorrang. Eine Note lässt sich morgen noch besprechen. Ein Kind, das sich am Zeugnistag nicht nach Hause traut, braucht zuerst die Sicherheit, dass sich an Ihrer Zuneigung nichts ändert.',
        },
      ],
    },
    {
      id: 'lob',
      heading: 'Lob, das wirkt: den Weg loben, nicht die Begabung',
      blocks: [
        {
          type: 'p',
          text: 'Nicht jedes Lob ist gleich hilfreich. In sechs Studien mit Fünftklässlern untersuchten Claudia Mueller und Carol Dweck, wie sich Lob für Intelligenz und Lob für Anstrengung auswirkt. Kinder, die für ihre Intelligenz gelobt wurden, achteten danach stärker darauf, gut dazustehen, als darauf, etwas zu lernen. Nach einem Misserfolg gaben sie schneller auf, hatten weniger Freude an der Aufgabe und schnitten schlechter ab als Kinder, die für ihre Anstrengung gelobt wurden.[^2]',
        },
        {
          type: 'table',
          head: ['Statt …', 'Besser …'],
          rows: [
            [
              '„Du bist eben ein Mathe-Ass.“',
              '„Du hast vor der Arbeit jeden Tag geübt – das hat sich gelohnt.“',
            ],
            ['„Du bist so schlau.“', '„Du hast nicht aufgegeben, als es schwierig wurde.“'],
            ['„Eine Eins, super.“', '„Erzähl mal, was dir in Deutsch gefallen hat.“'],
          ],
        },
      ],
    },
    {
      id: 'schwache-noten',
      heading: 'Über schwache Noten sprechen',
      blocks: [
        {
          type: 'p',
          text: 'Ob Kinder schlechte Noten als Ende oder als Anfang erleben, hängt auch an den Eltern. Kyla Haimovitz und Carol Dweck fanden, dass Kinder die Haltung ihrer Eltern zu Misserfolg wahrnehmen. Eltern, die Misserfolg als lähmend sehen, konzentrieren sich auf Leistung und Begabung statt auf das Lernen – und ihre Kinder glauben eher, dass Intelligenz feststeht.[^3]',
        },
        {
          type: 'p',
          text: 'Für das Gespräch heißt das: Behandeln Sie die schwache Note als Information, nicht als Urteil. Hilfreiche Fragen sind „Was war in diesem Fach schwierig?“, „Wann hast du gemerkt, dass es nicht läuft?“ und „Was würde dir helfen?“. Und sagen Sie ruhig, dass Sie selbst auch schon an etwas gescheitert sind und es später doch gelernt haben.',
        },
        {
          type: 'p',
          text: 'Wenn die Noten deutlich schlechter sind als erwartet, finden Sie im Ratgeber [Schlechtes Zeugnis: Was tun?](/ratgeber/schlechtes-zeugnis-was-tun) Fragen, um die Ursache einzugrenzen.',
        },
      ],
    },
    {
      id: 'lassen',
      heading: 'Was Sie besser lassen',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Vergleiche.** Weder mit Geschwistern noch mit Klassenkameraden. Jedes Zeugnis wird für sich besprochen – warum das wichtig ist, steht im Ratgeber [Geschwister gerecht belohnen](/ratgeber/geschwister-gerechtigkeit).',
            '**Laute Vorwürfe.** In einer Längsschnittstudie sagte harsche verbale Disziplin der Eltern mehr Verhaltensprobleme und depressive Symptome bei Jugendlichen im folgenden Jahr voraus; elterliche Wärme glich das nicht aus.[^4]',
            '**Sofortige Konsequenzen.** Ein Verbot, das im Ärger ausgesprochen wird, beendet das Gespräch, bevor klar ist, was hinter der Note steckt.',
            '**Sätze, die eine Note zur Eigenschaft machen.** „Du bist faul“ oder „Mathe ist eben nicht dein Ding“ erklären nichts und bleiben hängen.',
          ],
        },
      ],
    },
    {
      id: 'plan',
      heading: 'Vom Gespräch zum Plan',
      blocks: [
        {
          type: 'p',
          text: 'Dass Eltern sich für die Schule ihrer Kinder interessieren, ist gut – aber mehr ist nicht automatisch besser. Eine Übersichtsarbeit von Pomerantz, Moorman und Litwack kommt zu dem Schluss, dass vor allem das **Wie** über den Nutzen elterlicher Unterstützung entscheidet.[^5] Ein Plan, den Ihr Kind mitgestaltet, trägt weiter als einer, der über seinen Kopf hinweg entsteht:',
        },
        {
          type: 'ol',
          items: [
            'Gemeinsam ein oder zwei Fächer auswählen, auf die es im nächsten Halbjahr ankommt.',
            'Konkrete Schritte vereinbaren, die Ihr Kind selbst in der Hand hat – etwa zweimal pro Woche Vokabeln üben.',
            'Bei Bedarf ein Gespräch mit der Lehrkraft verabreden.',
            'Einen Termin festlegen, an dem Sie gemeinsam schauen, wie es läuft.',
          ],
        },
        {
          type: 'p',
          text: 'Wenn Sie Fortschritte belohnen möchten, vereinbaren Sie die Regel jetzt – für das nächste Zeugnis, nicht rückwirkend.',
        },
        { type: 'cta' },
      ],
    },
  ],
  cta: {
    title: 'Die Regel für das nächste Zeugnis gemeinsam festlegen',
    text: 'Im kostenlosen Noten-Belohnungsrechner sehen Sie und Ihr Kind, was eine Regel bei einem echten Zeugnis ergibt – auch mit Bonus für Verbesserungen. Ohne Anmeldung.',
    button: 'Zum Noten-Belohnungsrechner',
    href: '/tools/grade-reward-calculator',
  },
  faqs: [
    {
      question: 'Was sage ich als Erstes, wenn das Zeugnis schlecht ist?',
      answer:
        'Etwas, das nicht die Note betrifft – zum Beispiel: „Danke, dass du es mir zeigst. Wie geht es dir damit?“ So weiß Ihr Kind, dass das Gespräch nicht mit einem Urteil beginnt.',
    },
    {
      question: 'Soll ich gute Noten loben?',
      answer:
        'Ja, aber besser die Anstrengung und den Weg als die Begabung. Lob für Intelligenz machte Kinder in Studien nach Misserfolgen weniger ausdauernd als Lob für Anstrengung.',
    },
    {
      question: 'Was, wenn mein Kind nicht über das Zeugnis reden will?',
      answer:
        'Drängen Sie nicht. Sagen Sie, dass Sie da sind, wenn es reden möchte, und kommen Sie am nächsten Tag noch einmal darauf zurück. Wenn sich Ihr Kind über längere Zeit zurückzieht, holen Sie sich Rat bei der Schule oder dem Elterntelefon der Nummer gegen Kummer (0800 111 0 550).',
    },
    {
      question: 'Sollen beide Eltern beim Zeugnisgespräch dabei sein?',
      answer:
        'Wenn es geht, ja – aber nur, wenn Sie sich vorher einig sind, wie Sie reagieren. Zwei Erwachsene, die sich vor dem Kind uneinig sind, machen das Gespräch schwerer.',
    },
  ],
  sources: [
    {
      text: 'Nummer gegen Kummer e. V. & Bundesschülerkonferenz: „Gemeinsam stark in der Zeugnisphase“ – Pressemitteilung zu den Halbjahreszeugnissen, 26.01.2026.',
      url: 'https://www.nummergegenkummer.de/wp-content/uploads/2026/01/PM_NgK_BSK_Halbjahreszeugnisse.pdf',
    },
    {
      text: 'Mueller, C. M. & Dweck, C. S. (1998): Praise for intelligence can undermine children’s motivation and performance. Journal of Personality and Social Psychology, 75(1), 33–52.',
      url: 'https://doi.org/10.1037/0022-3514.75.1.33',
    },
    {
      text: 'Haimovitz, K. & Dweck, C. S. (2016): Parents’ views of failure predict children’s fixed and growth intelligence mind-sets. Psychological Science, 27(6), 859–869.',
      url: 'https://doi.org/10.1177/0956797616639727',
    },
    {
      text: 'Wang, M.-T. & Kenny, S. (2014): Longitudinal links between fathers’ and mothers’ harsh verbal discipline and adolescents’ conduct problems and depressive symptoms. Child Development, 85(3), 908–923.',
      url: 'https://doi.org/10.1111/cdev.12143',
    },
    {
      text: 'Pomerantz, E. M., Moorman, E. A. & Litwack, S. D. (2007): The how, whom, and why of parents’ involvement in children’s academic lives: More is not always better. Review of Educational Research, 77(3), 373–410.',
      url: 'https://doi.org/10.3102/003465430305567',
    },
  ],
  related: [
    'schlechtes-zeugnis-was-tun',
    'halbjahreszeugnis-bedeutung',
    'geschwister-gerechtigkeit',
  ],
}

export default body
