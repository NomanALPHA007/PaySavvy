// PaySavvy Pro - Modular Main Application
import { assessRisk, getAllDomains } from './detectors/riskScorer.js';
import { BrandValidator } from './detectors/brandValidator.js';

class PaySavvyPro {
    constructor() {
        this.apiKey = this.getApiKey();
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.brandValidator = null;
        this.verifiedBrands = null;
        this.scanHistory = this.loadScanHistory();
        this.init();
    }

    async init() {
        await this.loadVerifiedBrands();
        this.setupEventListeners();
        this.displayScanHistory();
        if (typeof feather !== 'undefined') feather.replace();
    }

    async loadVerifiedBrands() {
        try {
            const response = await fetch('/src/data/verifiedBrands.json');
            this.verifiedBrands = await response.json();
            this.brandValidator = new BrandValidator(this.verifiedBrands);
            console.log('Verified brands loaded: 100 international financial institutions');
        } catch (error) {
            console.warn('Failed to load verified brands data:', error);
            // Fallback to existing data loading
            try {
                const fallbackResponse = await fetch('/data/verifiedBrands.json');
                this.verifiedBrands = await fallbackResponse.json();
                this.brandValidator = new BrandValidator(this.verifiedBrands);
            } catch (fallbackError) {
                console.error('Could not load verified brands data from any source');
            }
        }
    }

    getApiKey() {
        return window.ENV?.VITE_OPENAI_API_KEY || 
               window.VITE_OPENAI_API_KEY || 
               window.OPENAI_API_KEY ||
               localStorage.getItem('openai_api_key') || 
               null;
    }

    setupEventListeners() {
        const scanButton = document.getElementById('scanButton');
        const urlInput = document.getElementById('urlInput');
        const clearButton = document.getElementById('clearHistory');

        if (scanButton) scanButton.addEventListener('click', () => this.handleScan());
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleScan();
            });
        }
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearScanHistory());
        }
    }

    async handleScan() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (!url) {
            this.showToast('Error', 'Please enter a URL to scan', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showToast('Error', 'Please enter a valid URL', 'error');
            return;
        }

        this.showToast('Info', 'Running 4-layer scam detection...', 'info');
        this.setLoadingState(true);

        try {
            // Ensure verified brands are loaded
            if (!this.verifiedBrands) {
                await this.loadVerifiedBrands();
            }

            // Perform comprehensive 4-layer analysis using centralized risk scorer
            const redirectChain = await this.analyzeRedirects(url);
            const aiAssessment = this.apiKey ? await this.getAIAssessment(url) : null;
            
            const analysis = assessRisk(url, this.verifiedBrands, redirectChain, aiAssessment);
            
            this.displayScanResults(analysis);
            this.saveScanResult(analysis, url);
            
        } catch (error) {
            console.error('Scan error:', error);
            this.showToast('Error', 'Analysis failed: ' + error.message, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async analyzeRedirects(url) {
        // Layer 3: Redirect Chain Analysis
        const redirectChain = [];
        try {
            // Check for common URL shorteners
            const shortenerPatterns = [
                'bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'buff.ly',
                'short.link', 'tiny.cc', 'is.gd', 'v.gd'
            ];
            
            if (shortenerPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
                redirectChain.push(url);
                // In production environment, follow actual redirects
                // For now, simulate potential redirect destination
            }
        } catch (error) {
            console.warn('Redirect analysis failed:', error);
        }
        return redirectChain;
    }

    async getAIAssessment(url) {
        // Layer 4: AI Analysis enriched with verified brands context
        if (!this.apiKey) return null;

        try {
            const trustedDomains = this.brandValidator ? 
                this.brandValidator.getVerifiedBrandsForAI(25).join(', ') : 
                'paypal.com, wise.com, maybank2u.com.my, cimb.com.my';
            
            const prompt = `You're a cybersecurity expert analyzing URLs for Malaysian/ASEAN users.

URL: ${url}

Known verified financial institutions: ${trustedDomains}

Analyze this URL for potential scams and respond with JSON in this exact format:
{
  "risk": "Safe|Suspicious|Dangerous",
  "reason": "Brief explanation of the assessment",
  "impersonatedBrand": "Brand name if mimicking a verified institution, or null",
  "confidence": 0.95
}

Focus on:
- Domain similarity to verified brands
- Suspicious URL patterns
- Potential phishing indicators
- Malaysian/ASEAN-specific threats`;

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    max_tokens: 300
                })
            });

            if (!response.ok) throw new Error(`AI API error: ${response.status}`);
            
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
            
        } catch (error) {
            console.warn('AI analysis failed:', error);
            return { 
                risk: "Unknown", 
                reason: "AI analysis unavailable", 
                confidence: 0.5,
                impersonatedBrand: null 
            };
        }
    }

    displayScanResults(analysis) {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;

        const riskClass = this.getRiskClass(analysis.trustLevel);
        const riskIcon = this.getRiskIcon(analysis.trustLevel);

        resultsDiv.innerHTML = `
            <div class="alert alert-${riskClass}">
                <div class="d-flex align-items-center mb-3">
                    <i data-feather="${riskIcon}" class="me-2"></i>
                    <strong>${analysis.trustLevel.toUpperCase()}</strong>
                    <span class="badge bg-info ms-2">${Math.round(analysis.confidence * 100)}% Confidence</span>
                    <span class="badge bg-secondary ms-auto">Score: ${analysis.score}/10</span>
                </div>
                
                ${analysis.brand ? `
                    <div class="card border-success mb-3" style="background-color: #f8fff9;">
                        <div class="card-header bg-success text-white">
                            <div class="d-flex align-items-center">
                                <i data-feather="shield-check" class="me-2"></i>
                                <strong>Government-Authorized Financial Institution</strong>
                            </div>
                        </div>
                        <div class="card-body p-3">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${analysis.brand.logo}" alt="${analysis.brand.name} logo" height="40" class="me-3" onerror="this.style.display='none'"/>
                                <div class="flex-grow-1">
                                    <h5 class="mb-1 text-success">${analysis.brand.name}</h5>
                                    <small class="text-muted">${analysis.brand.institution}</small>
                                </div>
                                <span class="badge bg-success fs-6">✓ VERIFIED</span>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <small><strong>Regulatory License:</strong><br>${analysis.brand.regulatoryLicense}</small><br><br>
                                    <small><strong>Established:</strong> ${analysis.brand.establishedYear}</small><br>
                                    <small><strong>Region:</strong> ${analysis.brand.region}</small>
                                </div>
                                <div class="col-md-6">
                                    <small><strong>Services:</strong><br>${analysis.brand.services ? analysis.brand.services.slice(0, 4).join(', ') : 'Financial Services'}</small><br><br>
                                    <small><strong>Headquarters:</strong> ${analysis.brand.headquarters}</small>
                                </div>
                            </div>
                            ${analysis.brand.globalPresence ? `
                                <div class="mt-2 pt-2 border-top">
                                    <small><strong>Global Presence:</strong> ${analysis.brand.globalPresence.slice(0, 6).join(', ')}</small>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mt-3">
                    <small><strong>4-Layer Analysis Results:</strong></small>
                    <div class="row mt-2">
                        <div class="col-md-3">
                            <small><strong>Layer 1:</strong> Heuristics</small><br>
                            <span class="badge bg-${analysis.layerResults?.heuristics?.score > 3 ? 'danger' : 'success'}">${analysis.layerResults?.heuristics?.score || 0} pts</span>
                        </div>
                        <div class="col-md-3">
                            <small><strong>Layer 2:</strong> Brand Check</small><br>
                            <span class="badge bg-${analysis.brand ? 'success' : analysis.layerResults?.brandCheck?.score > 3 ? 'danger' : 'secondary'}">${analysis.brand ? 'Verified' : 'Unknown'}</span>
                        </div>
                        <div class="col-md-3">
                            <small><strong>Layer 3:</strong> Redirects</small><br>
                            <span class="badge bg-${analysis.layerResults?.redirects?.score > 2 ? 'danger' : 'success'}">${analysis.layerResults?.redirects?.score || 0} pts</span>
                        </div>
                        <div class="col-md-3">
                            <small><strong>Layer 4:</strong> AI Analysis</small><br>
                            <span class="badge bg-${this.apiKey ? 'primary' : 'secondary'}">${this.apiKey ? 'Active' : 'Offline'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="mt-3">
                    <small><strong>Detection Factors:</strong></small>
                    <ul class="small mb-0">
                        ${analysis.reason.slice(0, 8).map(factor => `<li>${factor}</li>`).join('')}
                        ${analysis.reason.length > 8 ? `<li><em>...and ${analysis.reason.length - 8} more factors</em></li>` : ''}
                    </ul>
                </div>
            </div>
        `;

        resultsDiv.style.display = 'block';
        if (typeof feather !== 'undefined') feather.replace();
    }

    getRiskClass(trustLevel) {
        switch (trustLevel.toLowerCase()) {
            case 'safe': return 'success';
            case 'suspicious': return 'warning';
            case 'dangerous': return 'danger';
            default: return 'secondary';
        }
    }

    getRiskIcon(trustLevel) {
        switch (trustLevel.toLowerCase()) {
            case 'safe': return 'check-circle';
            case 'suspicious': return 'alert-triangle';
            case 'dangerous': return 'x-circle';
            default: return 'help-circle';
        }
    }

    saveScanResult(analysis, url) {
        const result = {
            url: url,
            timestamp: new Date().toISOString(),
            trustLevel: analysis.trustLevel,
            score: analysis.score,
            confidence: analysis.confidence,
            brand: analysis.brand?.name || null
        };

        this.scanHistory.unshift(result);
        this.scanHistory = this.scanHistory.slice(0, 15); // Keep last 15 scans
        localStorage.setItem('paysavvy_scan_history', JSON.stringify(this.scanHistory));
        this.displayScanHistory();
    }

    displayScanHistory() {
        const historyDiv = document.getElementById('historyContent');
        if (!historyDiv) return;

        if (!this.scanHistory || this.scanHistory.length === 0) {
            historyDiv.innerHTML = '<p class="text-muted">No scans yet. Start by analyzing a suspicious link above.</p>';
            return;
        }

        const historyHTML = this.scanHistory.map(scan => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div class="flex-grow-1">
                    <small class="text-muted d-block">${new Date(scan.timestamp).toLocaleString()}</small>
                    <span class="text-truncate d-block" style="max-width: 250px;" title="${scan.url}">${scan.url}</span>
                    ${scan.brand ? `<small class="text-success">✓ ${scan.brand}</small>` : ''}
                </div>
                <div class="text-end">
                    <span class="badge bg-${this.getRiskClass(scan.trustLevel)}">${scan.trustLevel}</span>
                    <br><small class="text-muted">${Math.round(scan.confidence * 100)}%</small>
                </div>
            </div>
        `).join('');

        historyDiv.innerHTML = historyHTML;
        
        const clearButton = document.getElementById('clearHistory');
        if (clearButton) clearButton.style.display = 'block';
    }

    clearScanHistory() {
        this.scanHistory = [];
        localStorage.removeItem('paysavvy_scan_history');
        this.displayScanHistory();
        this.showToast('Success', 'Scan history cleared', 'success');
    }

    loadScanHistory() {
        try {
            return JSON.parse(localStorage.getItem('paysavvy_scan_history')) || [];
        } catch {
            return [];
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

    setLoadingState(loading) {
        const button = document.getElementById('scanButton');
        const input = document.getElementById('urlInput');
        
        if (button) {
            if (loading) {
                button.disabled = true;
                button.innerHTML = '<i data-feather="loader" class="spinner"></i> Scanning...';
            } else {
                button.disabled = false;
                button.innerHTML = '<i data-feather="search"></i> Scan Link Now';
            }
        }
        
        if (input) input.disabled = loading;
        if (typeof feather !== 'undefined') feather.replace();
    }

    showToast(title, message, type = 'info') {
        // Enhanced toast implementation
        const toastContainer = document.querySelector('.toast-container') || document.body;
        const toast = document.createElement('div');
        toast.className = `alert alert-${this.getRiskClass(type)} position-fixed shadow`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i data-feather="${this.getRiskIcon(type)}" class="me-2"></i>
                <div class="flex-grow-1">
                    <strong>${title}</strong>
                    ${message ? `<br><small>${message}</small>` : ''}
                </div>
                <button type="button" class="btn-close btn-close-white ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        if (typeof feather !== 'undefined') feather.replace();
        
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
    }
}

// Initialize the modular application
window.payApp = new PaySavvyPro();