import { pgTable, pgEnum, text, timestamp, unique, check } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { userProfiles } from './users'

export const relationshipTypeEnum = pgEnum('relationship_type', ['parent', 'guardian', 'tutor'])
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'rejected'])
export const inviteStatusEnum = pgEnum('invite_status', [
  'pending',
  'accepted',
  'cancelled',
  'expired',
])

export const parentChildRelationships = pgTable(
  'parent_child_relationships',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    parentId: text('parent_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    childId: text('child_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    relationshipType: relationshipTypeEnum('relationship_type').default('parent').notNull(),
    invitationStatus: invitationStatusEnum('invitation_status').default('pending').notNull(),
    invitedAt: timestamp('invited_at', { mode: 'date' }).defaultNow().notNull(),
    respondedAt: timestamp('responded_at', { mode: 'date' }),
    invitedBy: text('invited_by')
      .notNull()
      .references(() => userProfiles.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    unique('unique_parent_child').on(table.parentId, table.childId),
    check('no_self_relationship', sql`${table.parentId} != ${table.childId}`),
  ]
)

export const parentChildRelationshipsRelations = relations(parentChildRelationships, ({ one }) => ({
  parent: one(userProfiles, {
    fields: [parentChildRelationships.parentId],
    references: [userProfiles.id],
    relationName: 'parentRelationships',
  }),
  child: one(userProfiles, {
    fields: [parentChildRelationships.childId],
    references: [userProfiles.id],
    relationName: 'childRelationships',
  }),
}))

export const parentChildInvites = pgTable('parent_child_invites', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text('parent_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  childId: text('child_id').references(() => userProfiles.id, {
    onDelete: 'set null',
  }),
  code: text('code').notNull().unique(),
  status: inviteStatusEnum('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
})

export const parentChildInvitesRelations = relations(parentChildInvites, ({ one }) => ({
  parent: one(userProfiles, {
    fields: [parentChildInvites.parentId],
    references: [userProfiles.id],
    relationName: 'parentInvites',
  }),
  child: one(userProfiles, {
    fields: [parentChildInvites.childId],
    references: [userProfiles.id],
    relationName: 'childInvites',
  }),
}))
