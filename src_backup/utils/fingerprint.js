// Scam Signature DNA - Generate and track URL fingerprints
export class FingerprintEngine {
  constructor() {
    this.fingerprintCache = new Map();
    this.loadStoredFingerprints();
  }

  async generateFingerprint(url, keywords = [], metadata = {}) {
    try {
      // Create a unique signature from URL components
      const urlObj = new URL(url);
      const baseComponents = [
        urlObj.hostname.toLowerCase(),
        urlObj.pathname,
        keywords.sort().join(','),
        metadata.userAgent || '',
        metadata.timestamp || Date.now()
      ];

      const baseString = baseComponents.join('|');
      const encoder = new TextEncoder();
      const data = encoder.encode(baseString);
      
      // Generate SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return {
        hash: hashHex,
        url: url,
        domain: urlObj.hostname,
        keywords: keywords,
        timestamp: Date.now(),
        metadata: metadata
      };
    } catch (error) {
      console.error('Fingerprint generation failed:', error);
      return null;
    }
  }

  async saveFingerprint(fingerprint) {
    if (!fingerprint) return;

    const stored = this.getStoredFingerprints();
    const hash = fingerprint.hash;

    if (stored.fingerprints[hash]) {
      // Update existing fingerprint
      stored.fingerprints[hash].count += 1;
      stored.fingerprints[hash].lastSeen = fingerprint.timestamp;
      stored.fingerprints[hash].seenUrls.add(fingerprint.url);
    } else {
      // Create new fingerprint entry
      stored.fingerprints[hash] = {
        count: 1,
        firstSeen: fingerprint.timestamp,
        lastSeen: fingerprint.timestamp,
        domain: fingerprint.domain,
        keywords: fingerprint.keywords,
        seenUrls: new Set([fingerprint.url]),
        riskLevel: this.calculateRiskLevel(fingerprint)
      };
    }

    // Update statistics
    stored.statistics.totalFingerprints = Object.keys(stored.fingerprints).length;
    stored.metadata.lastUpdated = new Date().toISOString();

    this.saveStoredFingerprints(stored);
    return stored.fingerprints[hash];
  }

  checkFingerprint(fingerprint) {
    if (!fingerprint) return null;

    const stored = this.getStoredFingerprints();
    const match = stored.fingerprints[fingerprint.hash];

    if (match) {
      return {
        found: true,
        count: match.count,
        firstSeen: match.firstSeen,
        lastSeen: match.lastSeen,
        riskLevel: match.riskLevel,
        seenUrls: Array.from(match.seenUrls),
        daysSinceFirst: Math.floor((Date.now() - match.firstSeen) / (1000 * 60 * 60 * 24))
      };
    }

    return { found: false };
  }

  calculateRiskLevel(fingerprint) {
    let risk = 'low';
    
    // Check domain characteristics
    if (fingerprint.domain.includes('.tk') || fingerprint.domain.includes('.ml')) {
      risk = 'high';
    }
    
    // Check for suspicious keywords
    const suspiciousKeywords = ['verify', 'urgent', 'blocked', 'suspended'];
    if (fingerprint.keywords.some(k => suspiciousKeywords.includes(k.toLowerCase()))) {
      risk = risk === 'high' ? 'high' : 'medium';
    }

    return risk;
  }

  getStoredFingerprints() {
    try {
      const stored = localStorage.getItem('paysavvy_fingerprints');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert seenUrls arrays back to Sets
        Object.values(parsed.fingerprints || {}).forEach(fp => {
          if (Array.isArray(fp.seenUrls)) {
            fp.seenUrls = new Set(fp.seenUrls);
          }
        });
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load fingerprints:', error);
    }

    return {
      fingerprints: {},
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalFingerprints: 0,
        version: "1.0.0"
      },
      statistics: {
        dailyFingerprints: 0,
        weeklyFingerprints: 0,
        monthlyFingerprints: 0
      }
    };
  }

  saveStoredFingerprints(data) {
    try {
      // Convert Sets to arrays for JSON serialization
      const toSave = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      }));

      localStorage.setItem('paysavvy_fingerprints', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save fingerprints:', error);
    }
  }

  loadStoredFingerprints() {
    const stored = this.getStoredFingerprints();
    this.fingerprintCache.clear();
    
    Object.entries(stored.fingerprints || {}).forEach(([hash, data]) => {
      this.fingerprintCache.set(hash, data);
    });
  }

  getStatistics() {
    const stored = this.getStoredFingerprints();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;
    let highRiskCount = 0;

    Object.values(stored.fingerprints || {}).forEach(fp => {
      const age = now - fp.firstSeen;
      
      if (age <= dayMs) dailyCount++;
      if (age <= weekMs) weeklyCount++;
      if (age <= monthMs) monthlyCount++;
      if (fp.riskLevel === 'high') highRiskCount++;
    });

    return {
      total: Object.keys(stored.fingerprints || {}).length,
      daily: dailyCount,
      weekly: weeklyCount,
      monthly: monthlyCount,
      highRisk: highRiskCount
    };
  }

  clearOldFingerprints(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    const stored = this.getStoredFingerprints();
    const now = Date.now();
    let removed = 0;

    Object.entries(stored.fingerprints || {}).forEach(([hash, fp]) => {
      if (now - fp.lastSeen > maxAge) {
        delete stored.fingerprints[hash];
        removed++;
      }
    });

    if (removed > 0) {
      stored.metadata.lastUpdated = new Date().toISOString();
      stored.statistics.totalFingerprints = Object.keys(stored.fingerprints).length;
      this.saveStoredFingerprints(stored);
    }

    return removed;
  }
}