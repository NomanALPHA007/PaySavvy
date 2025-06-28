/**
 * Database integration for PaySavvy
 * Handles storing scan results and analytics
 */

// Session management
function generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getSessionId() {
    let sessionId = localStorage.getItem('paysavvy_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('paysavvy_session_id', sessionId);
    }
    return sessionId;
}

// Database API functions
const database = {
    // Save scan result to database
    async saveScanResult(scanData) {
        try {
            const sessionId = getSessionId();
            const userAgent = navigator.userAgent;
            
            // Create the data payload
            const payload = {
                sessionId,
                userAgent,
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
            };

            // In a real implementation, this would make an API call to a backend
            // For now, we'll store it locally and log it
            console.log('Scan result saved:', payload);
            
            // Store in localStorage as backup
            const history = this.getLocalHistory();
            history.unshift({
                ...payload,
                scannedAt: new Date().toISOString()
            });
            
            // Keep only last 50 scans
            if (history.length > 50) {
                history.splice(50);
            }
            
            localStorage.setItem('paysavvy_scan_history', JSON.stringify(history));
            
        } catch (error) {
            console.error('Failed to save scan result:', error);
            // Continue without database storage - don't block user experience
        }
    },

    // Get local scan history
    getLocalHistory() {
        try {
            const history = localStorage.getItem('paysavvy_scan_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Failed to get scan history:', error);
            return [];
        }
    },

    // Get scan history for current user
    async getScanHistory(limit = 10) {
        try {
            const history = this.getLocalHistory();
            return history.slice(0, limit);
        } catch (error) {
            console.error('Failed to get scan history:', error);
            return [];
        }
    },

    // Report a URL as scam
    async reportScam(url, reportType = 'confirmed_scam', additionalInfo = '') {
        try {
            const sessionId = getSessionId();
            
            const reportData = {
                sessionId,
                url,
                reportType,
                additionalInfo,
                reportedAt: new Date().toISOString()
            };
            
            console.log('Scam reported:', reportData);
            
            // Store reports locally
            const reports = this.getLocalReports();
            reports.unshift(reportData);
            
            // Keep only last 20 reports
            if (reports.length > 20) {
                reports.splice(20);
            }
            
            localStorage.setItem('paysavvy_scam_reports', JSON.stringify(reports));
            
        } catch (error) {
            console.error('Failed to report scam:', error);
        }
    },

    // Get local scam reports
    getLocalReports() {
        try {
            const reports = localStorage.getItem('paysavvy_scam_reports');
            return reports ? JSON.parse(reports) : [];
        } catch (error) {
            console.error('Failed to get scam reports:', error);
            return [];
        }
    },

    // Get basic statistics from local data
    async getStatistics() {
        try {
            const history = this.getLocalHistory();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const dailyScams = history.filter(scan => {
                const scanDate = new Date(scan.scannedAt);
                scanDate.setHours(0, 0, 0, 0);
                return scanDate.getTime() === today.getTime() && scan.finalRiskLevel === 'Dangerous';
            }).length;
            
            // Count domains by risk level
            const domainCounts = {};
            history.forEach(scan => {
                if (scan.finalRiskLevel === 'Dangerous') {
                    domainCounts[scan.domain] = (domainCounts[scan.domain] || 0) + 1;
                }
            });
            
            const topScamDomains = Object.entries(domainCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([domain, count]) => ({ domain, count }));
            
            return {
                dailyScamCount: dailyScams,
                topScamDomains,
                totalScansToday: history.filter(scan => {
                    const scanDate = new Date(scan.scannedAt);
                    scanDate.setHours(0, 0, 0, 0);
                    return scanDate.getTime() === today.getTime();
                }).length
            };
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return {
                dailyScamCount: 0,
                topScamDomains: [],
                totalScansToday: 0
            };
        }
    },

    // Track analytics events
    async trackEvent(eventType, eventData) {
        try {
            const sessionId = getSessionId();
            
            const analyticsData = {
                sessionId,
                eventType,
                eventData,
                timestamp: new Date().toISOString()
            };
            
            console.log('Analytics event:', analyticsData);
            
            // Store analytics locally
            const events = this.getLocalAnalytics();
            events.unshift(analyticsData);
            
            // Keep only last 100 events
            if (events.length > 100) {
                events.splice(100);
            }
            
            localStorage.setItem('paysavvy_analytics', JSON.stringify(events));
            
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    },

    // Get local analytics
    getLocalAnalytics() {
        try {
            const events = localStorage.getItem('paysavvy_analytics');
            return events ? JSON.parse(events) : [];
        } catch (error) {
            console.error('Failed to get analytics:', error);
            return [];
        }
    }
};

// Export for ES modules
export { database };

// Also make available globally for backward compatibility
window.database = database;