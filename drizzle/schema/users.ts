import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  date,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './auth'

export const userRoleEnum = pgEnum('user_role', ['parent', 'child', 'admin'])
export const themePreferenceEnum = pgEnum('theme_preference', ['light', 'dark', 'system'])
export const textDirectionEnum = pgEnum('text_direction', ['ltr', 'rtl'])

export const languages = pgTable('languages', {
  code: text('code').primaryKey(),
  nameNative: text('name_native').notNull(),
  nameEnglish: text('name_english').notNull(),
  textDirection: textDirectionEnum('text_direction').default('ltr').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const userProfiles = pgTable('user_profiles', {
  id: text('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').notNull(),
  fullName: text('full_name').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  avatarUrl: text('avatar_url'),
  schoolName: text('school_name'),
  preferredLanguage: text('preferred_language')
    .default('en')
    .notNull()
    .references(() => languages.code),
  themePreference: themePreferenceEnum('theme_preference').default('system').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  notificationPreferences: jsonb('notification_preferences')
    .default({
      email_grade_reminders: true,
      email_reward_updates: true,
      email_security_alerts: true,
    })
    .notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  termsAcceptedAt: timestamp('terms_accepted_at', { mode: 'date' }),
  privacyPolicyAcceptedAt: timestamp('privacy_policy_accepted_at', {
    mode: 'date',
  }),
  isActive: boolean('is_active').default(true).notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.id],
    references: [users.id],
  }),
  language: one(languages, {
    fields: [userProfiles.preferredLanguage],
    references: [languages.code],
  }),
}))
