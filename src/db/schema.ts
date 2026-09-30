import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  staticId: text('static_id').primaryKey(),
  nickname: text('nickname').notNull(),
  discord: text('discord').notNull(),
  password: text('password'),
  role: text('role').notNull().default('instructor'), // 'superadmin' | 'admin' | 'senior_instructor' | 'instructor'
  rank: text('rank'),
  callsign: text('callsign'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  nickname: text('nickname').notNull(),
  discord: text('discord').notNull(),
  date: text('date').notNull(),
  checkedReports: integer('checked_reports').notNull().default(0),
  gatherings: integer('gatherings').notNull().default(0),
  arrests: integer('arrests').notNull().default(0),
  events: integer('events').notNull().default(0),
  proofUrl: text('proof_url'),
  notes: text('notes'),
  status: text('status').notNull().default('pending'), // 'approved' | 'rejected' | 'pending'
  reviewedBy: text('reviewed_by'),
  reviewedAt: text('reviewed_at'),
  reviewComment: text('review_comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const archives = pgTable('archives', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  closedBy: text('closed_by').notNull(),
  closedAt: text('closed_at').notNull(),
  reportsCount: integer('reports_count').notNull().default(0),
  totalPoints: integer('total_points').notNull().default(0),
  totalCheckedReports: integer('total_checked_reports').notNull().default(0),
  totalGatherings: integer('total_gatherings').notNull().default(0),
  totalArrests: integer('total_arrests').notNull().default(0),
  totalEvents: integer('total_events').notNull().default(0),
  archivedReports: jsonb('archived_reports').notNull(),
  instructorSummary: jsonb('instructor_summary').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const admins = pgTable('admins', {
  staticId: text('static_id').primaryKey(),
});
