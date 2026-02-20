import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userProfiles } from './users'

export const investmentSimulations = pgTable('investment_simulations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text('parent_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  childId: text('child_id').references(() => userProfiles.id, { onDelete: 'cascade' }),
  simulationType: text('simulation_type').notNull(), // savings, etf
  config: jsonb('config').default({}).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})

export const investmentSimulationsRelations = relations(investmentSimulations, ({ one }) => ({
  parent: one(userProfiles, {
    fields: [investmentSimulations.parentId],
    references: [userProfiles.id],
    relationName: 'parentSimulations',
  }),
  child: one(userProfiles, {
    fields: [investmentSimulations.childId],
    references: [userProfiles.id],
    relationName: 'childSimulations',
  }),
}))
