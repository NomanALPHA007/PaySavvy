/**
 * PaySavvy - Modular Main Application
 * Entry point with full modular architecture
 */

import { LanguageManager } from './utils/language.js';
import { RegexRules } from './utils/regexRules.js';
import { FallbackDetector } from './utils/fallback.js';
import { AIDetector } from './ai.js';
import brandList from './data/brandList.json';
import countryMap from './data/countryMap.json';

class PaySavvy {
  constructor() {
    this.languageManager = new LanguageManager();
    this.regexRules = new RegexRules();
    this.fallbackDetector = new FallbackDetector();
    this.aiDetector = new AIDetector();
    this.preferences = this.loadPreferences();
    this.scanHistory = this.loadScanHistory();
    
    this.isScanning = false;
  }

  loadPreferences() {
    const defaultPrefs = {
      language: 'en',
      preferredBanks: ['maybank', 'cimb', 'publicbank'],
      theme: 'light'
    };
    
    const saved = localStorage.getItem('paysavvy_preferences');
    return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
  }

  savePreferences() {
    localStorage.setItem('paysavvy_preferences', JSON.stringify(this.preferences));
  }

  loadScanHistory() {
    const saved = localStorage.getItem('paysavvy_history');
    return saved ? JSON.parse(saved) : [];
  }

  saveScanHistory() {
    // Keep only last 50 scans
    if (this.scanHistory.length > 50) {
      this.scanHistory = this.scanHistory.slice(-50);
    }
    localStorage.setItem('paysavvy_history', JSON.stringify(this.scanHistory));
  }

  async init() {
    console.log('PaySavvy initializing...');
    
    // Initialize modules
    this.languageManager.init();
    this.fallbackDetector.init();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load scan history display
    this.displayScanHistory();
    
    // Update UI with preferences
    this.updatePreferencesUI();
    
    console.log('PaySavvy initialized successfully');
  }

  setupEventListeners() {
    // Main scan form
    const form = document.getElementById('scanForm');
    const urlInput = document.getElementById('urlInput');
    const scanButton = document.getElementById('scanButton');

    if (form) {
      form.addEventListener('submit', (e) => this.handleScan(e));
    }

    // Language toggle
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => this.toggleLanguage());
    }

    // Preferences
    const prefsToggle = document.getElementById('preferencesToggle');
    if (prefsToggle) {
      prefsToggle.addEventListener('click', () => this.togglePreferences());
    }

    // Bank preferences
    document.querySelectorAll('.bank-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this.updateBankPreference(e));
    });

    // Clear history
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // Real-time URL validation
    if (urlInput) {
      urlInput.addEventListener('input', (e) => this.validateUrlInput(e.target.value));
    }
  }

  validateUrlInput(url) {
    const input = document.getElementById('urlInput');
    const feedback = document.getElementById('urlFeedback');
    
    if (!url) {
      input.classList.remove('is-valid', 'is-invalid');
      if (feedback) feedback.textContent = '';
      return;
    }

    const isValid = this.isValidUrl(url);
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);
    
    if (feedback) {
      feedback.textContent = isValid ? '' : 'Please enter a valid URL';
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  async handleScan(event) {
    event.preventDefault();
    
    if (this.isScanning) return;
    
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
      this.showError('Please enter a URL to scan');
      return;
    }

    if (!this.isValidUrl(url)) {
      this.showError('Please enter a valid URL');
      return;
    }

    this.isScanning = true;
    this.setLoadingState(true);
    this.hideError();
    this.hideResults();

    try {
      // Always perform pattern analysis
      const patternAnalysis = this.regexRules.analyzeUrl(url);
      let aiAnalysis = null;
      let finalResult = null;

      // Check if we should use AI or fallback
      const useAI = this.fallbackDetector.checkConnectivity() && this.aiDetector.isConfigured();

      if (useAI) {
        try {
          aiAnalysis = await this.aiDetector.analyzeWithAI(url);
          finalResult = this.combineAnalysis(patternAnalysis, aiAnalysis);
        } catch (error) {
          console.warn('AI analysis failed, using fallback:', error);
          finalResult = await this.fallbackDetector.performFallbackAnalysis(url, this.regexRules);
        }
      } else {
        finalResult = await this.fallbackDetector.performFallbackAnalysis(url, this.regexRules);
      }

      // Save scan result
      this.saveScanResult(url, patternAnalysis, aiAnalysis, finalResult);
      
      // Display results
      this.displayResults(finalResult, patternAnalysis, aiAnalysis);
      
    } catch (error) {
      console.error('Scan failed:', error);
      this.showError('Scan failed. Please try again.');
    } finally {
      this.isScanning = false;
      this.setLoadingState(false);
    }
  }

  combineAnalysis(patternAnalysis, aiAnalysis) {
    // Weighted combination of pattern and AI analysis
    const patternWeight = 0.4;
    const aiWeight = 0.6;

    // Convert risk levels to scores
    const riskScores = { safe: 0, suspicious: 1, dangerous: 2 };
    const patternScore = riskScores[patternAnalysis.riskLevel] || 0;
    const aiScore = riskScores[aiAnalysis.riskLevel] || 0;

    // Calculate weighted score
    const combinedScore = (patternScore * patternWeight) + (aiScore * aiWeight);
    
    // Convert back to risk level
    let finalRiskLevel;
    if (combinedScore >= 1.5) {
      finalRiskLevel = 'dangerous';
    } else if (combinedScore >= 0.5) {
      finalRiskLevel = 'suspicious';
    } else {
      finalRiskLevel = 'safe';
    }

    // Combine explanations and flags
    const combinedFlags = [...patternAnalysis.flags, ...(aiAnalysis.flags || [])];
    const confidence = aiAnalysis.confidence || 0.7;

    return {
      riskLevel: finalRiskLevel,
      confidence: confidence,
      explanation: aiAnalysis.explanation || 'Analysis completed using pattern detection',
      flags: combinedFlags,
      suggestions: aiAnalysis.suggestions || this.getDefaultSuggestions(finalRiskLevel),
      source: 'combined_analysis'
    };
  }

  getDefaultSuggestions(riskLevel) {
    const suggestions = {
      safe: [
        'Always verify payment requests independently',
        'Check for HTTPS and correct spelling',
        'Be cautious with personal information'
      ],
      suspicious: [
        'Verify the sender through official channels',
        'Check the URL carefully for typos',
        'When in doubt, don\'t click'
      ],
      dangerous: [
        'Never click suspicious links',
        'Contact your bank directly through official channels',
        'Report this link to authorities'
      ]
    };

    return suggestions[riskLevel] || suggestions.suspicious;
  }

  saveScanResult(url, patternAnalysis, aiAnalysis, finalResult) {
    const scanData = {
      url: url,
      timestamp: new Date().toISOString(),
      riskLevel: finalResult.riskLevel,
      confidence: finalResult.confidence,
      patternFlags: patternAnalysis.flags.length,
      aiUsed: !!aiAnalysis,
      source: finalResult.source
    };

    this.scanHistory.unshift(scanData);
    this.saveScanHistory();
    this.displayScanHistory();
  }

  displayResults(finalResult, patternAnalysis, aiAnalysis) {
    const resultsSection = document.getElementById('results');
    if (!resultsSection) return;

    resultsSection.classList.remove('d-none');
    
    // Update risk display
    this.updateRiskDisplay(finalResult.riskLevel, finalResult.explanation, finalResult.suggestions);
    
    // Update analysis details
    this.updateAnalysisDetails(finalResult, patternAnalysis, aiAnalysis);
  }

  updateRiskDisplay(riskLevel, explanation, suggestions) {
    const riskBadge = document.getElementById('riskBadge');
    const riskExplanation = document.getElementById('riskExplanation');
    const suggestionsList = document.getElementById('suggestionsList');

    if (riskBadge) {
      riskBadge.className = `badge ${this.getBadgeClass(riskLevel)} fs-5`;
      riskBadge.textContent = this.languageManager.getText(`riskLevels.${riskLevel}`);
    }

    if (riskExplanation) {
      riskExplanation.textContent = explanation;
    }

    if (suggestionsList && suggestions) {
      suggestionsList.innerHTML = suggestions
        .map(suggestion => `<li>${suggestion}</li>`)
        .join('');
    }
  }

  updateAnalysisDetails(finalResult, patternAnalysis, aiAnalysis) {
    const detailsContainer = document.getElementById('analysisDetails');
    if (!detailsContainer) return;

    let flagsHtml = '';
    if (finalResult.flags && finalResult.flags.length > 0) {
      flagsHtml = finalResult.flags
        .map(flag => `
          <div class="alert alert-warning py-2 mb-2">
            <strong>${flag.name || 'Pattern Match'}:</strong> ${flag.description}
          </div>
        `)
        .join('');
    }

    detailsContainer.innerHTML = `
      <div class="mt-3">
        <h6>Analysis Details</h6>
        ${flagsHtml}
        <small class="text-muted">
          Source: ${finalResult.source} | 
          Confidence: ${Math.round((finalResult.confidence || 0) * 100)}%
        </small>
      </div>
    `;
  }

  displayScanHistory() {
    const historyContainer = document.getElementById('historyItems');
    if (!historyContainer) return;

    if (this.scanHistory.length === 0) {
      historyContainer.innerHTML = '<p class="text-muted">No scans yet</p>';
      return;
    }

    const historyHtml = this.scanHistory
      .slice(0, 10)
      .map(scan => `
        <div class="history-item d-flex justify-content-between align-items-center py-2 border-bottom">
          <div class="flex-grow-1">
            <div class="small text-truncate" style="max-width: 300px;" title="${scan.url}">
              ${scan.url}
            </div>
            <div class="text-muted small">
              ${this.formatTimeAgo(new Date(scan.timestamp))}
            </div>
          </div>
          <span class="badge ${this.getBadgeClass(scan.riskLevel)}">
            ${this.languageManager.getText(`riskLevels.${scan.riskLevel}`)}
          </span>
        </div>
      `)
      .join('');

    historyContainer.innerHTML = historyHtml;
  }

  getBadgeClass(riskLevel) {
    const classes = {
      safe: 'bg-success',
      suspicious: 'bg-warning text-dark',
      dangerous: 'bg-danger'
    };
    return classes[riskLevel] || 'bg-secondary';
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  toggleLanguage() {
    const newLang = this.languageManager.getCurrentLanguage() === 'en' ? 'bm' : 'en';
    this.languageManager.setLanguage(newLang);
    this.preferences.language = newLang;
    this.savePreferences();
  }

  togglePreferences() {
    const prefsPanel = document.getElementById('preferencesPanel');
    if (prefsPanel) {
      prefsPanel.classList.toggle('d-none');
    }
  }

  updateBankPreference(event) {
    const bankId = event.target.value;
    const isChecked = event.target.checked;
    
    if (isChecked) {
      if (!this.preferences.preferredBanks.includes(bankId)) {
        this.preferences.preferredBanks.push(bankId);
      }
    } else {
      this.preferences.preferredBanks = this.preferences.preferredBanks.filter(id => id !== bankId);
    }
    
    this.savePreferences();
  }

  updatePreferencesUI() {
    // Update bank checkboxes
    document.querySelectorAll('.bank-checkbox').forEach(checkbox => {
      checkbox.checked = this.preferences.preferredBanks.includes(checkbox.value);
    });
  }

  clearHistory() {
    this.scanHistory = [];
    this.saveScanHistory();
    this.displayScanHistory();
  }

  setLoadingState(loading) {
    const scanButton = document.getElementById('scanButton');
    const urlInput = document.getElementById('urlInput');
    
    if (scanButton) {
      scanButton.disabled = loading;
      if (loading) {
        scanButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Scanning...';
      } else {
        scanButton.innerHTML = '<i data-feather="shield"></i> Scan Link';
        if (window.feather) window.feather.replace();
      }
    }
    
    if (urlInput) {
      urlInput.disabled = loading;
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('d-none');
    }
  }

  hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.classList.add('d-none');
    }
  }

  hideResults() {
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
      resultsSection.classList.add('d-none');
    }
  }
}

// Initialize PaySavvy when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new PaySavvy();
  app.init();
  
  // Make app globally available for debugging
  window.PaySavvy = app;
});

export { PaySavvy };