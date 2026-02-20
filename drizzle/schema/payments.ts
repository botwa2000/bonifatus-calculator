import { pgTable, text, timestamp, boolean, integer, real, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userProfiles } from './users'
import { settlements } from './settlements'

export const paymentAccounts = pgTable('payment_accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  accountType: text('account_type').notNull(), // bank, paypal, wero, stripe
  accountDetails: jsonb('account_details').default({}).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  label: text('label'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const paymentAccountsRelations = relations(paymentAccounts, ({ one }) => ({
  user: one(userProfiles, {
    fields: [paymentAccounts.userId],
    references: [userProfiles.id],
  }),
}))

export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text('parent_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  childId: text('child_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  settlementId: text('settlement_id').references(() => settlements.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),
  currency: text('currency').default('EUR').notNull(),
  method: text('method').default('cash').notNull(),
  status: text('status').default('pending').notNull(), // pending, completed, failed, cancelled
  providerReference: text('provider_reference'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { mode: 'date' }),
})

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  parent: one(userProfiles, {
    fields: [paymentTransactions.parentId],
    references: [userProfiles.id],
    relationName: 'parentTransactions',
  }),
  child: one(userProfiles, {
    fields: [paymentTransactions.childId],
    references: [userProfiles.id],
    relationName: 'childTransactions',
  }),
  settlement: one(settlements, {
    fields: [paymentTransactions.settlementId],
    references: [settlements.id],
  }),
}))

export const pointValueConfig = pgTable('point_value_config', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text('parent_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  childId: text('child_id').references(() => userProfiles.id, { onDelete: 'cascade' }),
  pointValueCents: integer('point_value_cents').default(100).notNull(),
  currency: text('currency').default('EUR').notNull(),
  cashPayoutPct: integer('cash_payout_pct').default(100).notNull(),
  investmentPct: integer('investment_pct').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})

export const pointValueConfigRelations = relations(pointValueConfig, ({ one }) => ({
  parent: one(userProfiles, {
    fields: [pointValueConfig.parentId],
    references: [userProfiles.id],
    relationName: 'parentPointConfig',
  }),
  child: one(userProfiles, {
    fields: [pointValueConfig.childId],
    references: [userProfiles.id],
    relationName: 'childPointConfig',
  }),
}))
