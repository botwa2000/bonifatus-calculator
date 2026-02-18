import { pgTable, text, timestamp, real, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userProfiles } from './users'

export const settlements = pgTable('settlements', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text('parent_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  childId: text('child_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  currency: text('currency').default('EUR').notNull(),
  method: text('method').default('cash').notNull(),
  notes: text('notes'),
  splitConfig: jsonb('split_config'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const settlementsRelations = relations(settlements, ({ one }) => ({
  parent: one(userProfiles, {
    fields: [settlements.parentId],
    references: [userProfiles.id],
    relationName: 'parentSettlements',
  }),
  child: one(userProfiles, {
    fields: [settlements.childId],
    references: [userProfiles.id],
    relationName: 'childSettlements',
  }),
}))
