// Enhanced Preferences Panel with Regional and Advanced Settings
import regionHeatmap from '../data/regionHeatmap.json';

export class PreferencesPanel {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      showRegionalSettings: true,
      showLanguageSettings: true,
      showBankSettings: true,
      showAdvancedSettings: true,
      ...options
    };
    
    this.preferences = this.loadPreferences();
    this.init();
  }

  init() {
    if (!this.container) {
      console.error(`PreferencesPanel container ${this.containerId} not found`);
      return;
    }

    this.createUI();
    this.setupEventListeners();
    this.updateUI();
  }

  loadPreferences() {
    const defaultPrefs = {
      language: 'en',
      region: {
        country: 'Malaysia',
        state: 'Selangor'
      },
      preferredBanks: ['maybank', 'cimb', 'publicbank'],
      preferredEwallets: ['grabpay', 'boost', 'touchngo'],
      enabledLanguages: ['en', 'bm'],
      advancedFeatures: {
        fingerprintDetection: true,
        redirectTracing: true,
        multilingualAnalysis: true,
        qrScanning: true,
        regionalRisk: true,
        pasteShield: true
      },
      notifications: {
        highRiskAlerts: true,
        fingerprintMatches: true,
        regionalWarnings: true,
        newThreats: false
      },
      privacy: {
        shareAnalytics: false,
        saveHistory: true,
        autoReport: false
      }
    };
    
    const saved = localStorage.getItem('paysavvy_preferences');
    return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
  }

  savePreferences() {
    localStorage.setItem('paysavvy_preferences', JSON.stringify(this.preferences));
    
    // Dispatch preference change event
    document.dispatchEvent(new CustomEvent('preferences-changed', {
      detail: this.preferences
    }));
  }

  createUI() {
    const html = `
      <div class="preferences-panel">
        <div class="preferences-header">
          <h6>
            <i data-feather="settings"></i>
            PaySavvy Settings
          </h6>
          <button type="button" class="btn btn-sm btn-outline-secondary" id="reset-preferences">
            <i data-feather="refresh-cw"></i>
            Reset
          </button>
        </div>

        <div class="preferences-content">
          ${this.options.showLanguageSettings ? this.createLanguageSection() : ''}
          ${this.options.showRegionalSettings ? this.createRegionalSection() : ''}
          ${this.options.showBankSettings ? this.createBankSection() : ''}
          ${this.options.showAdvancedSettings ? this.createAdvancedSection() : ''}
          ${this.createNotificationSection()}
          ${this.createPrivacySection()}
        </div>

        <div class="preferences-footer">
          <button type="button" class="btn btn-primary" id="save-preferences">
            <i data-feather="save"></i>
            Save Settings
          </button>
          <button type="button" class="btn btn-outline-secondary ms-2" id="export-preferences">
            <i data-feather="download"></i>
            Export
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.addStyles();

    if (window.feather) {
      window.feather.replace();
    }
  }

  createLanguageSection() {
    return `
      <div class="preference-section">
        <h6 class="section-title">
          <i data-feather="globe"></i>
          Language & Region
        </h6>
        
        <div class="mb-3">
          <label class="form-label">Primary Language</label>
          <select class="form-select" id="primary-language">
            <option value="en">English</option>
            <option value="bm">Bahasa Malaysia</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="ph">Filipino/Tagalog</option>
            <option value="th">Thai</option>
            <option value="vi">Vietnamese</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Additional Languages for Detection</label>
          <div class="language-checkboxes">
            <div class="form-check">
              <input class="form-check-input language-checkbox" type="checkbox" value="en" id="lang-en">
              <label class="form-check-label" for="lang-en">English</label>
            </div>
            <div class="form-check">
              <input class="form-check-input language-checkbox" type="checkbox" value="bm" id="lang-bm">
              <label class="form-check-label" for="lang-bm">Bahasa Malaysia</label>
            </div>
            <div class="form-check">
              <input class="form-check-input language-checkbox" type="checkbox" value="id" id="lang-id">
              <label class="form-check-label" for="lang-id">Bahasa Indonesia</label>
            </div>
            <div class="form-check">
              <input class="form-check-input language-checkbox" type="checkbox" value="ph" id="lang-ph">
              <label class="form-check-label" for="lang-ph">Filipino/Tagalog</label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createRegionalSection() {
    const countries = Object.keys(regionHeatmap.asean.countries);
    const malaysianStates = Object.keys(regionHeatmap.malaysia.states);

    return `
      <div class="preference-section">
        <h6 class="section-title">
          <i data-feather="map-pin"></i>
          Regional Settings
        </h6>
        
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Country</label>
            <select class="form-select" id="user-country">
              <option value="Malaysia">Malaysia</option>
              ${countries.map(country => `
                <option value="${country}">${country}</option>
              `).join('')}
            </select>
          </div>
          
          <div class="col-md-6 mb-3" id="state-selection">
            <label class="form-label">State (Malaysia)</label>
            <select class="form-select" id="user-state">
              ${malaysianStates.map(state => `
                <option value="${state}">${state}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="regional-risk-display">
          <div class="alert alert-info" id="regional-risk-info">
            <small>Regional risk information will be displayed here</small>
          </div>
        </div>
      </div>
    `;
  }

  createBankSection() {
    return `
      <div class="preference-section">
        <h6 class="section-title">
          <i data-feather="credit-card"></i>
          Financial Services
        </h6>
        
        <div class="mb-3">
          <label class="form-label">Preferred Banks</label>
          <div class="bank-grid">
            <div class="form-check">
              <input class="form-check-input bank-checkbox" type="checkbox" value="maybank" id="bank-maybank">
              <label class="form-check-label" for="bank-maybank">Maybank</label>
            </div>
            <div class="form-check">
              <input class="form-check-input bank-checkbox" type="checkbox" value="cimb" id="bank-cimb">
              <label class="form-check-label" for="bank-cimb">CIMB Bank</label>
            </div>
            <div class="form-check">
              <input class="form-check-input bank-checkbox" type="checkbox" value="publicbank" id="bank-publicbank">
              <label class="form-check-label" for="bank-publicbank">Public Bank</label>
            </div>
            <div class="form-check">
              <input class="form-check-input bank-checkbox" type="checkbox" value="rhb" id="bank-rhb">
              <label class="form-check-label" for="bank-rhb">RHB Bank</label>
            </div>
            <div class="form-check">
              <input class="form-check-input bank-checkbox" type="checkbox" value="hongleong" id="bank-hongleong">
              <label class="form-check-label" for="bank-hongleong">Hong Leong Bank</label>
            </div>
            <div class="form-check">
              <input class="form-check-input bank-checkbox" type="checkbox" value="ambank" id="bank-ambank">
              <label class="form-check-label" for="bank-ambank">AmBank</label>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Preferred E-wallets</label>
          <div class="ewallet-grid">
            <div class="form-check">
              <input class="form-check-input ewallet-checkbox" type="checkbox" value="grabpay" id="ewallet-grabpay">
              <label class="form-check-label" for="ewallet-grabpay">GrabPay</label>
            </div>
            <div class="form-check">
              <input class="form-check-input ewallet-checkbox" type="checkbox" value="boost" id="ewallet-boost">
              <label class="form-check-label" for="ewallet-boost">Boost</label>
            </div>
            <div class="form-check">
              <input class="form-check-input ewallet-checkbox" type="checkbox" value="touchngo" id="ewallet-touchngo">
              <label class="form-check-label" for="ewallet-touchngo">Touch 'n Go</label>
            </div>
            <div class="form-check">
              <input class="form-check-input ewallet-checkbox" type="checkbox" value="bigpay" id="ewallet-bigpay">
              <label class="form-check-label" for="ewallet-bigpay">BigPay</label>
            </div>
            <div class="form-check">
              <input class="form-check-input ewallet-checkbox" type="checkbox" value="shopeepay" id="ewallet-shopeepay">
              <label class="form-check-label" for="ewallet-shopeepay">ShopeePay</label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createAdvancedSection() {
    return `
      <div class="preference-section">
        <h6 class="section-title">
          <i data-feather="shield"></i>
          Advanced Security Features
        </h6>
        
        <div class="feature-toggles">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input feature-toggle" type="checkbox" id="feature-fingerprint" value="fingerprintDetection">
            <label class="form-check-label" for="feature-fingerprint">
              <strong>Scam DNA Fingerprinting</strong>
              <br><small class="text-muted">Track and identify recurring scam patterns</small>
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input feature-toggle" type="checkbox" id="feature-redirect" value="redirectTracing">
            <label class="form-check-label" for="feature-redirect">
              <strong>Redirect Chain Analysis</strong>
              <br><small class="text-muted">Trace URL redirects and shorteners</small>
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input feature-toggle" type="checkbox" id="feature-multilingual" value="multilingualAnalysis">
            <label class="form-check-label" for="feature-multilingual">
              <strong>Multilingual Keyword Detection</strong>
              <br><small class="text-muted">Detect scam keywords in multiple languages</small>
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input feature-toggle" type="checkbox" id="feature-qr" value="qrScanning">
            <label class="form-check-label" for="feature-qr">
              <strong>QR Code Scanner</strong>
              <br><small class="text-muted">Scan and analyze QR codes for hidden threats</small>
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input feature-toggle" type="checkbox" id="feature-regional" value="regionalRisk">
            <label class="form-check-label" for="feature-regional">
              <strong>Regional Risk Assessment</strong>
              <br><small class="text-muted">Show regional scam statistics and warnings</small>
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input feature-toggle" type="checkbox" id="feature-paste" value="pasteShield">
            <label class="form-check-label" for="feature-paste">
              <strong>SMS/WhatsApp Paste Shield</strong>
              <br><small class="text-muted">Alert when pasting suspicious content</small>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  createNotificationSection() {
    return `
      <div class="preference-section">
        <h6 class="section-title">
          <i data-feather="bell"></i>
          Notifications
        </h6>
        
        <div class="notification-toggles">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input notification-toggle" type="checkbox" id="notif-high-risk" value="highRiskAlerts">
            <label class="form-check-label" for="notif-high-risk">
              High-risk URL alerts
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input notification-toggle" type="checkbox" id="notif-fingerprint" value="fingerprintMatches">
            <label class="form-check-label" for="notif-fingerprint">
              Scam fingerprint matches
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input notification-toggle" type="checkbox" id="notif-regional" value="regionalWarnings">
            <label class="form-check-label" for="notif-regional">
              Regional security warnings
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input notification-toggle" type="checkbox" id="notif-threats" value="newThreats">
            <label class="form-check-label" for="notif-threats">
              New threat intelligence updates
            </label>
          </div>
        </div>
      </div>
    `;
  }

  createPrivacySection() {
    return `
      <div class="preference-section">
        <h6 class="section-title">
          <i data-feather="lock"></i>
          Privacy & Data
        </h6>
        
        <div class="privacy-toggles">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input privacy-toggle" type="checkbox" id="privacy-analytics" value="shareAnalytics">
            <label class="form-check-label" for="privacy-analytics">
              Share anonymous usage analytics
              <br><small class="text-muted">Help improve threat detection</small>
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input privacy-toggle" type="checkbox" id="privacy-history" value="saveHistory">
            <label class="form-check-label" for="privacy-history">
              Save scan history locally
              <br><small class="text-muted">Keep record of scanned URLs</small>
            </label>
          </div>
          
          <div class="form-check form-switch mb-2">
            <input class="form-check-input privacy-toggle" type="checkbox" id="privacy-auto-report" value="autoReport">
            <label class="form-check-label" for="privacy-auto-report">
              Automatically report confirmed scams
              <br><small class="text-muted">Help protect other users</small>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Save preferences
    const saveBtn = document.getElementById('save-preferences');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentSettings());
    }

    // Reset preferences
    const resetBtn = document.getElementById('reset-preferences');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    // Export preferences
    const exportBtn = document.getElementById('export-preferences');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportSettings());
    }

    // Country/state selection
    const countrySelect = document.getElementById('user-country');
    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => this.handleCountryChange(e.target.value));
    }

    // Real-time preference updates
    this.container.addEventListener('change', (e) => {
      if (e.target.matches('.form-check-input, .form-select')) {
        this.updatePreferencesFromUI();
      }
    });
  }

  updateUI() {
    // Primary language
    const primaryLangSelect = document.getElementById('primary-language');
    if (primaryLangSelect) {
      primaryLangSelect.value = this.preferences.language;
    }

    // Additional languages
    this.preferences.enabledLanguages.forEach(lang => {
      const checkbox = document.getElementById(`lang-${lang}`);
      if (checkbox) checkbox.checked = true;
    });

    // Region
    const countrySelect = document.getElementById('user-country');
    const stateSelect = document.getElementById('user-state');
    if (countrySelect) {
      countrySelect.value = this.preferences.region.country;
    }
    if (stateSelect && this.preferences.region.state) {
      stateSelect.value = this.preferences.region.state;
    }

    // Banks
    this.preferences.preferredBanks.forEach(bank => {
      const checkbox = document.getElementById(`bank-${bank}`);
      if (checkbox) checkbox.checked = true;
    });

    // E-wallets
    this.preferences.preferredEwallets.forEach(ewallet => {
      const checkbox = document.getElementById(`ewallet-${ewallet}`);
      if (checkbox) checkbox.checked = true;
    });

    // Advanced features
    Object.entries(this.preferences.advancedFeatures).forEach(([feature, enabled]) => {
      const checkbox = document.querySelector(`#feature-${feature.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      if (checkbox) checkbox.checked = enabled;
    });

    // Notifications
    Object.entries(this.preferences.notifications).forEach(([notif, enabled]) => {
      const checkbox = document.querySelector(`#notif-${notif.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      if (checkbox) checkbox.checked = enabled;
    });

    // Privacy
    Object.entries(this.preferences.privacy).forEach(([privacy, enabled]) => {
      const checkbox = document.querySelector(`#privacy-${privacy.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      if (checkbox) checkbox.checked = enabled;
    });

    this.updateRegionalRiskDisplay();
  }

  updatePreferencesFromUI() {
    // Primary language
    const primaryLang = document.getElementById('primary-language')?.value;
    if (primaryLang) {
      this.preferences.language = primaryLang;
    }

    // Additional languages
    const enabledLanguages = [];
    document.querySelectorAll('.language-checkbox:checked').forEach(cb => {
      enabledLanguages.push(cb.value);
    });
    this.preferences.enabledLanguages = enabledLanguages;

    // Region
    const country = document.getElementById('user-country')?.value;
    const state = document.getElementById('user-state')?.value;
    if (country) {
      this.preferences.region.country = country;
      if (state) {
        this.preferences.region.state = state;
      }
    }

    // Banks
    const preferredBanks = [];
    document.querySelectorAll('.bank-checkbox:checked').forEach(cb => {
      preferredBanks.push(cb.value);
    });
    this.preferences.preferredBanks = preferredBanks;

    // E-wallets
    const preferredEwallets = [];
    document.querySelectorAll('.ewallet-checkbox:checked').forEach(cb => {
      preferredEwallets.push(cb.value);
    });
    this.preferences.preferredEwallets = preferredEwallets;

    // Advanced features
    document.querySelectorAll('.feature-toggle').forEach(cb => {
      this.preferences.advancedFeatures[cb.value] = cb.checked;
    });

    // Notifications
    document.querySelectorAll('.notification-toggle').forEach(cb => {
      this.preferences.notifications[cb.value] = cb.checked;
    });

    // Privacy
    document.querySelectorAll('.privacy-toggle').forEach(cb => {
      this.preferences.privacy[cb.value] = cb.checked;
    });

    this.updateRegionalRiskDisplay();
  }

  handleCountryChange(country) {
    const stateSection = document.getElementById('state-selection');
    if (country === 'Malaysia') {
      stateSection.style.display = 'block';
    } else {
      stateSection.style.display = 'none';
      this.preferences.region.state = null;
    }
    this.updateRegionalRiskDisplay();
  }

  updateRegionalRiskDisplay() {
    const riskInfo = document.getElementById('regional-risk-info');
    if (!riskInfo) return;

    const { country, state } = this.preferences.region;
    let regionData = null;

    if (country === 'Malaysia' && state && regionHeatmap.malaysia.states[state]) {
      regionData = regionHeatmap.malaysia.states[state];
    } else if (regionHeatmap.asean.countries[country]) {
      regionData = regionHeatmap.asean.countries[country];
    }

    if (regionData) {
      const riskClass = this.getRiskClass(regionData.riskLevel);
      riskInfo.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${state || country}</strong>
            <br><small>Recent scam reports: ${regionData.scamCount}</small>
          </div>
          <span class="badge ${riskClass}">
            ${regionData.riskLevel.toUpperCase()} RISK
          </span>
        </div>
      `;
      riskInfo.className = `alert alert-${this.getAlertClass(regionData.riskLevel)}`;
    } else {
      riskInfo.innerHTML = '<small>Select your region to view risk information</small>';
      riskInfo.className = 'alert alert-info';
    }
  }

  saveCurrentSettings() {
    this.updatePreferencesFromUI();
    this.savePreferences();
    
    // Show success message
    this.showToast('Settings saved successfully!', 'success');
  }

  resetToDefaults() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      localStorage.removeItem('paysavvy_preferences');
      this.preferences = this.loadPreferences();
      this.updateUI();
      this.showToast('Settings reset to defaults', 'info');
    }
  }

  exportSettings() {
    const data = JSON.stringify(this.preferences, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paysavvy-settings.json';
    a.click();
    
    URL.revokeObjectURL(url);
    this.showToast('Settings exported successfully!', 'success');
  }

  getRiskClass(riskLevel) {
    switch (riskLevel) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning text-dark';
      case 'low': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getAlertClass(riskLevel) {
    switch (riskLevel) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  addStyles() {
    if (document.getElementById('preferences-panel-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'preferences-panel-styles';
    styles.textContent = `
      .preferences-panel {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e9ecef;
        max-height: 70vh;
        overflow-y: auto;
      }

      .preferences-header {
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        border-radius: 0.5rem 0.5rem 0 0;
      }

      .preferences-content {
        padding: 1rem;
      }

      .preferences-footer {
        padding: 1rem;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
        border-radius: 0 0 0.5rem 0.5rem;
      }

      .preference-section {
        margin-bottom: 2rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        border-left: 3px solid var(--bs-primary);
      }

      .section-title {
        color: var(--bs-primary);
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .bank-grid, .ewallet-grid, .language-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .feature-toggles .form-check,
      .notification-toggles .form-check,
      .privacy-toggles .form-check {
        padding: 0.75rem;
        background: white;
        border-radius: 0.25rem;
        border: 1px solid #dee2e6;
        margin-bottom: 0.5rem;
      }

      .form-switch .form-check-input {
        width: 2em;
        height: 1em;
      }

      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1055;
      }

      @media (max-width: 768px) {
        .preferences-panel {
          max-height: 80vh;
        }
        
        .bank-grid, .ewallet-grid {
          grid-template-columns: 1fr;
        }
        
        .preferences-header {
          flex-direction: column;
          gap: 0.5rem;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  getPreferences() {
    return this.preferences;
  }

  updatePreference(key, value) {
    this.preferences[key] = value;
    this.savePreferences();
  }

  isFeatureEnabled(feature) {
    return this.preferences.advancedFeatures[feature] || false;
  }
}