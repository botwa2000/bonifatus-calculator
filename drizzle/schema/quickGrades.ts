import { pgTable, text, timestamp, real, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userProfiles } from './users'
import { subjects, gradingSystems, gradeQualityTierEnum } from './grades'
import { settlements } from './settlements'

export const quickGrades = pgTable('quick_grades', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  childId: text('child_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id),
  gradingSystemId: text('grading_system_id')
    .notNull()
    .references(() => gradingSystems.id),
  classLevel: integer('class_level').notNull(),
  gradeValue: text('grade_value').notNull(),
  gradeNormalized100: real('grade_normalized_100'),
  gradeQualityTier: gradeQualityTierEnum('grade_quality_tier'),
  bonusPoints: real('bonus_points'),
  note: text('note'),
  settlementStatus: text('settlement_status').default('unsettled').notNull(),
  settlementId: text('settlement_id').references(() => settlements.id, { onDelete: 'set null' }),
  gradedAt: timestamp('graded_at', { mode: 'date' }).defaultNow(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const quickGradesRelations = relations(quickGrades, ({ one }) => ({
  child: one(userProfiles, {
    fields: [quickGrades.childId],
    references: [userProfiles.id],
  }),
  subject: one(subjects, {
    fields: [quickGrades.subjectId],
    references: [subjects.id],
  }),
  gradingSystem: one(gradingSystems, {
    fields: [quickGrades.gradingSystemId],
    references: [gradingSystems.id],
  }),
  settlement: one(settlements, {
    fields: [quickGrades.settlementId],
    references: [settlements.id],
  }),
}))
