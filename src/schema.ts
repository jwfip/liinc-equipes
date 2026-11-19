import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  date,
  serial,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ── Tables ────────────────────────────────────────────────────

export const events = pgTable('events', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  company:   text('company'),
  startDate: date('start_date').notNull(),
  endDate:   date('end_date'),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const eventSteps = pgTable('event_steps', {
  id:       serial('id').primaryKey(),
  eventId:  integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  label:    text('label').notNull(),
})

export const teams = pgTable('teams', {
  id:        uuid('id').primaryKey().defaultRandom(),
  eventId:   integer('event_id').notNull().references(() => events.id),
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

export const eventMembers = pgTable('event_members', {
  eventId:   integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  mentorId:  uuid('mentor_id').notNull().references(() => mentors.id, { onDelete: 'cascade' }),
  role:      text('role').notNull().default('mentor'), // 'mentor' | 'specialist'
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.eventId, t.mentorId] }),
}))

export const blocks = pgTable('blocks', {
  id:        serial('id').primaryKey(),
  eventId:   integer('event_id').notNull().references(() => events.id),
  label:     text('label').notNull(),
  date:      date('date').notNull(),
  active:    boolean('active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  oneActivePerEvent: uniqueIndex('blocks_one_active_per_event').on(t.eventId).where(sql`${t.active}`),
}))

export const mentoringRecords = pgTable('mentoring_records', {
  id:        uuid('id').primaryKey().defaultRandom(),
  eventId:   integer('event_id').notNull().references(() => events.id),
  kind:      text('kind').notNull().default('mentoring'), // 'mentoring' | 'specialist'
  teamId:    uuid('team_id').notNull().references(() => teams.id),
  mentorId:  uuid('mentor_id').notNull().references(() => mentors.id),
  blockId:   integer('block_id').references(() => blocks.id), // nulo em atendimento fora de bloco
  status:    text('status'), // 'ok' | 'attention' | 'emergency' | 'flying'; nulo em atendimento
  topic:     text('topic'),  // tema/dúvida do atendimento
  working:   text('working'),
  advice:    text('advice'),
  pros:      text('pros'),
  cons:       text('cons'),
  obs:        text('obs'),
  suggestion: text('suggestion'),
  stepId:     integer('step_id').references(() => eventSteps.id),
  createdAt:  timestamp('created_at').defaultNow(),
})

export const teamStepChanges = pgTable('team_step_changes', {
  id:        serial('id').primaryKey(),
  eventId:   integer('event_id').notNull().references(() => events.id),
  teamId:    uuid('team_id').notNull().references(() => teams.id),
  stepId:    integer('step_id').notNull().references(() => eventSteps.id),
  changedBy: text('changed_by').references(() => users.id),
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
  passwordHash:       text('password_hash'),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  createdAt:     timestamp('created_at').defaultNow(),
})

export const loginAttempts = pgTable('login_attempts', {
  id:          serial('id').primaryKey(),
  username:    text('username').notNull(),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
}, (t) => ({
  byUser: index('login_attempts_username_idx').on(t.username, t.attemptedAt),
}))

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

export const eventsRelations = relations(events, ({ many }) => ({
  teams:   many(teams),
  blocks:  many(blocks),
  steps:   many(eventSteps),
  members: many(eventMembers),
  records: many(mentoringRecords),
}))

export const eventStepsRelations = relations(eventSteps, ({ one, many }) => ({
  event:   one(events, { fields: [eventSteps.eventId], references: [events.id] }),
  records: many(mentoringRecords),
}))

export const eventMembersRelations = relations(eventMembers, ({ one }) => ({
  event:  one(events,  { fields: [eventMembers.eventId],  references: [events.id]  }),
  mentor: one(mentors, { fields: [eventMembers.mentorId], references: [mentors.id] }),
}))

export const mentoringRecordsRelations = relations(mentoringRecords, ({ one }) => ({
  event:  one(events,     { fields: [mentoringRecords.eventId],  references: [events.id]     }),
  team:   one(teams,      { fields: [mentoringRecords.teamId],   references: [teams.id]      }),
  mentor: one(mentors,    { fields: [mentoringRecords.mentorId], references: [mentors.id]    }),
  block:  one(blocks,     { fields: [mentoringRecords.blockId],  references: [blocks.id]     }),
  step:   one(eventSteps, { fields: [mentoringRecords.stepId],   references: [eventSteps.id] }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  event:   one(events, { fields: [teams.eventId], references: [events.id] }),
  records: many(mentoringRecords),
}))

export const mentorsRelations = relations(mentors, ({ many }) => ({
  records:     many(mentoringRecords),
  memberships: many(eventMembers),
}))

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  event:   one(events, { fields: [blocks.eventId], references: [events.id] }),
  records: many(mentoringRecords),
}))

export const teamStepChangesRelations = relations(teamStepChanges, ({ one }) => ({
  team: one(teams,      { fields: [teamStepChanges.teamId], references: [teams.id] }),
  step: one(eventSteps, { fields: [teamStepChanges.stepId], references: [eventSteps.id] }),
  user: one(users,      { fields: [teamStepChanges.changedBy], references: [users.id] }),
}))
