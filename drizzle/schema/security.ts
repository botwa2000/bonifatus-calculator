import { pgTable, pgEnum, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { userProfiles } from './users'

export const securityEventTypeEnum = pgEnum('security_event_type', [
  'login_success',
  'login_failure',
  'password_reset',
  'email_change',
  'suspicious_activity',
  'account_lockout',
  'rate_limit_exceeded',
  'unauthorized_access_attempt',
])
export const eventSeverityEnum = pgEnum('event_severity', ['info', 'warning', 'critical'])
export const rateLimitActionEnum = pgEnum('rate_limit_action', [
  'login',
  'register',
  'password_reset',
  'api_request',
  'email_send',
])
export const verificationPurposeEnum = pgEnum('verification_purpose', [
  'email_verification',
  'password_reset',
])

export const securityEvents = pgTable('security_events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventType: securityEventTypeEnum('event_type').notNull(),
  severity: eventSeverityEnum('severity').default('info').notNull(),
  userId: text('user_id').references(() => userProfiles.id, {
    onDelete: 'set null',
  }),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  eventMetadata: jsonb('event_metadata').default({}),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const rateLimitTracking = pgTable('rate_limit_tracking', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  actionType: rateLimitActionEnum('action_type').notNull(),
  windowStart: timestamp('window_start', { mode: 'date' }).notNull(),
  attemptCount: integer('attempt_count').default(1).notNull(),
  lastAttemptAt: timestamp('last_attempt_at', { mode: 'date' }).defaultNow().notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  lockedUntil: timestamp('locked_until', { mode: 'date' }),
})

export const verificationCodes = pgTable('verification_codes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  code: text('code').notNull(),
  purpose: verificationPurposeEnum('purpose').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  verifiedAt: timestamp('verified_at', { mode: 'date' }),
  attemptCount: integer('attempt_count').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})
