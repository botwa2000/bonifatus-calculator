import type { RatgeberBody } from '../registry'

const body: RatgeberBody = {
  intro: [
    'Wie viel Taschengeld ist angemessen? Die Frage stellt sich in fast jeder Familie – spätestens, wenn auf dem Schulhof Beträge verglichen werden. Die wichtigste Orientierung in Deutschland ist die Taschengeld-Tabelle des Deutschen Jugendinstituts (DJI). Sie wurde im September 2025 grundlegend überarbeitet.[^1]',
    'Hier finden Sie die aktuellen Werte, was sich geändert hat und wie Taschengeld und Belohnungen für Noten zusammenpassen – oder besser: warum sie nicht zusammengehören.',
  ],
  sections: [
    {
      id: 'tabelle',
      heading: 'Die Taschengeld-Tabelle 2025 des DJI',
      blocks: [
        {
          type: 'djiAllowanceTable',
          note: 'Quelle: Deutsches Jugendinstitut, Taschengeld-Empfehlungen 2025.[^1]',
        },
        {
          type: 'p',
          text: 'Die Tabelle ist ausdrücklich eine Orientierung, keine Vorgabe. Das DJI betont, dass jede Familie im Rahmen ihrer Möglichkeiten einen Betrag aushandeln soll, der verlässlich gezahlt werden kann. Höheres Alter und wachsende Selbstständigkeit sprechen eher für den oberen Rand der Spanne, viele Geschwister oder ein knappes Haushaltsbudget eher für den unteren.[^1]',
        },
        {
          type: 'p',
          text: 'Den passenden Betrag für ein bestimmtes Alter zeigt auch unser [Taschengeldrechner](/tools/allowance-calculator).',
        },
      ],
    },
    {
      id: 'was-ist-neu',
      heading: 'Was sich 2025 geändert hat',
      blocks: [
        {
          type: 'p',
          text: 'Gegenüber den früheren Empfehlungen hat das DJI drei Dinge angepasst:[^1]',
        },
        {
          type: 'ul',
          items: [
            '**Breitere Spannen:** laut DJI um etwa zehn Euro bei den jüngeren und um bis zu zwanzig Euro bei den älteren Altersgruppen. So bleibt die Orientierung auch bei knappem Budget nutzbar.',
            '**Altersgruppen statt Einzeljahre:** Je zwei Jahrgänge sind zusammengefasst – das soll das Aushandeln in der Familie erleichtern.',
            '**Teilweise niedrigere Obergrenzen:** In zwei Altersgruppen wurden die oberen Werte moderat gesenkt, weil die tatsächlich gezahlten Beträge dort unter den früheren Empfehlungen lagen.',
          ],
        },
        {
          type: 'p',
          text: 'Wer bisher mehr gezahlt hat, muss laut DJI nicht absenken; wer darunter lag, kann in zwei oder drei Schritten anheben.[^1] Viele Tabellen im Netz zeigen noch ältere Werte mit Einzeljahren – achten Sie auf das Datum der Quelle.',
        },
      ],
    },
    {
      id: 'auszahlung',
      heading: 'Wöchentlich oder monatlich, bar oder aufs Konto?',
      blocks: [
        {
          type: 'p',
          text: 'Für jüngere Kinder empfiehlt das DJI wöchentliche Beträge, ab etwa zehn Jahren eine monatliche Zahlung. Fällt der Wechsel schwer, kann eine 14-tägige Auszahlung für einige Monate helfen. In den ersten Schuljahren ist Bargeld sinnvoll, weil sichtbares Geld das Planen konkret macht; später kann das Geld aufs Jugendkonto gehen. Einmal im Jahr – zum Geburtstag oder zu Beginn des Schuljahres – lohnt ein kurzer gemeinsamer Blick auf die Höhe.[^1]',
        },
      ],
    },
    {
      id: 'budgetgeld',
      heading: 'Neu: Budgetgeld ab etwa 12 Jahren',
      blocks: [
        {
          type: 'p',
          text: 'Zusätzlich zum frei verfügbaren Taschengeld empfiehlt das DJI ab etwa 12 Jahren ein Budgetgeld: Geld für bestimmte, wiederkehrende Ausgaben, das Jugendliche selbst verwalten. So lernen sie, mit einem Budget zu planen. Die Orientierungswerte pro Monat:[^1]',
        },
        {
          type: 'table',
          head: ['Bereich', 'Empfehlung pro Monat'],
          rows: [
            ['Kleidung und Schuhe', '45–65 €'],
            ['Essen außer Haus', '25–40 €'],
            ['Handy, Internet und Abos', '15–25 €'],
            ['Schulmaterial', '5–15 €'],
            ['Kosmetik und Pflege', '5–15 €'],
          ],
        },
        {
          type: 'p',
          text: 'Budgetgeld muss nicht in allen Bereichen auf einmal starten. Es kann sinnvoll sein, mit einem überschaubaren Bereich wie dem Handyvertrag zu beginnen und das Budget nach und nach zu erweitern.',
        },
      ],
    },
    {
      id: 'grundregeln',
      heading: 'Die Grundregeln des DJI',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Freie Verfügung:** Über das Taschengeld entscheidet das Kind selbst.',
            '**Regelmäßig und pünktlich:** Ein fester Rhythmus gibt Orientierung.',
            '**Kein Erziehungsmittel:** Taschengeld wird weder als Belohnung eingesetzt noch zur Strafe gekürzt.',
            '**Mithilfe im Haushalt ist kein Job:** Normale Mithilfe wird nicht bezahlt; besondere Zusatzdienste können separat und vorher vereinbart entlohnt werden.',
            '**Geschenke nicht anrechnen:** Geldgeschenke werden nicht vom Taschengeld abgezogen; bei größeren Summen wird gemeinsam besprochen, was damit passiert.',
            '**Lieber verlässlich als hoch:** Bei knappem Budget ist ein kleinerer, aber verlässlicher Betrag besser als ein schwankender.',
          ],
        },
        { type: 'p', text: 'Alle Regeln ausführlich beschreibt die DJI-Expertise.[^1]' },
      ],
    },
    {
      id: 'taschengeld-und-noten',
      heading: 'Und was hat Taschengeld mit Noten zu tun?',
      blocks: [
        {
          type: 'p',
          text: 'Eigentlich nichts – und genau das ist der Punkt. Das DJI formuliert es deutlich: Taschengeld sollte nicht als Belohnung für gutes Verhalten oder gute Schulnoten eingesetzt und nicht als Strafe gekürzt werden. Solche Praktiken untergraben seine Funktion als verlässliches Lernbudget und können das Vertrauensverhältnis zwischen Eltern und Kind belasten. Gute Leistungen können auf andere Weise anerkannt werden.[^1]',
        },
        {
          type: 'p',
          text: 'Für Familien, die Noten belohnen möchten, folgt daraus ein klares Modell mit zwei getrennten Töpfen:',
        },
        {
          type: 'ul',
          items: [
            '**Taschengeld:** fester Betrag nach Alter, unabhängig von Noten und Verhalten.',
            '**Notenbonus:** separat, vorher vereinbart, mit Obergrenze – und nie als Abzug vom Taschengeld.',
          ],
        },
        {
          type: 'p',
          text: 'Für die Größenordnung des Bonus ist das Taschengeld trotzdem ein guter Maßstab: Ein Bonus, der ein Vielfaches des Monatstaschengelds erreicht, rückt das Geld in den Mittelpunkt. Wie Sie eine solche Regel aufstellen, zeigt der Ratgeber [Zeugnisgeld: Wie viel ist fair?](/ratgeber/zeugnisgeld)',
        },
        { type: 'cta' },
      ],
    },
    {
      id: 'recht',
      heading: 'Der rechtliche Rahmen: der Taschengeldparagraf',
      blocks: [
        {
          type: 'p',
          text: 'Kinder unter sieben Jahren sind nach § 104 BGB geschäftsunfähig.[^2] Für Minderjährige ab sieben Jahren gilt der sogenannte Taschengeldparagraf, § 110 BGB: Ein Vertrag, den sie ohne Zustimmung der Eltern schließen, gilt als von Anfang an wirksam, wenn sie ihn mit Mitteln erfüllen, die ihnen zu diesem Zweck oder zur freien Verfügung überlassen wurden.[^3] Taschengeld ist genau solch ein Mittel – deshalb dürfen Kinder davon selbst einkaufen, was in ihrem Rahmen liegt.',
        },
        {
          type: 'p',
          text: 'Eine gesetzlich festgelegte Höhe des Taschengelds gibt es nicht. Die Werte des DJI sind Empfehlungen.',
        },
      ],
    },
  ],
  cta: {
    title: 'Notenbonus getrennt vom Taschengeld planen',
    text: 'Mit dem kostenlosen Noten-Belohnungsrechner sehen Sie, welche Belohnung sich aus einem Zeugnis ergibt – ohne Anmeldung und ohne das Taschengeld anzutasten.',
    button: 'Zum Noten-Belohnungsrechner',
    href: '/tools/grade-reward-calculator',
  },
  faqs: [
    {
      question: 'Wie viel Taschengeld bekommt ein 10-Jähriger?',
      answer:
        'Das Deutsche Jugendinstitut empfiehlt für 10- bis 11-Jährige 15 bis 25 Euro im Monat (Stand: September 2025). Ab etwa zehn Jahren rät das DJI zu einer monatlichen Auszahlung.',
    },
    {
      question: 'Wie viel Taschengeld ist mit 14 angemessen?',
      answer:
        'Für 14- bis 15-Jährige empfiehlt das DJI 25 bis 45 Euro im Monat. Ab etwa 12 Jahren kann zusätzlich Budgetgeld für feste Ausgaben wie Kleidung oder Handy hinzukommen.',
    },
    {
      question: 'Ist die Taschengeld-Tabelle verbindlich?',
      answer:
        'Nein. Die Tabelle des DJI ist eine Orientierung. Eine gesetzlich festgelegte Höhe gibt es nicht; jede Familie handelt im Rahmen ihrer Möglichkeiten einen Betrag aus, der verlässlich gezahlt werden kann.',
    },
    {
      question: 'Darf man Taschengeld als Strafe kürzen?',
      answer:
        'Das DJI rät davon ab. Taschengeld soll ein verlässliches Lernbudget sein und nicht als Erziehungsmittel eingesetzt werden – weder als Belohnung noch als Strafe.',
    },
    {
      question: 'Sollte es für gute Noten mehr Taschengeld geben?',
      answer:
        'Nach den Empfehlungen des DJI nicht. Wer Noten belohnen möchte, sollte dafür einen separaten, vorher vereinbarten Bonus nutzen und das Taschengeld unabhängig davon zahlen.',
    },
  ],
  sources: [
    {
      text: 'Chabursky, S. & Langmeyer, A. (2025): Taschengeld und Gelderziehung. Eine Expertise mit aktualisierten Empfehlungen zum Thema Taschengeld. Deutsches Jugendinstitut, München.',
      url: 'https://www.dji.de/fileadmin/user_upload/dasdji/publikationen/Broschueren_2025/Expertise_Taschengeld_ChaburskyLangmeyer2025_aktualisiert.pdf',
    },
    {
      text: '§ 104 BGB – Geschäftsunfähigkeit.',
      url: 'https://www.gesetze-im-internet.de/bgb/__104.html',
    },
    {
      text: '§ 110 BGB – Bewirken der Leistung mit eigenen Mitteln („Taschengeldparagraf“).',
      url: 'https://www.gesetze-im-internet.de/bgb/__110.html',
    },
  ],
  related: ['zeugnisgeld', 'schulnoten-belohnen'],
}

export default body
