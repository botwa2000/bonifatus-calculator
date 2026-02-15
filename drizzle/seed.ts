import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import {
  languages,
  gradingSystems,
  subjectCategories,
  subjects,
  bonusFactorDefaults,
} from './schema'

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  console.log('Seeding languages...')
  await db
    .insert(languages)
    .values([
      {
        code: 'en',
        nameNative: 'English',
        nameEnglish: 'English',
        textDirection: 'ltr',
        isActive: true,
        displayOrder: 1,
      },
      {
        code: 'de',
        nameNative: 'Deutsch',
        nameEnglish: 'German',
        textDirection: 'ltr',
        isActive: true,
        displayOrder: 2,
      },
      {
        code: 'fr',
        nameNative: 'Français',
        nameEnglish: 'French',
        textDirection: 'ltr',
        isActive: true,
        displayOrder: 3,
      },
    ])
    .onConflictDoNothing()

  // ---------------------------------------------------------------------------
  // Grading systems (6 systems, all names with 6 locales)
  // ---------------------------------------------------------------------------
  console.log('Seeding grading systems...')
  const [germanSystem] = await db
    .insert(gradingSystems)
    .values([
      {
        code: 'DE_1_6',
        name: {
          en: 'German System (1-6)',
          de: 'Deutsches Notensystem (1-6)',
          fr: 'Systeme allemand (1-6)',
          it: 'Sistema tedesco (1-6)',
          es: 'Sistema aleman (1-6)',
          ru: 'Немецкая система (1-6)',
        },
        description: {
          en: 'German grading scale from 1 (very good) to 6 (insufficient)',
          de: 'Deutsche Notenskala von 1 (sehr gut) bis 6 (ungenugend)',
          fr: 'Echelle de notation allemande de 1 (tres bien) a 6 (insuffisant)',
          it: 'Scala di valutazione tedesca da 1 (ottimo) a 6 (insufficiente)',
          es: 'Escala de calificacion alemana de 1 (muy bueno) a 6 (insuficiente)',
          ru: 'Немецкая шкала оценок от 1 (отлично) до 6 (неудовлетворительно)',
        },
        countryCode: 'DE',
        scaleType: 'numeric',
        bestIsHighest: false,
        minValue: 1,
        maxValue: 6,
        passingThreshold: 4,
        gradeDefinitions: [
          { grade: '1', numeric_value: 1, normalized_100: 100, quality_tier: 'best' },
          { grade: '1-', numeric_value: 1.3, normalized_100: 94, quality_tier: 'best' },
          { grade: '2+', numeric_value: 1.7, normalized_100: 88, quality_tier: 'second' },
          { grade: '2', numeric_value: 2, normalized_100: 83, quality_tier: 'second' },
          { grade: '2-', numeric_value: 2.3, normalized_100: 78, quality_tier: 'second' },
          { grade: '3+', numeric_value: 2.7, normalized_100: 72, quality_tier: 'third' },
          { grade: '3', numeric_value: 3, normalized_100: 67, quality_tier: 'third' },
          { grade: '3-', numeric_value: 3.3, normalized_100: 61, quality_tier: 'third' },
          { grade: '4+', numeric_value: 3.7, normalized_100: 55, quality_tier: 'below' },
          { grade: '4', numeric_value: 4, normalized_100: 50, quality_tier: 'below' },
          { grade: '4-', numeric_value: 4.3, normalized_100: 44, quality_tier: 'below' },
          { grade: '5+', numeric_value: 4.7, normalized_100: 33, quality_tier: 'below' },
          { grade: '5', numeric_value: 5, normalized_100: 20, quality_tier: 'below' },
          { grade: '5-', numeric_value: 5.3, normalized_100: 10, quality_tier: 'below' },
          { grade: '6', numeric_value: 6, normalized_100: 0, quality_tier: 'below' },
        ],
        displayOrder: 1,
        isActive: true,
      },
      {
        code: 'US_LETTER',
        name: {
          en: 'US Letter Grade (A-F)',
          de: 'US-Buchstabennoten (A-F)',
          fr: 'Systeme americain (A-F)',
          it: 'Sistema americano (A-F)',
          es: 'Sistema americano (A-F)',
          ru: 'Американская система (A-F)',
        },
        description: {
          en: 'American letter grading scale from A to F',
          de: 'Amerikanische Buchstabenskala von A bis F',
          fr: 'Echelle de notation americaine de A a F',
          it: 'Scala di valutazione americana da A a F',
          es: 'Escala de calificacion americana de A a F',
          ru: 'Американская буквенная шкала от A до F',
        },
        countryCode: 'US',
        scaleType: 'letter',
        bestIsHighest: true,
        minValue: 0,
        maxValue: 100,
        passingThreshold: 60,
        gradeDefinitions: [
          { grade: 'A+', numeric_value: 97, normalized_100: 100, quality_tier: 'best' },
          { grade: 'A', numeric_value: 93, normalized_100: 95, quality_tier: 'best' },
          { grade: 'A-', numeric_value: 90, normalized_100: 90, quality_tier: 'best' },
          { grade: 'B+', numeric_value: 87, normalized_100: 85, quality_tier: 'second' },
          { grade: 'B', numeric_value: 83, normalized_100: 80, quality_tier: 'second' },
          { grade: 'B-', numeric_value: 80, normalized_100: 75, quality_tier: 'second' },
          { grade: 'C+', numeric_value: 77, normalized_100: 70, quality_tier: 'third' },
          { grade: 'C', numeric_value: 73, normalized_100: 65, quality_tier: 'third' },
          { grade: 'C-', numeric_value: 70, normalized_100: 60, quality_tier: 'third' },
          { grade: 'D+', numeric_value: 67, normalized_100: 55, quality_tier: 'below' },
          { grade: 'D', numeric_value: 63, normalized_100: 50, quality_tier: 'below' },
          { grade: 'D-', numeric_value: 60, normalized_100: 45, quality_tier: 'below' },
          { grade: 'F', numeric_value: 50, normalized_100: 0, quality_tier: 'below' },
        ],
        displayOrder: 2,
        isActive: true,
      },
      {
        code: 'AT_1_5',
        name: {
          en: 'Austrian System (1-5)',
          de: 'Osterreichisches Notensystem (1-5)',
          fr: 'Systeme autrichien (1-5)',
          it: 'Sistema austriaco (1-5)',
          es: 'Sistema austriaco (1-5)',
          ru: 'Австрийская система (1-5)',
        },
        description: {
          en: 'Austrian grading scale from 1 (very good) to 5 (insufficient)',
          de: 'Osterreichische Notenskala von 1 (Sehr gut) bis 5 (Nicht genugend)',
          fr: 'Echelle de notation autrichienne de 1 (tres bien) a 5 (insuffisant)',
          it: 'Scala di valutazione austriaca da 1 (ottimo) a 5 (insufficiente)',
          es: 'Escala de calificacion austriaca de 1 (muy bueno) a 5 (insuficiente)',
          ru: 'Австрийская шкала оценок от 1 (отлично) до 5 (неудовлетворительно)',
        },
        countryCode: 'AT',
        scaleType: 'numeric',
        bestIsHighest: false,
        minValue: 1,
        maxValue: 5,
        passingThreshold: 4,
        gradeDefinitions: [
          { grade: '1', numeric_value: 1, normalized_100: 100, quality_tier: 'best' },
          { grade: '2', numeric_value: 2, normalized_100: 75, quality_tier: 'second' },
          { grade: '3', numeric_value: 3, normalized_100: 50, quality_tier: 'third' },
          { grade: '4', numeric_value: 4, normalized_100: 25, quality_tier: 'below' },
          { grade: '5', numeric_value: 5, normalized_100: 0, quality_tier: 'below' },
        ],
        displayOrder: 3,
        isActive: true,
      },
      {
        code: 'CH_6_1',
        name: {
          en: 'Swiss System (6-1)',
          de: 'Schweizer Notensystem (6-1)',
          fr: 'Systeme suisse (6-1)',
          it: 'Sistema svizzero (6-1)',
          es: 'Sistema suizo (6-1)',
          ru: 'Швейцарская система (6-1)',
        },
        description: {
          en: 'Swiss grading scale from 6 (excellent) to 1 (very poor)',
          de: 'Schweizer Notenskala von 6 (ausgezeichnet) bis 1 (sehr schlecht)',
          fr: 'Echelle de notation suisse de 6 (excellent) a 1 (tres faible)',
          it: 'Scala di valutazione svizzera da 6 (eccellente) a 1 (molto scarso)',
          es: 'Escala de calificacion suiza de 6 (excelente) a 1 (muy deficiente)',
          ru: 'Швейцарская шкала оценок от 6 (отлично) до 1 (очень плохо)',
        },
        countryCode: 'CH',
        scaleType: 'numeric',
        bestIsHighest: true,
        minValue: 1,
        maxValue: 6,
        passingThreshold: 4,
        gradeDefinitions: [
          { grade: '6', numeric_value: 6, normalized_100: 100, quality_tier: 'best' },
          { grade: '5.5', numeric_value: 5.5, normalized_100: 90, quality_tier: 'best' },
          { grade: '5', numeric_value: 5, normalized_100: 80, quality_tier: 'second' },
          { grade: '4.5', numeric_value: 4.5, normalized_100: 70, quality_tier: 'second' },
          { grade: '4', numeric_value: 4, normalized_100: 60, quality_tier: 'third' },
          { grade: '3.5', numeric_value: 3.5, normalized_100: 50, quality_tier: 'third' },
          { grade: '3', numeric_value: 3, normalized_100: 40, quality_tier: 'below' },
          { grade: '2.5', numeric_value: 2.5, normalized_100: 30, quality_tier: 'below' },
          { grade: '2', numeric_value: 2, normalized_100: 20, quality_tier: 'below' },
          { grade: '1.5', numeric_value: 1.5, normalized_100: 10, quality_tier: 'below' },
          { grade: '1', numeric_value: 1, normalized_100: 0, quality_tier: 'below' },
        ],
        displayOrder: 4,
        isActive: true,
      },
      {
        code: 'UK_GCSE',
        name: {
          en: 'UK GCSE (9-1)',
          de: 'UK GCSE (9-1)',
          fr: 'UK GCSE (9-1)',
          it: 'UK GCSE (9-1)',
          es: 'UK GCSE (9-1)',
          ru: 'Британская GCSE (9-1)',
        },
        description: {
          en: 'UK GCSE grading scale from 9 (highest) to 1 (lowest)',
          de: 'Britische GCSE-Skala von 9 (hochste) bis 1 (niedrigste)',
          fr: 'Echelle GCSE britannique de 9 (meilleur) a 1 (plus bas)',
          it: 'Scala GCSE britannica da 9 (massimo) a 1 (minimo)',
          es: 'Escala GCSE britanica de 9 (maximo) a 1 (minimo)',
          ru: 'Британская шкала GCSE от 9 (высший) до 1 (низший)',
        },
        countryCode: 'GB',
        scaleType: 'numeric',
        bestIsHighest: true,
        minValue: 1,
        maxValue: 9,
        passingThreshold: 4,
        gradeDefinitions: [
          { grade: '9', numeric_value: 9, normalized_100: 100, quality_tier: 'best' },
          { grade: '8', numeric_value: 8, normalized_100: 88, quality_tier: 'best' },
          { grade: '7', numeric_value: 7, normalized_100: 75, quality_tier: 'second' },
          { grade: '6', numeric_value: 6, normalized_100: 63, quality_tier: 'second' },
          { grade: '5', numeric_value: 5, normalized_100: 50, quality_tier: 'third' },
          { grade: '4', numeric_value: 4, normalized_100: 38, quality_tier: 'third' },
          { grade: '3', numeric_value: 3, normalized_100: 25, quality_tier: 'below' },
          { grade: '2', numeric_value: 2, normalized_100: 13, quality_tier: 'below' },
          { grade: '1', numeric_value: 1, normalized_100: 0, quality_tier: 'below' },
        ],
        displayOrder: 5,
        isActive: true,
      },
      {
        code: 'FR_0_20',
        name: {
          en: 'French System (0-20)',
          de: 'Franzosisches Notensystem (0-20)',
          fr: 'Systeme francais (0-20)',
          it: 'Sistema francese (0-20)',
          es: 'Sistema frances (0-20)',
          ru: 'Французская система (0-20)',
        },
        description: {
          en: 'French grading scale from 0 to 20',
          de: 'Franzosische Notenskala von 0 bis 20',
          fr: 'Systeme de notation francais de 0 a 20',
          it: 'Scala di valutazione francese da 0 a 20',
          es: 'Escala de calificacion francesa de 0 a 20',
          ru: 'Французская шкала оценок от 0 до 20',
        },
        countryCode: 'FR',
        scaleType: 'numeric',
        bestIsHighest: true,
        minValue: 0,
        maxValue: 20,
        passingThreshold: 10,
        gradeDefinitions: [
          { grade: '20', numeric_value: 20, normalized_100: 100, quality_tier: 'best' },
          { grade: '19', numeric_value: 19, normalized_100: 95, quality_tier: 'best' },
          { grade: '18', numeric_value: 18, normalized_100: 90, quality_tier: 'best' },
          { grade: '17', numeric_value: 17, normalized_100: 85, quality_tier: 'best' },
          { grade: '16', numeric_value: 16, normalized_100: 80, quality_tier: 'second' },
          { grade: '15', numeric_value: 15, normalized_100: 75, quality_tier: 'second' },
          { grade: '14', numeric_value: 14, normalized_100: 70, quality_tier: 'second' },
          { grade: '13', numeric_value: 13, normalized_100: 65, quality_tier: 'third' },
          { grade: '12', numeric_value: 12, normalized_100: 60, quality_tier: 'third' },
          { grade: '11', numeric_value: 11, normalized_100: 55, quality_tier: 'third' },
          { grade: '10', numeric_value: 10, normalized_100: 50, quality_tier: 'third' },
          { grade: '9', numeric_value: 9, normalized_100: 45, quality_tier: 'below' },
          { grade: '8', numeric_value: 8, normalized_100: 40, quality_tier: 'below' },
          { grade: '7', numeric_value: 7, normalized_100: 35, quality_tier: 'below' },
          { grade: '6', numeric_value: 6, normalized_100: 30, quality_tier: 'below' },
          { grade: '5', numeric_value: 5, normalized_100: 25, quality_tier: 'below' },
          { grade: '4', numeric_value: 4, normalized_100: 20, quality_tier: 'below' },
          { grade: '3', numeric_value: 3, normalized_100: 15, quality_tier: 'below' },
          { grade: '2', numeric_value: 2, normalized_100: 10, quality_tier: 'below' },
          { grade: '1', numeric_value: 1, normalized_100: 5, quality_tier: 'below' },
          { grade: '0', numeric_value: 0, normalized_100: 0, quality_tier: 'below' },
        ],
        displayOrder: 6,
        isActive: true,
      },
    ])
    .onConflictDoNothing()
    .returning()

  // ---------------------------------------------------------------------------
  // Subject categories (6 categories with code-based upsert)
  // ---------------------------------------------------------------------------
  console.log('Seeding subject categories...')
  const categoryValues = [
    {
      code: 'languages',
      name: {
        en: 'Languages',
        de: 'Sprachen',
        fr: 'Langues',
        it: 'Lingue',
        es: 'Idiomas',
        ru: 'Языки',
      },
      description: { en: 'Language subjects' },
      displayOrder: 1,
    },
    {
      code: 'mathematics',
      name: {
        en: 'Mathematics & Informatics',
        de: 'Mathematik & Informatik',
        fr: 'Math\u00e9matiques & Informatique',
        it: 'Matematica & Informatica',
        es: 'Matem\u00e1ticas e Inform\u00e1tica',
        ru: 'Математика и информатика',
      },
      description: { en: 'Mathematics and informatics subjects' },
      displayOrder: 2,
    },
    {
      code: 'sciences',
      name: {
        en: 'Natural Sciences',
        de: 'Naturwissenschaften',
        fr: 'Sciences naturelles',
        it: 'Scienze naturali',
        es: 'Ciencias naturales',
        ru: 'Естественные науки',
      },
      description: { en: 'Natural science subjects' },
      displayOrder: 3,
    },
    {
      code: 'humanities',
      name: {
        en: 'Social Sciences & Humanities',
        de: 'Sozial- & Geisteswissenschaften',
        fr: 'Sciences sociales & Humanit\u00e9s',
        it: 'Scienze sociali & Umanistiche',
        es: 'Ciencias sociales y Humanidades',
        ru: 'Общественные и гуманитарные науки',
      },
      description: { en: 'Social sciences and humanities subjects' },
      displayOrder: 4,
    },
    {
      code: 'arts',
      name: {
        en: 'Arts & Music',
        de: 'Kunst & Musik',
        fr: 'Arts & Musique',
        it: 'Arte & Musica',
        es: 'Artes y M\u00fasica',
        ru: 'Искусство и музыка',
      },
      description: { en: 'Arts and music subjects' },
      displayOrder: 5,
    },
    {
      code: 'sports_health',
      name: {
        en: 'Sports & Health',
        de: 'Sport & Gesundheit',
        fr: 'Sport & Sant\u00e9',
        it: 'Sport & Salute',
        es: 'Deportes y Salud',
        ru: 'Спорт и здоровье',
      },
      description: { en: 'Sports and health subjects' },
      displayOrder: 6,
    },
  ]

  const insertedCategories = await db
    .insert(subjectCategories)
    .values(categoryValues)
    .onConflictDoUpdate({
      target: subjectCategories.code,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        displayOrder: sql`excluded.display_order`,
      },
    })
    .returning()

  const catMap: Record<string, string> = {}
  for (const cat of insertedCategories) {
    if (cat.code) catMap[cat.code] = cat.id
  }

  // ---------------------------------------------------------------------------
  // Subjects (46 subjects across 6 categories, code-based upsert)
  // ---------------------------------------------------------------------------
  console.log('Seeding subjects...')
  const subjectValues = [
    // -- Languages (15) ------------------------------------------------------
    {
      code: 'german',
      name: {
        en: 'German',
        de: 'Deutsch',
        fr: 'Allemand',
        it: 'Tedesco',
        es: 'Alem\u00e1n',
        ru: 'Немецкий',
      },
      categoryId: catMap['languages'],
      isCoreSubject: true,
      displayOrder: 1,
    },
    {
      code: 'english',
      name: {
        en: 'English',
        de: 'Englisch',
        fr: 'Anglais',
        it: 'Inglese',
        es: 'Ingl\u00e9s',
        ru: 'Английский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: true,
      displayOrder: 2,
    },
    {
      code: 'french',
      name: {
        en: 'French',
        de: 'Franz\u00f6sisch',
        fr: 'Fran\u00e7ais',
        it: 'Francese',
        es: 'Franc\u00e9s',
        ru: 'Французский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 3,
    },
    {
      code: 'spanish',
      name: {
        en: 'Spanish',
        de: 'Spanisch',
        fr: 'Espagnol',
        it: 'Spagnolo',
        es: 'Espa\u00f1ol',
        ru: 'Испанский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 4,
    },
    {
      code: 'italian',
      name: {
        en: 'Italian',
        de: 'Italienisch',
        fr: 'Italien',
        it: 'Italiano',
        es: 'Italiano',
        ru: 'Итальянский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 5,
    },
    {
      code: 'russian',
      name: {
        en: 'Russian',
        de: 'Russisch',
        fr: 'Russe',
        it: 'Russo',
        es: 'Ruso',
        ru: 'Русский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 6,
    },
    {
      code: 'portuguese',
      name: {
        en: 'Portuguese',
        de: 'Portugiesisch',
        fr: 'Portugais',
        it: 'Portoghese',
        es: 'Portugu\u00e9s',
        ru: 'Португальский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 7,
    },
    {
      code: 'latin',
      name: {
        en: 'Latin',
        de: 'Latein',
        fr: 'Latin',
        it: 'Latino',
        es: 'Lat\u00edn',
        ru: 'Латынь',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 8,
    },
    {
      code: 'ancient_greek',
      name: {
        en: 'Ancient Greek',
        de: 'Altgriechisch',
        fr: 'Grec ancien',
        it: 'Greco antico',
        es: 'Griego antiguo',
        ru: 'Древнегреческий',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 9,
    },
    {
      code: 'dutch',
      name: {
        en: 'Dutch',
        de: 'Niederl\u00e4ndisch',
        fr: 'N\u00e9erlandais',
        it: 'Olandese',
        es: 'Neerland\u00e9s',
        ru: 'Нидерландский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 10,
    },
    {
      code: 'chinese',
      name: {
        en: 'Chinese',
        de: 'Chinesisch',
        fr: 'Chinois',
        it: 'Cinese',
        es: 'Chino',
        ru: 'Китайский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 11,
    },
    {
      code: 'japanese',
      name: {
        en: 'Japanese',
        de: 'Japanisch',
        fr: 'Japonais',
        it: 'Giapponese',
        es: 'Japon\u00e9s',
        ru: 'Японский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 12,
    },
    {
      code: 'arabic',
      name: {
        en: 'Arabic',
        de: 'Arabisch',
        fr: 'Arabe',
        it: 'Arabo',
        es: '\u00c1rabe',
        ru: 'Арабский',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 13,
    },
    {
      code: 'hindi',
      name: {
        en: 'Hindi',
        de: 'Hindi',
        fr: 'Hindi',
        it: 'Hindi',
        es: 'Hindi',
        ru: 'Хинди',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 14,
    },
    {
      code: 'sanskrit',
      name: {
        en: 'Sanskrit',
        de: 'Sanskrit',
        fr: 'Sanskrit',
        it: 'Sanscrito',
        es: 'S\u00e1nscrito',
        ru: 'Санскрит',
      },
      categoryId: catMap['languages'],
      isCoreSubject: false,
      displayOrder: 15,
    },

    // -- Mathematics & Informatics (3) ----------------------------------------
    {
      code: 'mathematics',
      name: {
        en: 'Mathematics',
        de: 'Mathematik',
        fr: 'Math\u00e9matiques',
        it: 'Matematica',
        es: 'Matem\u00e1ticas',
        ru: 'Математика',
      },
      categoryId: catMap['mathematics'],
      isCoreSubject: true,
      displayOrder: 16,
    },
    {
      code: 'computer_science',
      name: {
        en: 'Computer Science',
        de: 'Informatik',
        fr: 'Informatique',
        it: 'Informatica',
        es: 'Inform\u00e1tica',
        ru: 'Информатика',
      },
      categoryId: catMap['mathematics'],
      isCoreSubject: false,
      displayOrder: 17,
    },
    {
      code: 'statistics',
      name: {
        en: 'Statistics',
        de: 'Statistik',
        fr: 'Statistiques',
        it: 'Statistica',
        es: 'Estad\u00edstica',
        ru: 'Статистика',
      },
      categoryId: catMap['mathematics'],
      isCoreSubject: false,
      displayOrder: 18,
    },

    // -- Natural Sciences (7) -------------------------------------------------
    {
      code: 'physics',
      name: {
        en: 'Physics',
        de: 'Physik',
        fr: 'Physique',
        it: 'Fisica',
        es: 'F\u00edsica',
        ru: 'Физика',
      },
      categoryId: catMap['sciences'],
      isCoreSubject: true,
      displayOrder: 19,
    },
    {
      code: 'chemistry',
      name: {
        en: 'Chemistry',
        de: 'Chemie',
        fr: 'Chimie',
        it: 'Chimica',
        es: 'Qu\u00edmica',
        ru: 'Химия',
      },
      categoryId: catMap['sciences'],
      isCoreSubject: true,
      displayOrder: 20,
    },
    {
      code: 'biology',
      name: {
        en: 'Biology',
        de: 'Biologie',
        fr: 'Biologie',
        it: 'Biologia',
        es: 'Biolog\u00eda',
        ru: 'Биология',
      },
      categoryId: catMap['sciences'],
      isCoreSubject: true,
      displayOrder: 21,
    },
    {
      code: 'earth_science',
      name: {
        en: 'Earth Science',
        de: 'Geowissenschaften',
        fr: 'Sciences de la Terre',
        it: 'Scienze della Terra',
        es: 'Ciencias de la Tierra',
        ru: 'Науки о Земле',
      },
      categoryId: catMap['sciences'],
      isCoreSubject: false,
      displayOrder: 22,
    },
    {
      code: 'environmental_science',
      name: {
        en: 'Environmental Science',
        de: 'Umweltwissenschaften',
        fr: "Sciences de l'environnement",
        it: 'Scienze ambientali',
        es: 'Ciencias ambientales',
        ru: 'Экология',
      },
      categoryId: catMap['sciences'],
      isCoreSubject: false,
      displayOrder: 23,
    },
    {
      code: 'astronomy',
      name: {
        en: 'Astronomy',
        de: 'Astronomie',
        fr: 'Astronomie',
        it: 'Astronomia',
        es: 'Astronom\u00eda',
        ru: 'Астрономия',
      },
      categoryId: catMap['sciences'],
      isCoreSubject: false,
      displayOrder: 24,
    },
    {
      code: 'general_science',
      name: {
        en: 'General Science',
        de: 'Allgemeine Naturwissenschaften',
        fr: 'Sciences g\u00e9n\u00e9rales',
        it: 'Scienze generali',
        es: 'Ciencias generales',
        ru: 'Общие естественные науки',
      },
      categoryId: catMap['sciences'],
      isCoreSubject: false,
      displayOrder: 25,
    },

    // -- Social Sciences & Humanities (11) ------------------------------------
    {
      code: 'history',
      name: {
        en: 'History',
        de: 'Geschichte',
        fr: 'Histoire',
        it: 'Storia',
        es: 'Historia',
        ru: 'История',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: true,
      displayOrder: 26,
    },
    {
      code: 'geography',
      name: {
        en: 'Geography',
        de: 'Erdkunde',
        fr: 'G\u00e9ographie',
        it: 'Geografia',
        es: 'Geograf\u00eda',
        ru: 'География',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 27,
    },
    {
      code: 'economics',
      name: {
        en: 'Economics',
        de: 'Wirtschaft',
        fr: '\u00c9conomie',
        it: 'Economia',
        es: 'Econom\u00eda',
        ru: 'Экономика',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 28,
    },
    {
      code: 'philosophy',
      name: {
        en: 'Philosophy',
        de: 'Philosophie',
        fr: 'Philosophie',
        it: 'Filosofia',
        es: 'Filosof\u00eda',
        ru: 'Философия',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 29,
    },
    {
      code: 'psychology',
      name: {
        en: 'Psychology',
        de: 'Psychologie',
        fr: 'Psychologie',
        it: 'Psicologia',
        es: 'Psicolog\u00eda',
        ru: 'Психология',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 30,
    },
    {
      code: 'sociology',
      name: {
        en: 'Sociology',
        de: 'Soziologie',
        fr: 'Sociologie',
        it: 'Sociologia',
        es: 'Sociolog\u00eda',
        ru: 'Социология',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 31,
    },
    {
      code: 'political_science',
      name: {
        en: 'Political Science',
        de: 'Politikwissenschaft',
        fr: 'Sciences politiques',
        it: 'Scienze politiche',
        es: 'Ciencias pol\u00edticas',
        ru: 'Политология',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 32,
    },
    {
      code: 'law',
      name: {
        en: 'Law',
        de: 'Recht',
        fr: 'Droit',
        it: 'Diritto',
        es: 'Derecho',
        ru: 'Право',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 33,
    },
    {
      code: 'religious_studies',
      name: {
        en: 'Religious Studies',
        de: 'Religion',
        fr: '\u00c9tudes religieuses',
        it: 'Studi religiosi',
        es: 'Estudios religiosos',
        ru: 'Религиоведение',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 34,
    },
    {
      code: 'ethics',
      name: {
        en: 'Ethics',
        de: 'Ethik',
        fr: '\u00c9thique',
        it: 'Etica',
        es: '\u00c9tica',
        ru: 'Этика',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 35,
    },
    {
      code: 'social_studies',
      name: {
        en: 'Social Studies',
        de: 'Sozialkunde',
        fr: '\u00c9tudes sociales',
        it: 'Studi sociali',
        es: 'Estudios sociales',
        ru: 'Обществознание',
      },
      categoryId: catMap['humanities'],
      isCoreSubject: false,
      displayOrder: 36,
    },

    // -- Arts & Music (7) -----------------------------------------------------
    {
      code: 'visual_arts',
      name: {
        en: 'Visual Arts',
        de: 'Bildende Kunst',
        fr: 'Arts visuels',
        it: 'Arti visive',
        es: 'Artes visuales',
        ru: 'Изобразительное искусство',
      },
      categoryId: catMap['arts'],
      isCoreSubject: false,
      displayOrder: 37,
    },
    {
      code: 'music',
      name: {
        en: 'Music',
        de: 'Musik',
        fr: 'Musique',
        it: 'Musica',
        es: 'M\u00fasica',
        ru: 'Музыка',
      },
      categoryId: catMap['arts'],
      isCoreSubject: false,
      displayOrder: 38,
    },
    {
      code: 'theater_drama',
      name: {
        en: 'Theater/Drama',
        de: 'Theater/Darstellendes Spiel',
        fr: 'Th\u00e9\u00e2tre/Art dramatique',
        it: 'Teatro/Drammaturgia',
        es: 'Teatro/Drama',
        ru: 'Театр/Драма',
      },
      categoryId: catMap['arts'],
      isCoreSubject: false,
      displayOrder: 39,
    },
    {
      code: 'dance',
      name: {
        en: 'Dance',
        de: 'Tanz',
        fr: 'Danse',
        it: 'Danza',
        es: 'Danza',
        ru: 'Танец',
      },
      categoryId: catMap['arts'],
      isCoreSubject: false,
      displayOrder: 40,
    },
    {
      code: 'film_studies',
      name: {
        en: 'Film Studies',
        de: 'Filmwissenschaft',
        fr: '\u00c9tudes cin\u00e9matographiques',
        it: 'Studi cinematografici',
        es: 'Estudios cinematogr\u00e1ficos',
        ru: 'Киноведение',
      },
      categoryId: catMap['arts'],
      isCoreSubject: false,
      displayOrder: 41,
    },
    {
      code: 'media_studies',
      name: {
        en: 'Media Studies',
        de: 'Medienwissenschaft',
        fr: '\u00c9tudes des m\u00e9dias',
        it: 'Studi sui media',
        es: 'Estudios de medios',
        ru: 'Медиаведение',
      },
      categoryId: catMap['arts'],
      isCoreSubject: false,
      displayOrder: 42,
    },
    {
      code: 'design_technology',
      name: {
        en: 'Design & Technology',
        de: 'Design & Technologie',
        fr: 'Design & Technologie',
        it: 'Design & Tecnologia',
        es: 'Dise\u00f1o y Tecnolog\u00eda',
        ru: 'Дизайн и технология',
      },
      categoryId: catMap['arts'],
      isCoreSubject: false,
      displayOrder: 43,
    },

    // -- Sports & Health (3) --------------------------------------------------
    {
      code: 'physical_education',
      name: {
        en: 'Physical Education',
        de: 'Sport',
        fr: '\u00c9ducation physique',
        it: 'Educazione fisica',
        es: 'Educaci\u00f3n f\u00edsica',
        ru: 'Физкультура',
      },
      categoryId: catMap['sports_health'],
      isCoreSubject: false,
      displayOrder: 44,
    },
    {
      code: 'health_education',
      name: {
        en: 'Health Education',
        de: 'Gesundheitserziehung',
        fr: '\u00c9ducation \u00e0 la sant\u00e9',
        it: 'Educazione alla salute',
        es: 'Educaci\u00f3n para la salud',
        ru: 'Здоровьесбережение',
      },
      categoryId: catMap['sports_health'],
      isCoreSubject: false,
      displayOrder: 45,
    },
    {
      code: 'home_economics',
      name: {
        en: 'Home Economics',
        de: 'Hauswirtschaft',
        fr: '\u00c9conomie domestique',
        it: 'Economia domestica',
        es: 'Econom\u00eda dom\u00e9stica',
        ru: 'Домоводство',
      },
      categoryId: catMap['sports_health'],
      isCoreSubject: false,
      displayOrder: 46,
    },
  ]

  await db
    .insert(subjects)
    .values(subjectValues)
    .onConflictDoUpdate({
      target: subjects.code,
      set: {
        name: sql`excluded.name`,
        categoryId: sql`excluded.category_id`,
        isCoreSubject: sql`excluded.is_core_subject`,
        displayOrder: sql`excluded.display_order`,
      },
    })

  // ---------------------------------------------------------------------------
  // Bonus factor defaults
  // ---------------------------------------------------------------------------
  // Bonus formula: class_level x term_factor x grade_factor (floored at 0)
  console.log('Seeding bonus factor defaults...')
  await db
    .insert(bonusFactorDefaults)
    .values([
      {
        factorType: 'grade_tier',
        factorKey: 'best',
        factorValue: 2,
        description: 'Grade factor for best-tier grades',
      },
      {
        factorType: 'grade_tier',
        factorKey: 'second',
        factorValue: 1,
        description: 'Grade factor for second-tier grades',
      },
      {
        factorType: 'grade_tier',
        factorKey: 'third',
        factorValue: 0,
        description: 'Grade factor for average grades',
      },
      {
        factorType: 'grade_tier',
        factorKey: 'below',
        factorValue: -1,
        description: 'Grade factor for below-average grades',
      },
      {
        factorType: 'term_type',
        factorKey: 'midterm',
        factorValue: 1.0,
        description: 'Term factor for midterm',
      },
      {
        factorType: 'term_type',
        factorKey: 'final',
        factorValue: 1.5,
        description: 'Term factor for final term',
      },
      {
        factorType: 'term_type',
        factorKey: 'semester',
        factorValue: 1.2,
        description: 'Term factor for semester',
      },
      {
        factorType: 'term_type',
        factorKey: 'quarterly',
        factorValue: 0.8,
        description: 'Term factor for quarterly',
      },
    ])
    .onConflictDoNothing()

  console.log('Seed complete.')
  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
