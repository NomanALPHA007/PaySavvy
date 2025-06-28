import { storage } from './storage';

// Generate a simple session ID for tracking users
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get or create session ID from localStorage
export function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  let sessionId = localStorage.getItem('paysavvy_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('paysavvy_session_id', sessionId);
  }
  return sessionId;
}

// API functions for frontend integration
export const api = {
  // Save scan result to database
  async saveScanResult(scanData: {
    url: string;
    domain: string;
    patternScore: number;
    patternRiskLevel: string;
    detectedPatterns: string[];
    aiRiskLevel?: string;
    aiConfidence?: number;
    aiExplanation?: string;
    finalRiskLevel: string;
  }) {
    try {
      const sessionId = getSessionId();
      const userAgent = navigator.userAgent;
      
      // Get or create user
      const user = await storage.getOrCreateUser(sessionId, undefined, userAgent);
      
      // Save scan result
      await storage.saveScanResult({
        userId: user.id,
        url: scanData.url,
        domain: scanData.domain,
        patternScore: scanData.patternScore,
        patternRiskLevel: scanData.patternRiskLevel,
        detectedPatterns: scanData.detectedPatterns,
        aiRiskLevel: scanData.aiRiskLevel || null,
        aiConfidence: scanData.aiConfidence || null,
        aiExplanation: scanData.aiExplanation || null,
        finalRiskLevel: scanData.finalRiskLevel,
        isScam: scanData.finalRiskLevel === 'Dangerous',
      });
      
      // Track analytics event
      await storage.trackEvent({
        eventType: 'scan',
        eventData: {
          riskLevel: scanData.finalRiskLevel,
          domain: scanData.domain,
          patternScore: scanData.patternScore,
        },
        sessionId,
      });
      
    } catch (error) {
      console.error('Failed to save scan result:', error);
      // Continue without database storage - don't block the user experience
    }
  },

  // Get scan history for current user
  async getScanHistory(limit: number = 10) {
    try {
      const sessionId = getSessionId();
      return await storage.getScanHistory(sessionId, limit);
    } catch (error) {
      console.error('Failed to get scan history:', error);
      return [];
    }
  },

  // Report a URL as scam
  async reportScam(url: string, reportType: string = 'confirmed_scam', additionalInfo?: string) {
    try {
      const sessionId = getSessionId();
      
      // Find the scanned URL entry (simplified - in real app you'd pass the scan ID)
      await storage.reportScam({
        scannedUrlId: null, // Would need to be provided in real implementation
        reporterSessionId: sessionId,
        reportType,
        additionalInfo,
      });
      
      // Track analytics event
      await storage.trackEvent({
        eventType: 'report',
        eventData: {
          url,
          reportType,
        },
        sessionId,
      });
      
    } catch (error) {
      console.error('Failed to report scam:', error);
      // Continue without database storage
    }
  },

  // Get basic statistics
  async getStatistics() {
    try {
      const dailyScamCount = await storage.getDailyScamCount();
      const topScamDomains = await storage.getTopScamDomains(5);
      
      return {
        dailyScamCount,
        topScamDomains,
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        dailyScamCount: 0,
        topScamDomains: [],
      };
    }
  }
};