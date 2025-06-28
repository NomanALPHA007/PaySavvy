import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for tracking unique users (optional for analytics)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scanned URLs table for tracking all scanned links
export const scannedUrls = pgTable('scanned_urls', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  url: text('url').notNull(),
  domain: text('domain').notNull(),
  patternScore: integer('pattern_score').notNull(),
  patternRiskLevel: text('pattern_risk_level').notNull(),
  detectedPatterns: jsonb('detected_patterns').$type<string[]>().notNull(),
  aiRiskLevel: text('ai_risk_level'),
  aiConfidence: integer('ai_confidence'), // Store as percentage (0-100)
  aiExplanation: text('ai_explanation'),
  finalRiskLevel: text('final_risk_level').notNull(),
  isScam: boolean('is_scam'),
  reportedAsScam: boolean('reported_as_scam').default(false),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
});

// Scam reports table for user-reported scams
export const scamReports = pgTable('scam_reports', {
  id: serial('id').primaryKey(),
  scannedUrlId: integer('scanned_url_id').references(() => scannedUrls.id),
  reporterSessionId: text('reporter_session_id'),
  reportType: text('report_type').notNull(), // 'confirmed_scam', 'false_positive', etc.
  additionalInfo: text('additional_info'),
  reportedAt: timestamp('reported_at').defaultNow().notNull(),
});

// Analytics table for tracking app usage patterns
export const analytics = pgTable('analytics', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(), // 'scan', 'report', 'error'
  eventData: jsonb('event_data'),
  sessionId: text('session_id'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  scannedUrls: many(scannedUrls),
}));

export const scannedUrlsRelations = relations(scannedUrls, ({ one, many }) => ({
  user: one(users, {
    fields: [scannedUrls.userId],
    references: [users.id],
  }),
  scamReports: many(scamReports),
}));

export const scamReportsRelations = relations(scamReports, ({ one }) => ({
  scannedUrl: one(scannedUrls, {
    fields: [scamReports.scannedUrlId],
    references: [scannedUrls.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ScannedUrl = typeof scannedUrls.$inferSelect;
export type InsertScannedUrl = typeof scannedUrls.$inferInsert;
export type ScamReport = typeof scamReports.$inferSelect;
export type InsertScamReport = typeof scamReports.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;