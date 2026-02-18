import { pgTable, text, jsonb } from 'drizzle-orm/pg-core'

export const scanConfig = pgTable('scan_config', {
  key: text('key').primaryKey(),
  data: jsonb('data').notNull().default([]),
})
