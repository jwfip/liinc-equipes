import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  date,
  serial,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Tables ────────────────────────────────────────────────────

export const teams = pgTable('teams', {
  id:        uuid('id').primaryKey().defaultRandom(),
  number:    integer('number').notNull(),
  name:      text('name').notNull(),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const mentors = pgTable('mentors', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  email:     text('email').notNull().unique(),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const blocks = pgTable('blocks', {
  id:        serial('id').primaryKey(),
  label:     text('label').notNull(),
  date:      date('date').notNull(),
  active:    boolean('active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const mentoringRecords = pgTable('mentoring_records', {
  id:        uuid('id').primaryKey().defaultRandom(),
  teamId:    uuid('team_id').notNull().references(() => teams.id),
  mentorId:  uuid('mentor_id').notNull().references(() => mentors.id),
  blockId:   integer('block_id').notNull().references(() => blocks.id),
  status:    text('status').notNull(), // 'ok' | 'attention' | 'emergency' | 'flying'
  working:   text('working'),
  advice:    text('advice'),
  pros:      text('pros'),
  cons:      text('cons'),
  obs:       text('obs'),
  suggestion: text('suggestion'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── NextAuth tables ──────────────────────────────────────────

export const users = pgTable('users', {
  id:            text('id').primaryKey(),
  name:          text('name'),
  email:         text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image:         text('image'),
  role:          text('role').notNull().default('mentor'), // 'mentor' | 'admin'
  createdAt:     timestamp('created_at').defaultNow(),
})

export const accounts = pgTable('accounts', {
  userId:            text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId:       text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires:      timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { mode: 'date' }).notNull(),
})

// ── Relations ────────────────────────────────────────────────

export const mentoringRecordsRelations = relations(mentoringRecords, ({ one }) => ({
  team:   one(teams,   { fields: [mentoringRecords.teamId],   references: [teams.id]   }),
  mentor: one(mentors, { fields: [mentoringRecords.mentorId], references: [mentors.id] }),
  block:  one(blocks,  { fields: [mentoringRecords.blockId],  references: [blocks.id]  }),
}))

export const teamsRelations = relations(teams, ({ many }) => ({
  records: many(mentoringRecords),
}))

export const mentorsRelations = relations(mentors, ({ many }) => ({
  records: many(mentoringRecords),
}))

export const blocksRelations = relations(blocks, ({ many }) => ({
  records: many(mentoringRecords),
}))
