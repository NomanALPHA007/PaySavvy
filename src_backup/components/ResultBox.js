// Enhanced Results Display Component with Advanced Cybersecurity Features
export class ResultBox {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      showTechnicalDetails: true,
      showRegionalAnalysis: true,
      showFingerprints: true,
      showRedirectChain: true,
      showMultilingualFlags: true,
      enableReporting: true,
      ...options
    };
    
    this.currentResults = null;
    this.init();
  }

  init() {
    if (!this.container) {
      console.error(`ResultBox container ${this.containerId} not found`);
      return;
    }
    this.addStyles();
  }

  displayResults(results) {
    this.currentResults = results;
    
    const html = `
      <div class="result-box-component">
        ${this.generateRiskOverview(results)}
        ${this.generateThreatAnalysis(results)}
        ${this.generateAdvancedFeatures(results)}
        ${this.generateRecommendations(results)}
        ${this.generateActionButtons(results)}
      </div>
    `;

    this.container.innerHTML = html;
    this.container.classList.remove('d-none');
    
    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }

    // Add event listeners
    this.setupEventListeners();
  }

  generateRiskOverview(results) {
    const riskLevel = results.finalResult?.riskLevel || 'unknown';
    const confidence = results.finalResult?.confidence || 0;
    const explanation = results.finalResult?.explanation || 'Analysis completed';

    return `
      <div class="risk-overview">
        <div class="risk-header d-flex justify-content-between align-items-center">
          <div>
            <span class="risk-badge badge ${this.getRiskBadgeClass(riskLevel)} fs-6">
              ${this.getRiskIcon(riskLevel)} ${riskLevel.toUpperCase()}
            </span>
            <span class="confidence-score ms-2 text-muted">
              ${Math.round(confidence * 100)}% confidence
            </span>
          </div>
          <div class="analysis-time">
            <small class="text-muted">
              <i data-feather="clock"></i>
              ${new Date().toLocaleTimeString()}
            </small>
          </div>
        </div>
        
        <div class="risk-explanation mt-3">
          <p class="lead">${explanation}</p>
        </div>

        ${this.generateQuickStats(results)}
      </div>
    `;
  }

  generateQuickStats(results) {
    const stats = [];
    
    if (results.fingerprintMatch?.found) {
      stats.push({
        icon: 'hash',
        label: 'Seen Before',
        value: `${results.fingerprintMatch.count} times`,
        type: 'warning'
      });
    }

    if (results.redirectTrace?.totalRedirects > 0) {
      stats.push({
        icon: 'shuffle',
        label: 'Redirects',
        value: results.redirectTrace.totalRedirects,
        type: 'info'
      });
    }

    if (results.multilingualAnalysis?.flaggedKeywords.length > 0) {
      stats.push({
        icon: 'globe',
        label: 'Suspicious Keywords',
        value: results.multilingualAnalysis.flaggedKeywords.length,
        type: 'warning'
      });
    }

    if (results.aiAnalysis?.threats) {
      const threatCount = Object.values(results.aiAnalysis.threats).filter(Boolean).length;
      if (threatCount > 0) {
        stats.push({
          icon: 'shield-alert',
          label: 'Threat Types',
          value: threatCount,
          type: 'danger'
        });
      }
    }

    if (stats.length === 0) return '';

    return `
      <div class="quick-stats mt-3">
        <div class="row g-2">
          ${stats.map(stat => `
            <div class="col-6 col-md-3">
              <div class="stat-item text-center p-2 border rounded">
                <i data-feather="${stat.icon}" class="text-${stat.type}"></i>
                <div class="stat-value fw-bold">${stat.value}</div>
                <div class="stat-label small text-muted">${stat.label}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateThreatAnalysis(results) {
    let html = '<div class="threat-analysis mt-4">';

    // Pattern Analysis
    if (results.patternAnalysis?.flags.length > 0) {
      html += `
        <div class="analysis-section">
          <h6>
            <i data-feather="search"></i>
            Pattern Detection
          </h6>
          <div class="pattern-flags">
            ${results.patternAnalysis.flags.map(flag => `
              <div class="alert alert-warning py-2 mb-2">
                <div class="d-flex justify-content-between">
                  <strong>${flag.name}:</strong>
                  <span class="badge bg-warning text-dark">Weight: ${flag.weight}</span>
                </div>
                <small>${flag.description}</small>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // AI Analysis
    if (results.aiAnalysis && this.options.showTechnicalDetails) {
      html += this.generateAIAnalysisSection(results.aiAnalysis);
    }

    // Regional Analysis
    if (results.aiAnalysis?.regionalAnalysis && this.options.showRegionalAnalysis) {
      html += this.generateRegionalAnalysisSection(results.aiAnalysis.regionalAnalysis);
    }

    html += '</div>';
    return html;
  }

  generateAIAnalysisSection(aiAnalysis) {
    const threats = aiAnalysis.threats || {};
    const activeThreats = Object.entries(threats).filter(([_, active]) => active);

    if (activeThreats.length === 0) return '';

    return `
      <div class="analysis-section">
        <h6>
          <i data-feather="cpu"></i>
          AI Threat Detection
        </h6>
        <div class="threat-types">
          ${activeThreats.map(([threat, _]) => `
            <span class="badge bg-danger me-2 mb-2">
              ${this.formatThreatName(threat)}
            </span>
          `).join('')}
        </div>
        
        ${aiAnalysis.severity ? `
          <div class="severity-indicator mt-2">
            <label class="form-label small">Severity Level:</label>
            <div class="progress" style="height: 20px;">
              <div class="progress-bar ${this.getSeverityClass(aiAnalysis.severity)}" 
                   style="width: ${aiAnalysis.severity * 10}%">
                ${aiAnalysis.severity}/10
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  generateRegionalAnalysisSection(regionalAnalysis) {
    const items = [];
    
    if (regionalAnalysis.targetingASEAN) {
      items.push('Targeting ASEAN region');
    }
    if (regionalAnalysis.localBankMimicry) {
      items.push('Mimicking local banks');
    }
    if (regionalAnalysis.culturalEngineering) {
      items.push('Using cultural engineering');
    }
    if (regionalAnalysis.languageSpecificTactics?.length > 0) {
      items.push(`Language-specific tactics: ${regionalAnalysis.languageSpecificTactics.join(', ')}`);
    }

    if (items.length === 0) return '';

    return `
      <div class="analysis-section">
        <h6>
          <i data-feather="map"></i>
          Regional Analysis
        </h6>
        <ul class="list-unstyled">
          ${items.map(item => `
            <li class="mb-1">
              <i data-feather="chevron-right" class="text-primary" style="width: 16px; height: 16px;"></i>
              ${item}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  generateAdvancedFeatures(results) {
    let html = '<div class="advanced-features mt-4">';

    // Fingerprint Analysis
    if (results.fingerprintMatch?.found && this.options.showFingerprints) {
      html += this.generateFingerprintSection(results.fingerprintMatch);
    }

    // Redirect Chain
    if (results.redirectTrace?.chain?.length > 1 && this.options.showRedirectChain) {
      html += this.generateRedirectSection(results.redirectTrace);
    }

    // Multilingual Analysis
    if (results.multilingualAnalysis?.detectedLanguages.length > 0 && this.options.showMultilingualFlags) {
      html += this.generateMultilingualSection(results.multilingualAnalysis);
    }

    // Regional Risk
    if (results.regionalRisk) {
      html += this.generateRegionalRiskSection(results.regionalRisk);
    }

    html += '</div>';
    return html;
  }

  generateFingerprintSection(fingerprintMatch) {
    return `
      <div class="analysis-section">
        <h6>
          <i data-feather="hash"></i>
          Scam DNA Fingerprint
        </h6>
        <div class="fingerprint-info alert alert-info">
          <div class="row">
            <div class="col-md-6">
              <strong>Match Found:</strong> This URL pattern has been seen <strong>${fingerprintMatch.count}</strong> time(s)
            </div>
            <div class="col-md-6">
              <strong>First Seen:</strong> ${fingerprintMatch.daysSinceFirst} days ago
            </div>
          </div>
          <div class="mt-2">
            <span class="badge ${this.getRiskBadgeClass(fingerprintMatch.riskLevel)}">
              ${fingerprintMatch.riskLevel.toUpperCase()} RISK
            </span>
          </div>
        </div>
      </div>
    `;
  }

  generateRedirectSection(redirectTrace) {
    const analysis = redirectTrace.analysis || {};
    
    return `
      <div class="analysis-section">
        <h6>
          <i data-feather="shuffle"></i>
          Redirect Chain Analysis
        </h6>
        <div class="redirect-chain-display">
          ${redirectTrace.chain.map((step, index) => `
            <div class="redirect-step d-flex align-items-center mb-2">
              <span class="step-number badge bg-secondary me-2">${index + 1}</span>
              <div class="step-content flex-grow-1">
                <code class="text-break">${this.extractDomain(step.url)}</code>
                <small class="text-muted ms-2">(${step.status})</small>
              </div>
              ${index < redirectTrace.chain.length - 1 ? '<i data-feather="arrow-right" class="text-muted ms-2"></i>' : ''}
            </div>
          `).join('')}
        </div>
        
        ${analysis.suspiciousPatterns?.length > 0 ? `
          <div class="redirect-warnings mt-2">
            ${analysis.suspiciousPatterns.map(pattern => `
              <div class="alert alert-warning py-1 px-2 mb-1">
                <small><i data-feather="alert-triangle" style="width: 14px; height: 14px;"></i> ${pattern}</small>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  generateMultilingualSection(multilingualAnalysis) {
    return `
      <div class="analysis-section">
        <h6>
          <i data-feather="globe"></i>
          Multilingual Analysis
        </h6>
        <div class="language-detection">
          <div class="detected-languages mb-2">
            <strong>Detected Languages:</strong>
            ${multilingualAnalysis.detectedLanguages.map(lang => `
              <span class="badge bg-info me-1">${lang.name}</span>
            `).join('')}
          </div>
          
          ${multilingualAnalysis.flaggedKeywords.length > 0 ? `
            <div class="flagged-keywords">
              <strong>Suspicious Keywords:</strong>
              <div class="mt-1">
                ${multilingualAnalysis.flaggedKeywords.slice(0, 10).map(keyword => `
                  <span class="badge bg-warning text-dark me-1 mb-1" title="${keyword.category}">
                    ${keyword.keyword}
                  </span>
                `).join('')}
                ${multilingualAnalysis.flaggedKeywords.length > 10 ? `
                  <span class="text-muted small">+${multilingualAnalysis.flaggedKeywords.length - 10} more</span>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          ${multilingualAnalysis.suspiciousPhrases?.length > 0 ? `
            <div class="suspicious-phrases mt-2">
              <strong>Known Scam Phrases:</strong>
              ${multilingualAnalysis.suspiciousPhrases.map(phrase => `
                <div class="alert alert-danger py-1 px-2 mb-1">
                  <small>"${phrase.phrase}" (${phrase.language})</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  generateRegionalRiskSection(regionalRisk) {
    return `
      <div class="analysis-section">
        <h6>
          <i data-feather="map-pin"></i>
          Regional Risk Assessment
        </h6>
        <div class="regional-risk-info">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span><strong>Your Region:</strong> ${regionalRisk.region}</span>
            <span class="badge ${this.getRiskBadgeClass(regionalRisk.riskLevel)}">
              ${regionalRisk.riskLevel.toUpperCase()}
            </span>
          </div>
          <div class="region-stats">
            <small class="text-muted">Recent scam reports: ${regionalRisk.scamCount}</small>
          </div>
          <div class="region-recommendation mt-2">
            <small>${regionalRisk.recommendation}</small>
          </div>
        </div>
      </div>
    `;
  }

  generateRecommendations(results) {
    const recommendations = results.finalResult?.suggestions || results.aiAnalysis?.recommendations || [];
    
    if (recommendations.length === 0) return '';

    return `
      <div class="recommendations mt-4">
        <h6>
          <i data-feather="shield"></i>
          Security Recommendations
        </h6>
        <ul class="recommendation-list">
          ${recommendations.map(rec => `
            <li class="mb-2">
              <i data-feather="check-circle" class="text-success me-2" style="width: 16px; height: 16px;"></i>
              ${rec}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  generateActionButtons(results) {
    const buttons = [];
    
    // Report button
    if (this.options.enableReporting && results.finalResult?.riskLevel !== 'safe') {
      buttons.push(`
        <button type="button" class="btn btn-danger" onclick="window.PaySavvy.reportScam('${results.url}')">
          <i data-feather="flag"></i>
          Report Scam
        </button>
      `);
    }

    // Share results
    buttons.push(`
      <button type="button" class="btn btn-outline-primary" onclick="window.PaySavvy.shareResults()">
        <i data-feather="share-2"></i>
        Share Results
      </button>
    `);

    // Download report
    buttons.push(`
      <button type="button" class="btn btn-outline-secondary" onclick="window.PaySavvy.downloadReport()">
        <i data-feather="download"></i>
        Download Report
      </button>
    `);

    if (buttons.length === 0) return '';

    return `
      <div class="action-buttons mt-4 text-center">
        <div class="btn-group" role="group">
          ${buttons.join('')}
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Add any specific event listeners for interactive elements
    const expandButtons = this.container.querySelectorAll('.expand-details');
    expandButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.dataset.target;
        const element = document.getElementById(target);
        if (element) {
          element.classList.toggle('d-none');
        }
      });
    });
  }

  addStyles() {
    if (document.getElementById('result-box-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'result-box-styles';
    styles.textContent = `
      .result-box-component {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        margin-top: 1rem;
      }

      .risk-overview {
        border-bottom: 1px solid #e9ecef;
        padding-bottom: 1rem;
      }

      .risk-badge.bg-success {
        background-color: #10b981 !important;
      }

      .risk-badge.bg-warning {
        background-color: #f59e0b !important;
        color: #000 !important;
      }

      .risk-badge.bg-danger {
        background-color: #ef4444 !important;
      }

      .analysis-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        border-left: 4px solid var(--bs-primary);
      }

      .analysis-section h6 {
        color: var(--bs-primary);
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .stat-item {
        transition: transform 0.2s ease;
      }

      .stat-item:hover {
        transform: translateY(-2px);
      }

      .redirect-step {
        background: white;
        padding: 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid #dee2e6;
      }

      .step-number {
        min-width: 2rem;
        text-align: center;
      }

      .threat-types .badge {
        font-size: 0.75rem;
      }

      .severity-indicator .progress {
        background-color: #e9ecef;
      }

      .progress-bar.bg-success {
        background-color: #10b981 !important;
      }

      .progress-bar.bg-warning {
        background-color: #f59e0b !important;
      }

      .progress-bar.bg-danger {
        background-color: #ef4444 !important;
      }

      .recommendation-list {
        list-style: none;
        padding-left: 0;
      }

      .fingerprint-info {
        background-color: #e7f3ff;
        border-color: #b6d7ff;
      }

      .action-buttons {
        border-top: 1px solid #e9ecef;
        padding-top: 1rem;
      }

      .language-detection .badge {
        font-size: 0.75rem;
      }

      .flagged-keywords .badge {
        cursor: help;
      }

      @media (max-width: 768px) {
        .result-box-component {
          padding: 1rem;
        }
        
        .quick-stats .col-6 {
          margin-bottom: 0.5rem;
        }
        
        .action-buttons .btn-group {
          flex-direction: column;
          width: 100%;
        }
        
        .action-buttons .btn {
          margin-bottom: 0.5rem;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  getRiskBadgeClass(riskLevel) {
    switch (riskLevel) {
      case 'safe': return 'bg-success';
      case 'suspicious': return 'bg-warning text-dark';
      case 'dangerous': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getRiskIcon(riskLevel) {
    switch (riskLevel) {
      case 'safe': return '✓';
      case 'suspicious': return '⚠️';
      case 'dangerous': return '🚨';
      default: return '?';
    }
  }

  getSeverityClass(severity) {
    if (severity <= 3) return 'bg-success';
    if (severity <= 6) return 'bg-warning';
    return 'bg-danger';
  }

  formatThreatName(threat) {
    return threat.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('d-none');
    }
  }

  show() {
    if (this.container) {
      this.container.classList.remove('d-none');
    }
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
      this.hide();
    }
    this.currentResults = null;
  }

  getResults() {
    return this.currentResults;
  }
}