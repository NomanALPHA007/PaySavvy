// Enhanced URL Input Scanner with SMS/WhatsApp Paste Shield
export class InputScanner {
  constructor(inputElementId, options = {}) {
    this.inputElement = document.getElementById(inputElementId);
    this.options = {
      enablePasteShield: true,
      enableAutoDetection: true,
      enableRealTimeValidation: true,
      suspiciousPatterns: [
        /bit\.ly/i, /tinyurl/i, /\.tk$/i, /\.ml$/i, /verify.*account/i,
        /urgent.*action/i, /click.*here/i, /mayb[4@]nk/i, /c[i1]mb/i
      ],
      ...options
    };
    
    this.clipboard = null;
    this.lastPasteContent = '';
    this.pasteShieldActive = false;
    
    this.init();
  }

  init() {
    if (!this.inputElement) {
      console.error('Input element not found');
      return;
    }

    this.setupEventListeners();
    this.createPasteShieldUI();
    
    if (this.options.enableRealTimeValidation) {
      this.setupRealTimeValidation();
    }
  }

  setupEventListeners() {
    // Paste event with SMS/WhatsApp shield
    this.inputElement.addEventListener('paste', (e) => {
      if (this.options.enablePasteShield) {
        this.handlePasteWithShield(e);
      }
    });

    // Input event for real-time analysis
    this.inputElement.addEventListener('input', (e) => {
      if (this.options.enableRealTimeValidation) {
        this.handleRealTimeInput(e);
      }
    });

    // Focus event to check clipboard
    this.inputElement.addEventListener('focus', () => {
      if (this.options.enableAutoDetection) {
        this.checkClipboardForSuspiciousContent();
      }
    });

    // Drag and drop support
    this.inputElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.inputElement.classList.add('drag-over');
    });

    this.inputElement.addEventListener('dragleave', () => {
      this.inputElement.classList.remove('drag-over');
    });

    this.inputElement.addEventListener('drop', (e) => {
      e.preventDefault();
      this.inputElement.classList.remove('drag-over');
      
      const text = e.dataTransfer.getData('text');
      if (text && this.containsURL(text)) {
        this.suggestScan(text, 'drag_drop');
      }
    });
  }

  async handlePasteWithShield(event) {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    
    if (!pastedText || pastedText === this.lastPasteContent) {
      return;
    }

    this.lastPasteContent = pastedText;

    // Check if pasted content contains URLs
    if (this.containsURL(pastedText)) {
      const urls = this.extractURLs(pastedText);
      const suspiciousUrls = urls.filter(url => this.isSuspiciousURL(url));

      if (suspiciousUrls.length > 0) {
        event.preventDefault();
        this.showPasteShield(pastedText, suspiciousUrls);
        return;
      }
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(pastedText)) {
      event.preventDefault();
      this.suggestScan(pastedText, 'suspicious_paste');
    }
  }

  containsURL(text) {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
    return urlRegex.test(text);
  }

  extractURLs(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  isSuspiciousURL(url) {
    return this.options.suspiciousPatterns.some(pattern => pattern.test(url));
  }

  containsSuspiciousPatterns(text) {
    const suspiciousKeywords = [
      'verify account', 'urgent action', 'click here', 'suspended account',
      'akaun disekat', 'klik disini', 'segera', 'verify sekarang'
    ];
    
    const lowerText = text.toLowerCase();
    return suspiciousKeywords.some(keyword => lowerText.includes(keyword));
  }

  showPasteShield(pastedText, suspiciousUrls) {
    const shieldModal = this.createShieldModal(pastedText, suspiciousUrls);
    document.body.appendChild(shieldModal);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (shieldModal.parentNode) {
        shieldModal.remove();
      }
    }, 30000);
  }

  createShieldModal(pastedText, suspiciousUrls) {
    const modal = document.createElement('div');
    modal.className = 'paste-shield-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h5>🛡️ Paste Shield Alert</h5>
          <button type="button" class="btn-close" onclick="this.closest('.paste-shield-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            <strong>Suspicious content detected!</strong><br>
            The pasted text contains ${suspiciousUrls.length} potentially dangerous link(s).
          </div>
          
          <div class="suspicious-urls">
            <h6>Detected URLs:</h6>
            ${suspiciousUrls.map(url => `
              <div class="url-item">
                <code>${url}</code>
                <button class="btn btn-sm btn-primary ms-2" onclick="window.PaySavvy.scanUrl('${url}')">
                  Scan This URL
                </button>
              </div>
            `).join('')}
          </div>
          
          <div class="original-text mt-3">
            <h6>Original message:</h6>
            <div class="text-content">${this.escapeHtml(pastedText.substring(0, 200))}${pastedText.length > 200 ? '...' : ''}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" onclick="this.closest('.paste-shield-modal').remove()">
            Block Paste
          </button>
          <button type="button" class="btn btn-warning" onclick="window.PaySavvy.inputScanner.allowPaste('${this.escapeHtml(pastedText)}'); this.closest('.paste-shield-modal').remove();">
            Paste Anyway
          </button>
          <button type="button" class="btn btn-success" onclick="window.PaySavvy.scanUrl('${suspiciousUrls[0]}'); this.closest('.paste-shield-modal').remove();">
            Scan & Paste
          </button>
        </div>
      </div>
    `;

    return modal;
  }

  suggestScan(text, source = 'unknown') {
    const urls = this.extractURLs(text);
    
    if (urls.length > 0) {
      const suggestion = document.createElement('div');
      suggestion.className = 'scan-suggestion alert alert-info';
      suggestion.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <span>
            <i data-feather="shield"></i>
            Suspicious URL detected. Want to scan it first?
          </span>
          <div>
            <button class="btn btn-sm btn-primary me-2" onclick="window.PaySavvy.scanUrl('${urls[0]}')">
              Scan Now
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
              Dismiss
            </button>
          </div>
        </div>
      `;

      // Insert suggestion near the input
      this.inputElement.parentNode.insertBefore(suggestion, this.inputElement.nextSibling);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (suggestion.parentNode) {
          suggestion.remove();
        }
      }, 10000);

      // Update feather icons
      if (window.feather) {
        window.feather.replace();
      }
    }

    // Track suggestion source
    this.trackSuggestionEvent(source, urls.length);
  }

  allowPaste(text) {
    this.inputElement.value = text;
    this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  createPasteShieldUI() {
    // Add CSS for paste shield
    if (!document.getElementById('paste-shield-styles')) {
      const styles = document.createElement('style');
      styles.id = 'paste-shield-styles';
      styles.textContent = `
        .paste-shield-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .paste-shield-modal .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
        }
        
        .paste-shield-modal .modal-content {
          position: relative;
          background: white;
          border-radius: 0.5rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .paste-shield-modal .modal-header {
          padding: 1rem;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: between;
          align-items: center;
        }
        
        .paste-shield-modal .modal-body {
          padding: 1rem;
        }
        
        .paste-shield-modal .modal-footer {
          padding: 1rem;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        
        .paste-shield-modal .url-item {
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: between;
          align-items: center;
        }
        
        .paste-shield-modal .text-content {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .scan-suggestion {
          margin-top: 0.5rem;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .drag-over {
          border-color: #007bff !important;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  setupRealTimeValidation() {
    let validationTimeout;
    
    this.inputElement.addEventListener('input', (e) => {
      clearTimeout(validationTimeout);
      
      validationTimeout = setTimeout(() => {
        const value = e.target.value.trim();
        if (value && this.containsURL(value)) {
          this.showRealTimeValidation(value);
        } else {
          this.hideRealTimeValidation();
        }
      }, 500); // Debounce for 500ms
    });
  }

  showRealTimeValidation(url) {
    let validationDiv = document.getElementById('realtime-validation');
    
    if (!validationDiv) {
      validationDiv = document.createElement('div');
      validationDiv.id = 'realtime-validation';
      validationDiv.className = 'realtime-validation mt-2';
      this.inputElement.parentNode.insertBefore(validationDiv, this.inputElement.nextSibling);
    }

    const isValid = this.isValidURL(url);
    const isSuspicious = this.isSuspiciousURL(url);
    
    let statusClass = 'text-success';
    let statusIcon = 'check-circle';
    let statusText = 'Valid URL format';
    
    if (!isValid) {
      statusClass = 'text-danger';
      statusIcon = 'x-circle';
      statusText = 'Invalid URL format';
    } else if (isSuspicious) {
      statusClass = 'text-warning';
      statusIcon = 'alert-triangle';
      statusText = 'Potentially suspicious URL';
    }

    validationDiv.innerHTML = `
      <small class="${statusClass}">
        <i data-feather="${statusIcon}"></i>
        ${statusText}
      </small>
    `;

    if (window.feather) {
      window.feather.replace();
    }
  }

  hideRealTimeValidation() {
    const validationDiv = document.getElementById('realtime-validation');
    if (validationDiv) {
      validationDiv.remove();
    }
  }

  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  async checkClipboardForSuspiciousContent() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText && clipboardText !== this.lastPasteContent) {
          if (this.containsURL(clipboardText) && this.containsSuspiciousPatterns(clipboardText)) {
            this.showClipboardWarning(clipboardText);
          }
        }
      }
    } catch (error) {
      // Clipboard access denied or not supported
      console.debug('Clipboard access not available:', error);
    }
  }

  showClipboardWarning(clipboardText) {
    const warning = document.createElement('div');
    warning.className = 'clipboard-warning alert alert-warning alert-dismissible';
    warning.innerHTML = `
      <div>
        <i data-feather="clipboard"></i>
        <strong>Clipboard Alert:</strong> Suspicious content detected in clipboard.
        <button class="btn btn-sm btn-outline-primary ms-2" onclick="window.PaySavvy.inputScanner.suggestScan('${this.escapeHtml(clipboardText)}', 'clipboard')">
          Check Content
        </button>
      </div>
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    this.inputElement.parentNode.insertBefore(warning, this.inputElement);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.remove();
      }
    }, 15000);

    if (window.feather) {
      window.feather.replace();
    }
  }

  trackSuggestionEvent(source, urlCount) {
    // Track suggestion analytics
    const event = {
      type: 'paste_shield_suggestion',
      source: source,
      urlCount: urlCount,
      timestamp: Date.now()
    };

    // Store in localStorage for analytics
    const analytics = JSON.parse(localStorage.getItem('paysavvy_analytics') || '[]');
    analytics.push(event);
    
    // Keep only last 100 events
    if (analytics.length > 100) {
      analytics.splice(0, analytics.length - 100);
    }
    
    localStorage.setItem('paysavvy_analytics', JSON.stringify(analytics));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  enablePasteShield() {
    this.options.enablePasteShield = true;
  }

  disablePasteShield() {
    this.options.enablePasteShield = false;
  }

  getAnalytics() {
    const analytics = JSON.parse(localStorage.getItem('paysavvy_analytics') || '[]');
    const suggestions = analytics.filter(event => event.type === 'paste_shield_suggestion');
    
    return {
      totalSuggestions: suggestions.length,
      sourceBreakdown: suggestions.reduce((acc, event) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      }, {}),
      averageUrlsPerSuggestion: suggestions.length > 0 
        ? suggestions.reduce((sum, event) => sum + event.urlCount, 0) / suggestions.length 
        : 0
    };
  }
}