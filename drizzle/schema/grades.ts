import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userProfiles } from './users'

export const scaleTypeEnum = pgEnum('scale_type', ['letter', 'numeric', 'percentage'])
export const gradeQualityTierEnum = pgEnum('grade_quality_tier', [
  'best',
  'second',
  'third',
  'below',
])
// term_type changed from enum to text to support international term types (migration 0006)

export const gradingSystems = pgTable('grading_systems', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code'),
  name: jsonb('name'),
  description: jsonb('description'),
  countryCode: text('country_code'),
  scaleType: scaleTypeEnum('scale_type').notNull(),
  bestIsHighest: boolean('best_is_highest').default(true).notNull(),
  minValue: real('min_value'),
  maxValue: real('max_value'),
  passingThreshold: real('passing_threshold'),
  gradeDefinitions: jsonb('grade_definitions'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const subjectCategories = pgTable('subject_categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').unique(),
  name: jsonb('name').notNull(),
  description: jsonb('description'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const subjects = pgTable('subjects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').unique(),
  name: jsonb('name').notNull(),
  aliases: jsonb('aliases').default([]),
  description: jsonb('description'),
  categoryId: text('category_id').references(() => subjectCategories.id),
  isCoreSubject: boolean('is_core_subject').default(false),
  isActive: boolean('is_active').default(true).notNull(),
  isCustom: boolean('is_custom').default(false).notNull(),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const subjectsRelations = relations(subjects, ({ one }) => ({
  category: one(subjectCategories, {
    fields: [subjects.categoryId],
    references: [subjectCategories.id],
  }),
}))

export const termGrades = pgTable('term_grades', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  childId: text('child_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  schoolYear: text('school_year').notNull(),
  termType: text('term_type').notNull(),
  gradingSystemId: text('grading_system_id')
    .notNull()
    .references(() => gradingSystems.id),
  classLevel: integer('class_level').notNull(),
  termName: text('term_name'),
  status: text('status').default('submitted'),
  totalBonusPoints: real('total_bonus_points'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const termGradesRelations = relations(termGrades, ({ one, many }) => ({
  child: one(userProfiles, {
    fields: [termGrades.childId],
    references: [userProfiles.id],
  }),
  gradingSystem: one(gradingSystems, {
    fields: [termGrades.gradingSystemId],
    references: [gradingSystems.id],
  }),
  subjectGrades: many(subjectGrades),
}))

export const subjectGrades = pgTable('subject_grades', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  termGradeId: text('term_grade_id')
    .notNull()
    .references(() => termGrades.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').references(() => subjects.id),
  gradeValue: text('grade_value'),
  gradeNumeric: real('grade_numeric'),
  gradeNormalized100: real('grade_normalized_100'),
  gradeQualityTier: gradeQualityTierEnum('grade_quality_tier'),
  subjectWeight: real('subject_weight').default(1),
  bonusPoints: real('bonus_points'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const subjectGradesRelations = relations(subjectGrades, ({ one }) => ({
  termGrade: one(termGrades, {
    fields: [subjectGrades.termGradeId],
    references: [termGrades.id],
  }),
  subject: one(subjects, {
    fields: [subjectGrades.subjectId],
    references: [subjects.id],
  }),
}))
