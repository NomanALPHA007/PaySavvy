/**
 * PaySavvy Pro - Advanced Cybersecurity Platform
 * Complete modular architecture with 6 advanced features
 */

import { LanguageManager } from './utils/language.js';
import { RegexRules } from './utils/regexRules.js';
import { FallbackDetector } from './utils/fallback.js';
import { GPTScanner } from './ai/gptScan.js';
import { FingerprintEngine } from './utils/fingerprint.js';
import { RedirectTracer } from './utils/redirectTrace.js';
import { MultilingualMatcher } from './utils/multilingualMatcher.js';
import { LocalHeatmap } from './utils/localHeatmap.js';
import { QRDecoder } from './utils/qrDecode.js';
import { InputScanner } from './components/InputScanner.js';
import { QRScanner } from './components/QRScanner.js';
import { ResultBox } from './components/ResultBox.js';
import { PreferencesPanel } from './components/PreferencesPanel.js';
import brandList from './data/brandList.json';
import countryMap from './data/countryMap.json';

class PaySavvy {
  constructor() {
    // Core modules
    this.languageManager = new LanguageManager();
    this.regexRules = new RegexRules();
    this.fallbackDetector = new FallbackDetector();
    
    // Advanced cybersecurity features
    this.gptScanner = new GPTScanner();
    this.fingerprintEngine = new FingerprintEngine();
    this.redirectTracer = new RedirectTracer();
    this.multilingualMatcher = new MultilingualMatcher();
    this.localHeatmap = new LocalHeatmap();
    this.qrDecoder = new QRDecoder();
    
    // UI Components
    this.inputScanner = null;
    this.qrScanner = null;
    this.resultBox = null;
    this.preferencesPanel = null;
    
    // Application state
    this.preferences = this.loadPreferences();
    this.scanHistory = this.loadScanHistory();
    this.isScanning = false;
    this.currentScanId = null;
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
    console.log('PaySavvy Pro initializing with advanced cybersecurity features...');
    
    // Initialize core modules
    this.languageManager.init();
    this.fallbackDetector.init();
    
    // Initialize UI components
    this.initializeComponents();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load and display data
    this.displayScanHistory();
    this.updatePreferencesUI();
    
    // Initialize advanced features based on preferences
    this.initializeAdvancedFeatures();
    
    // Setup periodic cleanup
    this.setupPeriodicMaintenance();
    
    console.log('PaySavvy Pro initialized successfully with all advanced features');
  }

  initializeComponents() {
    // Initialize input scanner with paste shield
    this.inputScanner = new InputScanner('urlInput', {
      enablePasteShield: this.preferences.advancedFeatures?.pasteShield !== false,
      enableAutoDetection: true,
      enableRealTimeValidation: true
    });

    // Initialize QR scanner
    this.qrScanner = new QRScanner('qr-scanner-container', {
      enableCamera: true,
      enableFileUpload: true,
      autoScan: true
    });

    // Initialize result display
    this.resultBox = new ResultBox('results', {
      showTechnicalDetails: true,
      showRegionalAnalysis: true,
      showFingerprints: this.preferences.advancedFeatures?.fingerprintDetection !== false,
      showRedirectChain: this.preferences.advancedFeatures?.redirectTracing !== false,
      showMultilingualFlags: this.preferences.advancedFeatures?.multilingualAnalysis !== false
    });

    // Initialize preferences panel
    this.preferencesPanel = new PreferencesPanel('preferencesPanel', {
      showRegionalSettings: true,
      showLanguageSettings: true,
      showBankSettings: true,
      showAdvancedSettings: true
    });
  }

  initializeAdvancedFeatures() {
    // Update multilingual matcher with user preferences
    if (this.preferences.region) {
      this.multilingualMatcher.updateUserRegion(this.preferences.region.country);
    }

    // Set user region for heatmap
    if (this.preferences.region.country && this.preferences.region.state) {
      this.localHeatmap.setUserRegion(
        this.preferences.region.country,
        this.preferences.region.state
      );
    }

    // Clean old fingerprints
    this.fingerprintEngine.clearOldFingerprints();
  }

  setupPeriodicMaintenance() {
    // Clean old data every hour
    setInterval(() => {
      this.fingerprintEngine.clearOldFingerprints();
      this.cleanOldScanHistory();
    }, 60 * 60 * 1000);
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

    // QR Scanner toggle
    const qrToggle = document.getElementById('qrScannerToggle');
    if (qrToggle) {
      qrToggle.addEventListener('click', () => this.toggleQRScanner());
    }

    // Real-time URL validation
    if (urlInput) {
      urlInput.addEventListener('input', (e) => this.validateUrlInput(e.target.value));
    }

    // Preferences change listener
    document.addEventListener('preferences-changed', (e) => {
      this.preferences = e.detail;
      this.initializeAdvancedFeatures();
    });
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
    this.currentScanId = Date.now();
    this.setLoadingState(true);
    this.hideError();
    this.hideResults();

    try {
      console.log('Starting comprehensive scan with advanced features...');
      
      // Create scan context from user preferences
      const context = this.createScanContext(url);
      
      // Run all analysis modules in parallel for efficiency
      const analysisResults = await this.runComprehensiveAnalysis(url, context);
      
      // Combine all analysis results
      const finalResult = this.combineAdvancedAnalysis(analysisResults, context);
      
      // Save comprehensive scan result
      await this.saveScanResult(url, analysisResults, finalResult);
      
      // Display enhanced results
      this.displayAdvancedResults(analysisResults, finalResult);
      
      console.log('Comprehensive scan completed successfully');
      
    } catch (error) {
      console.error('Advanced scan failed:', error);
      this.showError(`Scan failed: ${error.message}`);
    } finally {
      this.isScanning = false;
      this.setLoadingState(false);
    }
  }

  createScanContext(url) {
    return {
      userRegion: this.preferences.region?.country || 'Malaysia',
      userState: this.preferences.region?.state || 'Selangor',
      userLanguage: this.preferences.language || 'en',
      preferredBanks: this.preferences.preferredBanks || [],
      preferredEwallets: this.preferences.preferredEwallets || [],
      enabledLanguages: this.preferences.enabledLanguages || ['en', 'bm'],
      advancedFeatures: this.preferences.advancedFeatures || {},
      qrSource: url.includes('qr-scan-source'), // Check if from QR
      timestamp: Date.now(),
      scanId: this.currentScanId
    };
  }

  async runComprehensiveAnalysis(url, context) {
    const analysisPromises = [];
    const results = {};

    // 1. Pattern Analysis (always run)
    analysisPromises.push(
      this.regexRules.analyzeUrl(url)
        .then(result => { results.patternAnalysis = result; })
        .catch(error => { 
          console.warn('Pattern analysis failed:', error);
          results.patternAnalysis = { flags: [], score: 0, riskLevel: 'safe' };
        })
    );

    // 2. Scam DNA Fingerprinting
    if (context.advancedFeatures.fingerprintDetection !== false) {
      analysisPromises.push(
        this.runFingerprintAnalysis(url, context)
          .then(result => { results.fingerprintMatch = result; })
          .catch(error => { 
            console.warn('Fingerprint analysis failed:', error);
            results.fingerprintMatch = null;
          })
      );
    }

    // 3. Redirect Chain Analysis
    if (context.advancedFeatures.redirectTracing !== false) {
      analysisPromises.push(
        this.redirectTracer.traceRedirects(url, { maxRedirects: 5, timeout: 8000 })
          .then(result => { results.redirectTrace = result; })
          .catch(error => { 
            console.warn('Redirect tracing failed:', error);
            results.redirectTrace = null;
          })
      );
    }

    // 4. Multilingual Analysis
    if (context.advancedFeatures.multilingualAnalysis !== false) {
      analysisPromises.push(
        this.runMultilingualAnalysis(url, context)
          .then(result => { results.multilingualAnalysis = result; })
          .catch(error => { 
            console.warn('Multilingual analysis failed:', error);
            results.multilingualAnalysis = null;
          })
      );
    }

    // 5. Regional Risk Assessment
    if (context.advancedFeatures.regionalRisk !== false) {
      analysisPromises.push(
        Promise.resolve(this.localHeatmap.getUserRegionRisk())
          .then(result => { results.regionalRisk = result; })
          .catch(error => { 
            console.warn('Regional risk assessment failed:', error);
            results.regionalRisk = null;
          })
      );
    }

    // 6. AI Analysis (if available and online)
    const useAI = this.fallbackDetector.checkConnectivity() && this.gptScanner.isConfigured();
    if (useAI) {
      analysisPromises.push(
        this.gptScanner.analyzeURL(url, context)
          .then(result => { results.aiAnalysis = result; })
          .catch(error => { 
            console.warn('AI analysis failed:', error);
            results.aiAnalysis = null;
          })
      );
    } else if (!this.fallbackDetector.checkConnectivity()) {
      // Use offline fallback
      analysisPromises.push(
        this.fallbackDetector.performFallbackAnalysis(url, this.regexRules)
          .then(result => { results.fallbackAnalysis = result; })
          .catch(error => { 
            console.warn('Fallback analysis failed:', error);
            results.fallbackAnalysis = null;
          })
      );
    }

    // Wait for all analyses to complete
    await Promise.allSettled(analysisPromises);

    return results;
  }

  async runFingerprintAnalysis(url, context) {
    const extractedKeywords = this.extractKeywordsFromUrl(url);
    const fingerprint = await this.fingerprintEngine.generateFingerprint(url, extractedKeywords, {
      userAgent: navigator.userAgent,
      timestamp: context.timestamp,
      region: context.userRegion
    });

    if (fingerprint) {
      const match = this.fingerprintEngine.checkFingerprint(fingerprint);
      await this.fingerprintEngine.saveFingerprint(fingerprint);
      return match;
    }

    return null;
  }

  async runMultilingualAnalysis(url, context) {
    // Extract text content from URL and any associated content
    const urlText = decodeURIComponent(url);
    const analysis = this.multilingualMatcher.analyzeText(urlText, {
      languages: context.enabledLanguages,
      caseSensitive: false,
      includePartialMatches: true
    });

    return analysis;
  }

  extractKeywordsFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathKeywords = urlObj.pathname.split('/').filter(part => part.length > 2);
      const paramKeywords = Array.from(urlObj.searchParams.values());
      const domainParts = urlObj.hostname.split('.').filter(part => part.length > 2);
      
      return [...pathKeywords, ...paramKeywords, ...domainParts];
    } catch (error) {
      return [];
    }
  }

  combineAdvancedAnalysis(analysisResults, context) {
    const {
      patternAnalysis,
      aiAnalysis,
      fallbackAnalysis,
      fingerprintMatch,
      redirectTrace,
      multilingualAnalysis,
      regionalRisk
    } = analysisResults;

    let finalRiskLevel = 'safe';
    let confidence = 0.5;
    let explanation = 'Analysis completed';
    let suggestions = [];
    let combinedScore = 0;

    // Weight different analysis types
    const weights = {
      pattern: 0.2,
      ai: 0.3,
      fingerprint: 0.15,
      redirect: 0.15,
      multilingual: 0.15,
      regional: 0.05
    };

    // Calculate weighted risk score
    if (patternAnalysis) {
      const patternScore = this.getRiskScore(patternAnalysis.riskLevel);
      combinedScore += patternScore * weights.pattern;
    }

    if (aiAnalysis) {
      const aiScore = this.getRiskScore(aiAnalysis.riskLevel);
      combinedScore += aiScore * weights.ai;
      confidence = Math.max(confidence, aiAnalysis.confidence || 0.5);
      explanation = aiAnalysis.explanation || explanation;
      suggestions = aiAnalysis.recommendations || suggestions;
    } else if (fallbackAnalysis) {
      const fallbackScore = this.getRiskScore(fallbackAnalysis.riskLevel);
      combinedScore += fallbackScore * weights.pattern;
      explanation = fallbackAnalysis.explanation || explanation;
      suggestions = fallbackAnalysis.suggestions || suggestions;
    }

    if (fingerprintMatch?.found) {
      const fingerprintScore = this.getRiskScore(fingerprintMatch.riskLevel);
      combinedScore += fingerprintScore * weights.fingerprint;
      
      if (fingerprintMatch.count > 5) {
        explanation += ` This URL pattern has been flagged ${fingerprintMatch.count} times.`;
      }
    }

    if (redirectTrace?.analysis) {
      const redirectScore = this.getRiskScore(redirectTrace.analysis.riskLevel);
      combinedScore += redirectScore * weights.redirect;
    }

    if (multilingualAnalysis?.riskLevel) {
      const multilingualScore = this.getRiskScore(multilingualAnalysis.riskLevel);
      combinedScore += multilingualScore * weights.multilingual;
    }

    if (regionalRisk?.riskLevel) {
      const regionalScore = this.getRiskScore(regionalRisk.riskLevel);
      combinedScore += regionalScore * weights.regional;
    }

    // Convert combined score to risk level
    if (combinedScore >= 1.8) {
      finalRiskLevel = 'dangerous';
    } else if (combinedScore >= 1.2) {
      finalRiskLevel = 'suspicious';
    } else {
      finalRiskLevel = 'safe';
    }

    // Enhance suggestions based on advanced features
    suggestions = this.enhanceSuggestions(suggestions, analysisResults, context);

    return {
      riskLevel: finalRiskLevel,
      confidence: confidence,
      explanation: explanation,
      suggestions: suggestions,
      combinedScore: combinedScore,
      source: 'advanced_analysis',
      featuresUsed: Object.keys(analysisResults).filter(key => analysisResults[key] !== null)
    };
  }

  getRiskScore(riskLevel) {
    switch (riskLevel) {
      case 'dangerous': return 2;
      case 'suspicious': return 1;
      case 'safe': return 0;
      default: return 0.5;
    }
  }

  enhanceSuggestions(baseSuggestions, analysisResults, context) {
    const enhanced = [...(baseSuggestions || [])];

    if (analysisResults.fingerprintMatch?.found && analysisResults.fingerprintMatch.count > 3) {
      enhanced.push('This URL pattern has been reported multiple times - exercise extreme caution');
    }

    if (analysisResults.redirectTrace?.totalRedirects > 2) {
      enhanced.push('Multiple redirects detected - verify the final destination');
    }

    if (analysisResults.multilingualAnalysis?.suspiciousPhrases?.length > 0) {
      enhanced.push('Contains known scam phrases in multiple languages');
    }

    if (context.userRegion && analysisResults.regionalRisk?.riskLevel === 'high') {
      enhanced.push(`High scam activity reported in ${context.userRegion} - be extra vigilant`);
    }

    return enhanced;
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

  displayAdvancedResults(analysisResults, finalResult) {
    // Use the enhanced ResultBox component
    this.resultBox.displayResults({
      url: document.getElementById('urlInput').value,
      analysisResults,
      finalResult,
      fingerprintMatch: analysisResults.fingerprintMatch,
      redirectTrace: analysisResults.redirectTrace,
      multilingualAnalysis: analysisResults.multilingualAnalysis,
      regionalRisk: analysisResults.regionalRisk,
      patternAnalysis: analysisResults.patternAnalysis,
      aiAnalysis: analysisResults.aiAnalysis
    });

    // Update heatmap if regional data changed
    if (analysisResults.regionalRisk) {
      this.updateRegionalHeatmap();
    }
  }

  async updateRegionalHeatmap() {
    try {
      const heatmapContainer = document.getElementById('regional-heatmap');
      if (heatmapContainer && this.preferences.advancedFeatures?.regionalRisk !== false) {
        await this.localHeatmap.generateHeatmap('regional-heatmap', {
          type: 'chart',
          showASEAN: true,
          highlightUserRegion: true
        });
      }
    } catch (error) {
      console.warn('Failed to update regional heatmap:', error);
    }
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
    if (this.resultBox) {
      this.resultBox.hide();
    }
  }

  // Advanced utility methods for enhanced functionality
  async scanUrl(url) {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.value = url;
      const form = document.getElementById('scanForm');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  }

  async reportScam(url) {
    try {
      if (this.preferences.region?.state) {
        this.localHeatmap.addScamReport(this.preferences.region.state, this.preferences.region.country);
      }
      this.trackEvent('scam_reported', { url, region: this.preferences.region });
      this.showNotification('Scam reported successfully. Thank you for helping protect others!', 'success');
    } catch (error) {
      console.error('Failed to report scam:', error);
      this.showNotification('Failed to report scam. Please try again.', 'error');
    }
  }

  shareResults() {
    const results = this.resultBox?.getResults();
    if (results) {
      const shareData = {
        title: 'PaySavvy Scan Results',
        text: `Scanned URL: ${results.url}\nRisk Level: ${results.finalResult?.riskLevel || 'Unknown'}`,
        url: window.location.href
      };

      if (navigator.share) {
        navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.text);
        this.showNotification('Results copied to clipboard', 'info');
      }
    }
  }

  downloadReport() {
    const results = this.resultBox?.getResults();
    if (results) {
      const report = this.generateDetailedReport(results);
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `paysavvy-report-${Date.now()}.txt`;
      a.click();
      
      URL.revokeObjectURL(url);
    }
  }

  generateDetailedReport(results) {
    const timestamp = new Date().toLocaleString();
    let report = `PaySavvy Pro Scan Report\n`;
    report += `Generated: ${timestamp}\n`;
    report += `URL: ${results.url}\n\n`;
    
    report += `RISK ASSESSMENT\n`;
    report += `Risk Level: ${results.finalResult?.riskLevel?.toUpperCase() || 'UNKNOWN'}\n`;
    report += `Confidence: ${Math.round((results.finalResult?.confidence || 0) * 100)}%\n\n`;

    if (results.fingerprintMatch?.found) {
      report += `FINGERPRINT ANALYSIS\n`;
      report += `Pattern seen ${results.fingerprintMatch.count} times\n\n`;
    }

    if (results.redirectTrace?.totalRedirects > 0) {
      report += `REDIRECT CHAIN (${results.redirectTrace.totalRedirects} redirects)\n`;
      results.redirectTrace.chain.forEach((step, index) => {
        report += `${index + 1}. ${this.extractDomain(step.url)}\n`;
      });
      report += `\n`;
    }

    report += `RECOMMENDATIONS\n`;
    (results.finalResult?.suggestions || []).forEach(suggestion => {
      report += `- ${suggestion}\n`;
    });

    return report;
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  trackEvent(eventType, eventData) {
    if (!this.preferences.privacy?.shareAnalytics) return;

    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now()
    };

    const analytics = JSON.parse(localStorage.getItem('paysavvy_analytics') || '[]');
    analytics.push(event);
    
    if (analytics.length > 1000) {
      analytics.splice(0, analytics.length - 1000);
    }
    
    localStorage.setItem('paysavvy_analytics', JSON.stringify(analytics));
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification alert alert-${type} alert-dismissible`;
    notification.innerHTML = `
      <div>${message}</div>
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1060;
      max-width: 400px;
    `;

    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  toggleQRScanner() {
    const qrSection = document.getElementById('qrScannerSection');
    if (qrSection) {
      qrSection.classList.toggle('d-none');
      
      // Initialize QR scanner when first shown
      if (!qrSection.classList.contains('d-none') && this.qrScanner) {
        this.qrScanner.createUI();
      }
    }
  }

  cleanOldScanHistory() {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();
    
    this.scanHistory = this.scanHistory.filter(scan => {
      const scanTime = new Date(scan.timestamp).getTime();
      return (now - scanTime) < maxAge;
    });
    
    this.saveScanHistory();
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