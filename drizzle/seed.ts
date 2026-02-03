import 'dotenv/config'
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

  console.log('Seeding grading systems...')
  const [germanSystem] = await db
    .insert(gradingSystems)
    .values([
      {
        code: 'DE_1_6',
        name: { en: 'German System (1-6)', de: 'Deutsches Notensystem (1-6)' },
        description: {
          en: 'German grading scale from 1 (very good) to 6 (insufficient)',
          de: 'Deutsche Notenskala von 1 (sehr gut) bis 6 (ungenügend)',
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
        name: { en: 'US Letter Grade (A-F)' },
        description: { en: 'American letter grading scale from A to F' },
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
        name: { en: 'Austrian System (1-5)', de: 'Österreichisches Notensystem (1-5)' },
        description: {
          en: 'Austrian grading scale from 1 (very good) to 5 (insufficient)',
          de: 'Österreichische Notenskala von 1 (Sehr gut) bis 5 (Nicht genügend)',
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
        name: { en: 'Swiss System (6-1)', de: 'Schweizer Notensystem (6-1)' },
        description: {
          en: 'Swiss grading scale from 6 (excellent) to 1 (very poor)',
          de: 'Schweizer Notenskala von 6 (ausgezeichnet) bis 1 (sehr schlecht)',
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
        name: { en: 'UK GCSE (9-1)' },
        description: { en: 'UK GCSE grading scale from 9 (highest) to 1 (lowest)' },
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
        name: { en: 'French System (0-20)', fr: 'Système français (0-20)' },
        description: {
          en: 'French grading scale from 0 to 20',
          fr: 'Système de notation français de 0 à 20',
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

  console.log('Seeding subject categories...')
  const categoryValues = [
    {
      name: { en: 'Languages', de: 'Sprachen' },
      description: { en: 'Language subjects' },
      displayOrder: 1,
    },
    {
      name: { en: 'STEM', de: 'MINT' },
      description: { en: 'Science, Technology, Engineering, Mathematics' },
      displayOrder: 2,
    },
    {
      name: { en: 'Humanities', de: 'Geisteswissenschaften' },
      description: { en: 'Social sciences and humanities' },
      displayOrder: 3,
    },
    {
      name: { en: 'Arts & Sports', de: 'Kunst & Sport' },
      description: { en: 'Creative and physical subjects' },
      displayOrder: 4,
    },
  ]
  const insertedCategories = await db
    .insert(subjectCategories)
    .values(categoryValues)
    .onConflictDoNothing()
    .returning()

  const catMap: Record<string, string> = {}
  for (const cat of insertedCategories) {
    const enName = (cat.name as Record<string, string>)?.en
    if (enName) catMap[enName] = cat.id
  }

  console.log('Seeding subjects...')
  await db
    .insert(subjects)
    .values([
      {
        name: { en: 'German', de: 'Deutsch' },
        categoryId: catMap['Languages'],
        isCoreSubject: true,
        displayOrder: 1,
      },
      {
        name: { en: 'English', de: 'Englisch' },
        categoryId: catMap['Languages'],
        isCoreSubject: true,
        displayOrder: 2,
      },
      {
        name: { en: 'French', de: 'Französisch' },
        categoryId: catMap['Languages'],
        isCoreSubject: false,
        displayOrder: 3,
      },
      {
        name: { en: 'Mathematics', de: 'Mathematik' },
        categoryId: catMap['STEM'],
        isCoreSubject: true,
        displayOrder: 4,
      },
      {
        name: { en: 'Physics', de: 'Physik' },
        categoryId: catMap['STEM'],
        isCoreSubject: true,
        displayOrder: 5,
      },
      {
        name: { en: 'Chemistry', de: 'Chemie' },
        categoryId: catMap['STEM'],
        isCoreSubject: true,
        displayOrder: 6,
      },
      {
        name: { en: 'Biology', de: 'Biologie' },
        categoryId: catMap['STEM'],
        isCoreSubject: true,
        displayOrder: 7,
      },
      {
        name: { en: 'Computer Science', de: 'Informatik' },
        categoryId: catMap['STEM'],
        isCoreSubject: false,
        displayOrder: 8,
      },
      {
        name: { en: 'History', de: 'Geschichte' },
        categoryId: catMap['Humanities'],
        isCoreSubject: true,
        displayOrder: 9,
      },
      {
        name: { en: 'Geography', de: 'Erdkunde' },
        categoryId: catMap['Humanities'],
        isCoreSubject: false,
        displayOrder: 10,
      },
      {
        name: { en: 'Social Studies', de: 'Sozialkunde' },
        categoryId: catMap['Humanities'],
        isCoreSubject: false,
        displayOrder: 11,
      },
      {
        name: { en: 'Art', de: 'Kunst' },
        categoryId: catMap['Arts & Sports'],
        isCoreSubject: false,
        displayOrder: 12,
      },
      {
        name: { en: 'Music', de: 'Musik' },
        categoryId: catMap['Arts & Sports'],
        isCoreSubject: false,
        displayOrder: 13,
      },
      {
        name: { en: 'Physical Education', de: 'Sport' },
        categoryId: catMap['Arts & Sports'],
        isCoreSubject: false,
        displayOrder: 14,
      },
      {
        name: { en: 'Religion', de: 'Religion' },
        categoryId: catMap['Humanities'],
        isCoreSubject: false,
        displayOrder: 15,
      },
      {
        name: { en: 'Ethics', de: 'Ethik' },
        categoryId: catMap['Humanities'],
        isCoreSubject: false,
        displayOrder: 16,
      },
      {
        name: { en: 'Latin', de: 'Latein' },
        categoryId: catMap['Languages'],
        isCoreSubject: false,
        displayOrder: 17,
      },
      {
        name: { en: 'Spanish', de: 'Spanisch' },
        categoryId: catMap['Languages'],
        isCoreSubject: false,
        displayOrder: 18,
      },
      {
        name: { en: 'Economics', de: 'Wirtschaft' },
        categoryId: catMap['Humanities'],
        isCoreSubject: false,
        displayOrder: 19,
      },
      {
        name: { en: 'Philosophy', de: 'Philosophie' },
        categoryId: catMap['Humanities'],
        isCoreSubject: false,
        displayOrder: 20,
      },
      {
        name: { en: 'Theater/Drama', de: 'Theater/Darstellendes Spiel' },
        categoryId: catMap['Arts & Sports'],
        isCoreSubject: false,
        displayOrder: 21,
      },
    ])
    .onConflictDoNothing()

  // Bonus formula: class_level × term_factor × grade_factor (floored at 0)
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
