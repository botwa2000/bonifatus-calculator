import { pgTable, text, timestamp, boolean, real } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userProfiles } from './users'

export const bonusFactorDefaults = pgTable('bonus_factor_defaults', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  factorType: text('factor_type').notNull(),
  factorKey: text('factor_key').notNull(),
  factorValue: real('factor_value').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const userBonusFactors = pgTable('user_bonus_factors', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  childId: text('child_id').references(() => userProfiles.id, {
    onDelete: 'cascade',
  }),
  factorType: text('factor_type').notNull(),
  factorKey: text('factor_key').notNull(),
  factorValue: real('factor_value').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
})

export const userBonusFactorsRelations = relations(userBonusFactors, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userBonusFactors.userId],
    references: [userProfiles.id],
    relationName: 'userFactors',
  }),
  child: one(userProfiles, {
    fields: [userBonusFactors.childId],
    references: [userProfiles.id],
    relationName: 'childFactors',
  }),
}))
