// Redirect Chain Visualizer - Trace URL redirects and shorteners
export class RedirectTracer {
  constructor() {
    this.maxRedirects = 10;
    this.timeout = 5000;
  }

  async traceRedirects(url, options = {}) {
    const {
      maxRedirects = this.maxRedirects,
      timeout = this.timeout,
      includeHeaders = false
    } = options;

    const chain = [];
    let currentUrl = url;
    let redirectCount = 0;

    try {
      while (redirectCount < maxRedirects) {
        const response = await this.fetchWithTimeout(currentUrl, {
          method: 'HEAD',
          redirect: 'manual'
        }, timeout);

        const chainEntry = {
          url: currentUrl,
          status: response.status,
          statusText: response.statusText,
          timestamp: Date.now(),
          redirectCount: redirectCount
        };

        if (includeHeaders) {
          chainEntry.headers = Object.fromEntries(response.headers.entries());
        }

        chain.push(chainEntry);

        // Check if this is a redirect
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            currentUrl = this.resolveUrl(currentUrl, location);
            redirectCount++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return {
        success: true,
        chain: chain,
        finalUrl: currentUrl,
        totalRedirects: redirectCount,
        analysis: this.analyzeChain(chain)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        chain: chain,
        finalUrl: currentUrl,
        totalRedirects: redirectCount
      };
    }
  }

  async fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  resolveUrl(base, relative) {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }

  analyzeChain(chain) {
    const analysis = {
      riskLevel: 'safe',
      suspiciousPatterns: [],
      urlShorteners: [],
      domainChanges: 0,
      protocolDowngrade: false
    };

    if (chain.length === 0) return analysis;

    const shorteners = [
      'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
      'short.link', 'rebrand.ly', 'buff.ly', 'cutt.ly', 'tiny.cc'
    ];

    let previousDomain = '';
    let hasHttps = false;
    let hasHttp = false;

    chain.forEach((entry, index) => {
      try {
        const urlObj = new URL(entry.url);
        const domain = urlObj.hostname.toLowerCase();

        // Check for URL shorteners
        if (shorteners.some(shortener => domain.includes(shortener))) {
          analysis.urlShorteners.push({
            domain: domain,
            position: index,
            url: entry.url
          });
        }

        // Track domain changes
        if (previousDomain && previousDomain !== domain) {
          analysis.domainChanges++;
        }
        previousDomain = domain;

        // Track protocol usage
        if (urlObj.protocol === 'https:') hasHttps = true;
        if (urlObj.protocol === 'http:') hasHttp = true;

        // Check for suspicious patterns
        if (domain.includes('.tk') || domain.includes('.ml') || 
            domain.includes('.ga') || domain.includes('.cf')) {
          analysis.suspiciousPatterns.push(`Suspicious TLD: ${domain}`);
        }

        if (entry.status === 302 && index > 3) {
          analysis.suspiciousPatterns.push('Excessive redirects detected');
        }

      } catch (error) {
        analysis.suspiciousPatterns.push(`Invalid URL in chain: ${entry.url}`);
      }
    });

    // Check for protocol downgrade
    if (hasHttps && hasHttp) {
      analysis.protocolDowngrade = true;
      analysis.suspiciousPatterns.push('Protocol downgrade detected (HTTPS to HTTP)');
    }

    // Calculate risk level
    let riskScore = 0;
    
    if (analysis.urlShorteners.length > 0) riskScore += 2;
    if (analysis.domainChanges > 2) riskScore += 2;
    if (analysis.protocolDowngrade) riskScore += 3;
    if (chain.length > 5) riskScore += 1;
    if (analysis.suspiciousPatterns.length > 0) riskScore += analysis.suspiciousPatterns.length;

    if (riskScore >= 5) {
      analysis.riskLevel = 'dangerous';
    } else if (riskScore >= 3) {
      analysis.riskLevel = 'suspicious';
    }

    return analysis;
  }

  formatChainForDisplay(traceResult) {
    if (!traceResult.success || !traceResult.chain) {
      return {
        html: '<div class="alert alert-warning">Unable to trace redirects</div>',
        summary: 'Trace failed'
      };
    }

    const chain = traceResult.chain;
    let html = '<div class="redirect-chain">';
    
    chain.forEach((entry, index) => {
      const isLast = index === chain.length - 1;
      const domain = this.extractDomain(entry.url);
      const statusClass = this.getStatusClass(entry.status);
      
      html += `
        <div class="redirect-step">
          <div class="redirect-domain ${statusClass}">
            <strong>${domain}</strong>
            <small class="text-muted">(${entry.status})</small>
          </div>
          ${!isLast ? '<div class="redirect-arrow">↓</div>' : ''}
        </div>
      `;
    });

    html += '</div>';

    // Add analysis summary
    if (traceResult.analysis) {
      const analysis = traceResult.analysis;
      html += `
        <div class="redirect-analysis mt-3">
          <div class="d-flex justify-content-between">
            <span>Risk Level:</span>
            <span class="badge ${this.getRiskBadgeClass(analysis.riskLevel)}">${analysis.riskLevel.toUpperCase()}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span>Total Redirects:</span>
            <span>${traceResult.totalRedirects}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span>Domain Changes:</span>
            <span>${analysis.domainChanges}</span>
          </div>
        </div>
      `;

      if (analysis.suspiciousPatterns.length > 0) {
        html += '<div class="mt-2"><small class="text-warning">⚠️ ' + 
                analysis.suspiciousPatterns.join(', ') + '</small></div>';
      }
    }

    return {
      html: html,
      summary: `${chain.length} steps, ${traceResult.totalRedirects} redirects`
    };
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  getStatusClass(status) {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400) return 'status-error';
    return 'status-unknown';
  }

  getRiskBadgeClass(riskLevel) {
    switch (riskLevel) {
      case 'dangerous': return 'bg-danger';
      case 'suspicious': return 'bg-warning text-dark';
      case 'safe': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  // Check if URL is likely a shortener
  isUrlShortener(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      const shorteners = [
        'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
        'short.link', 'rebrand.ly', 'buff.ly', 'cutt.ly', 'tiny.cc'
      ];
      return shorteners.some(shortener => domain.includes(shortener));
    } catch {
      return false;
    }
  }

  // Get quick redirect info without full trace
  async getQuickRedirectInfo(url) {
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'HEAD',
        redirect: 'manual'
      }, 3000);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        return {
          isRedirect: true,
          status: response.status,
          location: location ? this.resolveUrl(url, location) : null
        };
      }

      return {
        isRedirect: false,
        status: response.status
      };
    } catch (error) {
      return {
        isRedirect: false,
        error: error.message
      };
    }
  }
}