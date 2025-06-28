import { users, scannedUrls, scamReports, analytics, type User, type InsertUser, type InsertScannedUrl, type InsertScamReport, type InsertAnalytics } from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Storage interface for handling scan data and analytics
export interface IStorage {
  // User management
  getOrCreateUser(sessionId: string, ipAddress?: string, userAgent?: string): Promise<User>;
  
  // URL scanning
  saveScanResult(scanData: InsertScannedUrl): Promise<void>;
  getScanHistory(sessionId: string, limit?: number): Promise<any[]>;
  
  // Scam reporting
  reportScam(reportData: InsertScamReport): Promise<void>;
  
  // Analytics
  trackEvent(eventData: InsertAnalytics): Promise<void>;
  
  // Statistics
  getDailyScamCount(): Promise<number>;
  getTopScamDomains(limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getOrCreateUser(sessionId: string, ipAddress?: string, userAgent?: string): Promise<User> {
    // Try to find existing user by session ID
    const [existingUser] = await db.select().from(users).where(eq(users.sessionId, sessionId));
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        sessionId,
        ipAddress,
        userAgent,
      })
      .returning();
    
    return newUser;
  }

  async saveScanResult(scanData: InsertScannedUrl): Promise<void> {
    await db.insert(scannedUrls).values(scanData);
  }

  async getScanHistory(sessionId: string, limit: number = 10): Promise<any[]> {
    // Get user first
    const [user] = await db.select().from(users).where(eq(users.sessionId, sessionId));
    
    if (!user) {
      return [];
    }
    
    // Get scan history for user
    const history = await db
      .select({
        url: scannedUrls.url,
        domain: scannedUrls.domain,
        finalRiskLevel: scannedUrls.finalRiskLevel,
        scannedAt: scannedUrls.scannedAt,
      })
      .from(scannedUrls)
      .where(eq(scannedUrls.userId, user.id))
      .orderBy(scannedUrls.scannedAt)
      .limit(limit);
    
    return history;
  }

  async reportScam(reportData: InsertScamReport): Promise<void> {
    await db.insert(scamReports).values(reportData);
  }

  async trackEvent(eventData: InsertAnalytics): Promise<void> {
    await db.insert(analytics).values(eventData);
  }

  async getDailyScamCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select()
      .from(scannedUrls)
      .where(eq(scannedUrls.finalRiskLevel, 'Dangerous'));
    
    return result.length;
  }

  async getTopScamDomains(limit: number = 5): Promise<any[]> {
    // This would require a more complex query in a real implementation
    // For now, return empty array
    return [];
  }
}

export const storage = new DatabaseStorage();