// Offline fallback functionality for when AI API is unavailable
export class FallbackDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupOfflineDetection();
  }

  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOfflineStatus(false);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOfflineStatus(true);
    });
  }

  updateOfflineStatus(offline) {
    const offlineBanner = document.getElementById('offlineBanner');
    if (offlineBanner) {
      offlineBanner.style.display = offline ? 'block' : 'none';
    }

    // Update scan button text
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
      if (offline) {
        scanButton.innerHTML = '<i data-feather="wifi-off"></i> Scan (Offline Mode)';
      } else {
        scanButton.innerHTML = '<i data-feather="shield"></i> Scan Link';
      }
      // Re-render feather icons
      if (window.feather) {
        window.feather.replace();
      }
    }
  }

  async performFallbackAnalysis(url, regexRules) {
    // Perform only pattern-based analysis when offline
    console.log('Performing offline analysis for:', url);

    const patternAnalysis = regexRules.analyzeUrl(url);
    
    // Check against legitimate domains
    const isLegitBank = regexRules.isLegitimateBank(url);
    const isLegitEwallet = regexRules.isLegitimateEwallet(url);

    if (isLegitBank || isLegitEwallet) {
      return {
        riskLevel: 'safe',
        confidence: 0.8,
        explanation: `This appears to be a legitimate ${isLegitBank ? 'bank' : 'e-wallet'} domain. ✓`,
        flags: [],
        source: 'offline_whitelist'
      };
    }

    // Enhanced offline analysis
    let explanation = '';
    let suggestions = [];

    if (patternAnalysis.riskLevel === 'dangerous') {
      explanation = 'This link shows multiple dangerous characteristics. DO NOT CLICK or enter personal information.';
      suggestions = [
        'Never click suspicious links',
        'Contact your bank directly through official channels',
        'Report this link to authorities'
      ];
    } else if (patternAnalysis.riskLevel === 'suspicious') {
      explanation = 'This link has suspicious elements. Exercise extreme caution.';
      suggestions = [
        'Verify the sender through official channels',
        'Check the URL carefully for typos',
        'When in doubt, don\'t click'
      ];
    } else {
      explanation = 'No obvious red flags detected, but stay vigilant.';
      suggestions = [
        'Always verify payment requests independently',
        'Check for HTTPS and correct spelling',
        'Be cautious with personal information'
      ];
    }

    return {
      riskLevel: patternAnalysis.riskLevel,
      confidence: 0.6, // Lower confidence for offline mode
      explanation: explanation,
      flags: patternAnalysis.flags,
      suggestions: suggestions,
      source: 'offline_patterns'
    };
  }

  checkConnectivity() {
    return this.isOnline;
  }

  // Test API connectivity
  async testAPIConnectivity() {
    if (!this.isOnline) return false;

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      console.warn('API connectivity test failed:', error);
      return false;
    }
  }

  // Create offline banner element
  createOfflineBanner() {
    const banner = document.createElement('div');
    banner.id = 'offlineBanner';
    banner.className = 'alert alert-warning offline-banner';
    banner.style.display = 'none';
    banner.innerHTML = `
      <i data-feather="wifi-off"></i>
      <span data-i18n="offline">You're offline - using basic detection only</span>
    `;

    // Insert at top of main content
    const mainContent = document.querySelector('.container');
    if (mainContent) {
      mainContent.insertBefore(banner, mainContent.firstChild);
    }

    return banner;
  }

  init() {
    // Create offline banner
    this.createOfflineBanner();
    
    // Set initial state
    this.updateOfflineStatus(!this.isOnline);
  }
}