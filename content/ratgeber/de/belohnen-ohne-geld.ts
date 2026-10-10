import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    'Die meisten Eltern geben zum Zeugnis kein Geld. Viele wollen es nicht, weil Lernen keine Lohnarbeit sein soll; andere fürchten, dass ein Kind sonst nur noch für den Betrag lernt. Den Wunsch, ein gutes Halbjahr zu würdigen, haben trotzdem fast alle.',
    'Dieser Ratgeber sammelt, was ohne Geld funktioniert – und sagt auch, wo ein Ersatz für Geld genau dieselben Probleme hat. Denn ein versprochenes Videospiel für eine Eins ist psychologisch näher am Zeugnisgeld, als es aussieht.',
  ],
  sections: [
    {
      id: 'was-eltern-tun',
      heading: 'Was Eltern tatsächlich tun',
      blocks: [
        {
          type: 'p',
          text: 'In einer repräsentativen forsa-Umfrage unter rund 1.000 Eltern von Schulkindern zwischen 10 und 18 Jahren belohnten knapp 60 Prozent das letzte Zeugnis. Die häufigste Form war nicht Geld, sondern ein gemeinsamer Ausflug oder eine Unternehmung (36 Prozent) – besonders bei jüngeren Schülerinnen und Schülern. Geld gaben 21 Prozent der Eltern, und 40 Prozent belohnten das Zeugnis gar nicht.[^1]',
        },
        {
          type: 'p',
          text: 'Auch das Deutsche Jugendinstitut rät, das Taschengeld nicht als Belohnung für gute Noten einzusetzen, und hält fest: Gute Leistungen können auf andere Weise anerkannt werden.[^2] Wer ohne Geld würdigt, ist also nicht die Ausnahme, sondern die Mehrheit.',
        },
      ],
    },
    {
      id: 'ohne-geld-nicht-automatisch-besser',
      heading: 'Ohne Geld ist nicht automatisch besser',
      blocks: [
        {
          type: 'p',
          text: 'Die Forschung zu Belohnungen und Motivation unterscheidet weniger zwischen Geld und Sachen als zwischen der Art, wie eine Belohnung gegeben wird. In der großen Meta-Analyse von Deci, Koestner und Ryan schwächten **greifbare, vorher in Aussicht gestellte** Belohnungen das eigene Interesse an einer Aufgabe – bei Kindern stärker als bei Erwachsenen. Dazu zählen Geld, aber auch Preise und Geschenke. **Unerwartete** Belohnungen hatten keinen messbaren Effekt, und ernst gemeintes **Lob** steigerte die Motivation sogar.[^3]',
        },
        {
          type: 'p',
          text: 'Ein Spielzeug, das für eine Eins versprochen wird, ist in diesem Sinn dasselbe wie Geld. Ähnlich bei Bildschirmzeit: In einer kleinen kanadischen Studie mit Kindern zwischen anderthalb und fünf Jahren hatten Kinder, deren Mütter Bildschirme zur Belohnung oder Strafe einsetzten, an Wochentagen mehr Bildschirmzeit.[^4] Die Studie zeigt nur einen Zusammenhang, keine Ursache, und gilt für Kleinkinder – sie ist aber ein Grund, Bildschirmzeit nicht zur Währung für Noten zu machen.',
        },
      ],
    },
    {
      id: 'lob',
      heading: 'Was wirkt: Lob, das die Anstrengung benennt',
      blocks: [
        {
          type: 'p',
          text: 'Die günstigste Anerkennung ist auch die am besten untersuchte. In Experimenten von Claudia Mueller und Carol Dweck wurden Fünftklässler nach einer Aufgabe entweder für ihre Intelligenz gelobt – sinngemäß „Du musst sehr klug sein“ – oder für ihre Anstrengung: „Du musst dich sehr angestrengt haben.“ Nach einem Misserfolg gaben die für Intelligenz gelobten Kinder schneller auf, hatten weniger Freude an den Aufgaben und schnitten danach schlechter ab als die für Anstrengung gelobten.[^5]',
        },
        {
          type: 'p',
          text: 'Man sollte daraus keine Wunderwirkung ableiten. Zwei Meta-Analysen fanden nur schwache Zusammenhänge zwischen solchen Denkweisen und Schulleistungen; Programme, die sie gezielt fördern, hatten im Durchschnitt kleine Effekte.[^6] Konkretes, ehrliches Lob kostet aber nichts – und ist eine bessere Gewohnheit als ein Betrag pro Note:',
        },
        {
          type: 'ul',
          items: [
            '**Benennen statt bewerten:** „Du hast für die Mathearbeit drei Wochen lang geübt – das sieht man“ statt „Du bist eben ein Mathe-Genie“.',
            '**Nach dem Weg fragen:** Was hat geholfen? Was würdest du nächstes Mal anders machen?',
            '**Auch ohne Bestnote:** Eine erkämpfte Drei verdient dasselbe ehrliche Interesse wie eine Eins.',
          ],
        },
      ],
    },
    {
      id: 'zeit-und-erlebnisse',
      heading: 'Zeit und Erlebnisse',
      blocks: [
        {
          type: 'p',
          text: 'Gemeinsame Unternehmungen sind nicht nur die beliebteste Belohnung, sie haben auch einen eigenen Wert: Sie machen den Zeugnistag zu einem Familienereignis statt zu einer Abrechnung. Dass symbolische Anerkennung wirken kann, zeigt eine Feldstudie aus Chicago: Für eine kleine Trophäe schnitten Grundschulkinder in einem Test ähnlich gut ab wie für 20 Dollar in bar. Bei älteren Schülerinnen und Schülern wirkte die Trophäe schwächer, und Belohnungen, die erst einen Monat später ausgehändigt wurden, wirkten gar nicht.[^7]',
        },
        {
          type: 'p',
          text: 'Daraus folgt: lieber am Zeugnistag selbst als irgendwann in den Ferien, und lieber spontan als vorher versprochen. Ein Nachmittag, den das Kind plant, ist mehr wert als ein Gutschein für „irgendwann“.',
        },
      ],
    },
    {
      id: 'autonomie',
      heading: 'Mitbestimmung als Anerkennung',
      blocks: [
        {
          type: 'p',
          text: 'Die Selbstbestimmungstheorie von Richard Ryan und Edward Deci nennt drei Grundbedürfnisse, die Motivation von innen tragen: das Gefühl, etwas zu können, selbst bestimmen zu dürfen und mit anderen verbunden zu sein.[^8] Gerade ältere Kinder erleben es als Anerkennung, wenn sie mehr entscheiden dürfen – nicht als Tauschgeschäft, sondern als Zeichen von Vertrauen:',
        },
        {
          type: 'ul',
          items: [
            'Das Wochenendprogramm oder das Ziel des nächsten Ausflugs bestimmen.',
            'Das Familienessen am Zeugnistag aussuchen – oder selbst kochen.',
            'Eine neue Verantwortung übernehmen, die sich das Kind wünscht, etwa einen eigenen Schulweg oder ein Haustier mitzuversorgen.',
            'Bei Jugendlichen: mehr Entscheidungsspielraum beim eigenen Budget.',
          ],
        },
      ],
    },
    {
      id: 'zum-anfangen',
      heading: 'So fangen Sie an',
      blocks: [
        {
          type: 'ol',
          items: [
            '**Zuerst das Gespräch.** Fragen Sie nach dem Halbjahr, nicht nur nach den Noten. Was lief gut, was war schwer?',
            '**Anstrengung und Verbesserung würdigen**, nicht nur Einsen.',
            '**Spontan statt versprochen.** Eine Überraschung schwächt das eigene Interesse nach der Forschung nicht.',
            '**Zeit statt Sachen.** Ein gemeinsamer Nachmittag trägt weiter als ein weiteres Geschenk.',
            '**Keine Strafen für schlechte Noten.** Sie sind ein Anlass für Unterstützung.',
          ],
        },
        {
          type: 'p',
          text: 'Wenn Sie doch ein festes System möchten, ohne dass Geld fließt, lohnt ein Blick auf den Ratgeber [Schulnoten belohnen – ja oder nein?](/ratgeber/schulnoten-belohnen), der die Risiken vorher vereinbarter Belohnungen ausführlich beschreibt.',
        },
        { type: 'cta' },
      ],
    },
  ],
  cta: {
    title: 'Punkte statt Euro',
    text: 'Der kostenlose Noten-Belohnungsrechner rechnet in Punkten. Ob ein Punkt einen Euro, eine Viertelstunde gemeinsame Zeit oder gar nichts Bestimmtes bedeutet, entscheiden Sie. Ohne Anmeldung.',
    button: 'Zum Noten-Belohnungsrechner',
    href: '/tools/grade-reward-calculator',
  },
  faqs: [
    {
      question: 'Wie kann ich ein gutes Zeugnis ohne Geld belohnen?',
      answer:
        'Am häufigsten mit gemeinsamer Zeit: einem Ausflug, einem Lieblingsessen, einem Nachmittag, den das Kind plant. Dazu konkretes Lob, das die Anstrengung benennt. Lob für Anstrengung hat in Studien die Motivation gestützt, und gemeinsame Zeit ist keine Belohnung, die das Kind gegen Noten eintauscht.',
    },
    {
      question: 'Ist ein Geschenk besser als Geld?',
      answer:
        'Nicht unbedingt. In der Forschung schwächten vor allem greifbare Belohnungen, die vorher in Aussicht gestellt wurden, das eigene Interesse – egal ob Geld oder Sachgeschenk. Eine Überraschung nach dem Zeugnis ist unproblematischer als ein vorher versprochener Preis.',
    },
    {
      question: 'Sollte man Bildschirmzeit als Belohnung einsetzen?',
      answer:
        'Wir raten davon ab. Eine kleine Studie mit Kleinkindern fand, dass Kinder mehr Bildschirmzeit hatten, wenn ihre Mütter Bildschirme zur Belohnung oder Strafe nutzten. Das beweist keine Ursache, spricht aber dagegen, Bildschirmzeit zur Währung für Noten zu machen.',
    },
    {
      question: 'Muss ich ein Zeugnis überhaupt belohnen?',
      answer:
        'Nein. In der forsa-Umfrage belohnten 40 Prozent der Eltern das Zeugnis gar nicht. Wichtiger als jede Belohnung ist, dass Sie sich für das Halbjahr interessieren und Ihr Kind bei Schwierigkeiten unterstützen.',
    },
  ],
  sources: [
    {
      text: 'Studienkreis: „Zeugnistag: Eltern belohnen gute Leistungen“ – Pressemitteilung zur forsa-Umfrage unter rund 1.000 Eltern von Schulkindern zwischen 10 und 18 Jahren, 17.01.2018.',
      url: 'https://www.studienkreis.de/fileadmin/dateien/unternehmen/presse/pressemitteilungen/2018/studienkreis-nachhilfe-pressemitteilung-belohnung-zeugnis-2018.pdf',
    },
    {
      text: 'Chabursky, S. & Langmeyer, A. (2025): Taschengeld und Gelderziehung. Eine Expertise mit aktualisierten Empfehlungen zum Thema Taschengeld. Deutsches Jugendinstitut, München.',
      url: 'https://www.dji.de/fileadmin/user_upload/dasdji/publikationen/Broschueren_2025/Expertise_Taschengeld_ChaburskyLangmeyer2025_aktualisiert.pdf',
    },
    {
      text: 'Deci, E. L., Koestner, R. & Ryan, R. M. (1999): A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. Psychological Bulletin, 125(6), 627–668.',
      url: 'https://doi.org/10.1037/0033-2909.125.6.627',
    },
    {
      text: 'Tang, L., Darlington, G., Ma, D. W. L. & Haines, J. (2018): Mothers’ and fathers’ media parenting practices associated with young children’s screen-time: a cross-sectional study. BMC Obesity, 5, 37.',
      url: 'https://doi.org/10.1186/s40608-018-0214-4',
    },
    {
      text: 'Mueller, C. M. & Dweck, C. S. (1998): Praise for intelligence can undermine children’s motivation and performance. Journal of Personality and Social Psychology, 75(1), 33–52.',
      url: 'https://doi.org/10.1037/0022-3514.75.1.33',
    },
    {
      text: 'Sisk, V. F., Burgoyne, A. P., Sun, J., Butler, J. L. & Macnamara, B. N. (2018): To What Extent and Under Which Circumstances Are Growth Mind-Sets Important to Academic Achievement? Two Meta-Analyses. Psychological Science, 29(4), 549–571.',
      url: 'https://doi.org/10.1177/0956797617739704',
    },
    {
      text: 'Levitt, S. D., List, J. A., Neckermann, S. & Sadoff, S. (2016): The Behavioralist Goes to School: Leveraging Behavioral Economics to Improve Educational Performance. American Economic Journal: Economic Policy, 8(4), 183–219.',
      url: 'https://doi.org/10.1257/pol.20130358',
    },
    {
      text: 'Ryan, R. M. & Deci, E. L. (2000): Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. American Psychologist, 55(1), 68–78.',
      url: 'https://doi.org/10.1037/0003-066X.55.1.68',
    },
  ],
  related: ['schulnoten-belohnen', 'zeugnisgeld', 'zeugnisgeld-hoehe-nach-klasse'],
}

export default body
