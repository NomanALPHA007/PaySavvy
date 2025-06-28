/**
 * PaySavvy - AI-powered Fake Payment Link Detector
 * Main Application Logic
 */

// Configuration
const CONFIG = {
    // OpenAI API configuration
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    OPENAI_MODEL: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    
    // Risk level thresholds
    RISK_THRESHOLDS: {
        SAFE: 2,
        SUSPICIOUS: 4,
        DANGEROUS: 5
    },
    
    // Malaysian-specific scam patterns
    SCAM_PATTERNS: {
        // Suspicious TLDs
        SUSPICIOUS_TLDS: ['.tk', '.ml', '.ga', '.cf', '.ru', '.biz', '.cc', '.info', '.click'],
        
        // Typosquatting patterns for Malaysian banks
        TYPOSQUATTING: [
            'mayb4nk', 'mayb@nk', 'maybankk', 'may-bank', 'maybank1',
            'publicb@nk', 'publicbankk', 'public-bank', 'publicbank1',
            'rhbb@nk', 'rhbbankk', 'rhb-bank', 'rhbbank1',
            'cimbankk', 'cimb@nk', 'cimb-bank', 'cimbbank1',
            'hlbb@nk', 'hlbbankk', 'hlb-bank', 'hlbbank1',
            'uobb@nk', 'uobbankk', 'uob-bank', 'uobbank1',
            'bsnn@my', 'bsnmyy', 'bsn-my', 'bsnmy1',
            'amb@nk', 'ambankk', 'am-bank', 'ambank1'
        ],
        
        // Scam keywords/phrases
        SCAM_KEYWORDS: [
            'verify account', 'verify your account', 'account verification',
            'suspended account', 'account suspended', 'account blocked',
            'urgent action', 'immediate action', 'act now', 'click here now',
            'free rm', 'free money', 'win rm', 'claim rm', 'get rm',
            'rm50', 'rm100', 'rm500', 'rm1000', 'free gift',
            'congratulations', 'you have won', 'winner', 'lucky winner',
            'limited time', 'expires today', 'expires soon', 'hurry up',
            'confirm identity', 'update details', 'verify details',
            'security alert', 'fraud alert', 'suspicious activity',
            'click to verify', 'tap to verify', 'verify now',
            'temporary suspension', 'account limitation', 'restore access'
        ],
        
        // URL structure patterns
        SUSPICIOUS_STRUCTURES: [
            /bit\.ly|tinyurl|short\.link|t\.co/i,
            /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/,
            /[a-z0-9\-]{20,}\.com/i,
            /[a-z]{2,}[0-9]{2,}[a-z]{2,}/i,
            /\-[a-z]{2,}\-/i
        ]
    }
};

// DOM Elements
const elements = {
    form: document.getElementById('scanForm'),
    urlInput: document.getElementById('urlInput'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    scanButton: document.getElementById('scanButton'),
    buttonText: document.querySelector('.button-text'),
    spinner: document.querySelector('.spinner-border'),
    loadingText: document.querySelector('.loading-text'),
    resultsSection: document.getElementById('resultsSection'),
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    riskDisplay: document.getElementById('riskDisplay'),
    riskIcon: document.getElementById('riskIcon'),
    riskLevel: document.getElementById('riskLevel'),
    riskExplanation: document.getElementById('riskExplanation'),
    riskSuggestions: document.getElementById('riskSuggestions'),
    patternScore: document.getElementById('patternScore'),
    detectedPatterns: document.getElementById('detectedPatterns'),
    aiRiskLevel: document.getElementById('aiRiskLevel'),
    aiExplanation: document.getElementById('aiExplanation'),
    scanHistory: document.getElementById('scanHistory')
};

/**
 * Initialize the application
 */
function init() {
    console.log('PaySavvy initialized');
    elements.form.addEventListener('submit', handleFormSubmit);
    
    // Load scan history
    loadScanHistory();
    
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const url = elements.urlInput.value.trim();
    if (!url) {
        showError('Please enter a URL to scan');
        return;
    }
    
    // Validate URL format
    if (!isValidUrl(url)) {
        showError('Please enter a valid URL (including http:// or https://)');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideError();
    hideResults();
    
    try {
        // Perform pattern-based analysis
        const patternAnalysis = analyzePatterns(url);
        
        // Perform AI analysis
        const aiAnalysis = await analyzeWithAI(url);
        
        // Combine results and display
        const finalResult = combineAnalysis(patternAnalysis, aiAnalysis);
        displayResults(finalResult, patternAnalysis, aiAnalysis);
        
        // Save scan result to database
        await saveScanToDatabase(url, patternAnalysis, aiAnalysis, finalResult);
        
        // Refresh scan history
        await loadScanHistory();
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'Failed to analyze the URL. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Pattern-based scam detection
 */
function analyzePatterns(url) {
    const analysis = {
        score: 0,
        detectedPatterns: [],
        riskLevel: 'Safe'
    };
    
    const urlLower = url.toLowerCase();
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const fullPath = urlObj.href;
    
    // Check suspicious TLDs
    for (const tld of CONFIG.SCAM_PATTERNS.SUSPICIOUS_TLDS) {
        if (domain.endsWith(tld)) {
            analysis.score += 2;
            analysis.detectedPatterns.push(`Suspicious TLD: ${tld}`);
        }
    }
    
    // Check typosquatting
    for (const typo of CONFIG.SCAM_PATTERNS.TYPOSQUATTING) {
        if (domain.includes(typo)) {
            analysis.score += 3;
            analysis.detectedPatterns.push(`Typosquatting detected: ${typo}`);
        }
    }
    
    // Check scam keywords
    for (const keyword of CONFIG.SCAM_PATTERNS.SCAM_KEYWORDS) {
        if (fullPath.includes(keyword.toLowerCase())) {
            analysis.score += 1;
            analysis.detectedPatterns.push(`Scam keyword: "${keyword}"`);
        }
    }
    
    // Check suspicious URL structures
    for (const pattern of CONFIG.SCAM_PATTERNS.SUSPICIOUS_STRUCTURES) {
        if (pattern.test(fullPath)) {
            analysis.score += 1;
            analysis.detectedPatterns.push(`Suspicious URL structure detected`);
        }
    }
    
    // Check for URL shorteners
    if (domain.length < 10 && !domain.includes('gov') && !domain.includes('edu')) {
        analysis.score += 1;
        analysis.detectedPatterns.push('Short domain (possible URL shortener)');
    }
    
    // Check for excessive subdomains
    const subdomains = domain.split('.').length - 2;
    if (subdomains > 2) {
        analysis.score += 1;
        analysis.detectedPatterns.push(`Excessive subdomains (${subdomains})`);
    }
    
    // Check for suspicious characters in domain
    if (/[0-9]/.test(domain) && domain.includes('-')) {
        analysis.score += 1;
        analysis.detectedPatterns.push('Domain contains suspicious character patterns');
    }
    
    // Determine risk level based on score
    if (analysis.score <= CONFIG.RISK_THRESHOLDS.SAFE) {
        analysis.riskLevel = 'Safe';
    } else if (analysis.score <= CONFIG.RISK_THRESHOLDS.SUSPICIOUS) {
        analysis.riskLevel = 'Suspicious';
    } else {
        analysis.riskLevel = 'Dangerous';
    }
    
    return analysis;
}

/**
 * AI-powered analysis using OpenAI GPT
 */
async function analyzeWithAI(url) {
    const apiKey = elements.apiKeyInput.value.trim() || 
                  import.meta.env.VITE_OPENAI_API_KEY || 
                  process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenAI API key is required. Please provide it in the configuration section or environment variables.');
    }
    
    const prompt = `Assess the following URL for fraud, phishing, or scams, especially focusing on Malaysian payment and banking scams. 

Analyze for:
1. Domain legitimacy and typosquatting
2. URL structure and suspicious patterns
3. Common phishing indicators
4. Malaysian banking/payment scam patterns

URL to analyze: ${url}

Respond with JSON in this exact format:
{
  "riskLevel": "Safe|Suspicious|Dangerous",
  "confidence": 0.95,
  "explanation": "Detailed explanation of findings",
  "recommendations": "Specific action recommendations"
}`;

    try {
        const response = await fetch(CONFIG.OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: CONFIG.OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a cybersecurity expert specializing in Malaysian payment and banking scams. Analyze URLs for fraud, phishing, and scam indicators. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 500,
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const aiResponse = JSON.parse(data.choices[0].message.content);
        
        return {
            riskLevel: aiResponse.riskLevel || 'Unknown',
            confidence: aiResponse.confidence || 0,
            explanation: aiResponse.explanation || 'No explanation provided',
            recommendations: aiResponse.recommendations || 'No recommendations provided'
        };
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        
        // Fallback analysis if AI fails
        return {
            riskLevel: 'Unknown',
            confidence: 0,
            explanation: `AI analysis failed: ${error.message}. Relying on pattern-based analysis only.`,
            recommendations: 'Verify the link manually and contact the organization directly.'
        };
    }
}

/**
 * Combine pattern and AI analysis results
 */
function combineAnalysis(patternAnalysis, aiAnalysis) {
    const riskLevels = ['Safe', 'Suspicious', 'Dangerous'];
    
    // Convert risk levels to numeric values for comparison
    const patternRiskValue = riskLevels.indexOf(patternAnalysis.riskLevel);
    const aiRiskValue = aiAnalysis.riskLevel !== 'Unknown' ? riskLevels.indexOf(aiAnalysis.riskLevel) : -1;
    
    // Use the higher risk level, or pattern analysis if AI failed
    let finalRiskValue;
    if (aiRiskValue === -1) {
        finalRiskValue = patternRiskValue;
    } else {
        finalRiskValue = Math.max(patternRiskValue, aiRiskValue);
    }
    
    const finalRiskLevel = riskLevels[finalRiskValue];
    
    // Generate combined explanation
    let explanation = '';
    if (patternAnalysis.detectedPatterns.length > 0) {
        explanation += `Pattern analysis detected ${patternAnalysis.detectedPatterns.length} risk indicators. `;
    }
    if (aiAnalysis.riskLevel !== 'Unknown') {
        explanation += `AI analysis confirms ${aiAnalysis.riskLevel.toLowerCase()} risk level. `;
    }
    explanation += aiAnalysis.explanation;
    
    // Generate suggestions based on risk level
    let suggestions = '';
    switch (finalRiskLevel) {
        case 'Safe':
            suggestions = '✅ This link appears to be safe, but always verify the sender and URL before proceeding.';
            break;
        case 'Suspicious':
            suggestions = '⚠️ Exercise caution. Verify the link with the official organization before clicking. Contact them directly using official channels.';
            break;
        case 'Dangerous':
            suggestions = '🚨 DO NOT CLICK this link. It shows multiple scam indicators. Report it as phishing and delete the message.';
            break;
    }
    
    if (aiAnalysis.recommendations && aiAnalysis.recommendations !== 'No recommendations provided') {
        suggestions += ` ${aiAnalysis.recommendations}`;
    }
    
    return {
        riskLevel: finalRiskLevel,
        explanation: explanation,
        suggestions: suggestions,
        confidence: aiAnalysis.confidence
    };
}

/**
 * Display analysis results
 */
function displayResults(finalResult, patternAnalysis, aiAnalysis) {
    // Show results section
    elements.resultsSection.classList.remove('d-none');
    
    // Update risk display
    updateRiskDisplay(finalResult.riskLevel, finalResult.explanation, finalResult.suggestions);
    
    // Update pattern analysis
    elements.patternScore.textContent = `${patternAnalysis.score}/10`;
    elements.patternScore.className = `badge ${getBadgeClass(patternAnalysis.riskLevel)}`;
    
    if (patternAnalysis.detectedPatterns.length > 0) {
        elements.detectedPatterns.innerHTML = patternAnalysis.detectedPatterns
            .map(pattern => `<div class="pattern-item">• ${pattern}</div>`)
            .join('');
    } else {
        elements.detectedPatterns.innerHTML = '<div class="text-success">No suspicious patterns detected</div>';
    }
    
    // Update AI analysis
    elements.aiRiskLevel.textContent = aiAnalysis.riskLevel;
    elements.aiRiskLevel.className = `badge ${getBadgeClass(aiAnalysis.riskLevel)}`;
    elements.aiExplanation.textContent = aiAnalysis.explanation;
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Update risk display section
 */
function updateRiskDisplay(riskLevel, explanation, suggestions) {
    elements.riskLevel.textContent = `Risk Level: ${riskLevel}`;
    elements.riskExplanation.textContent = explanation;
    elements.riskSuggestions.textContent = suggestions;
    
    // Update alert styling
    elements.riskDisplay.className = `alert ${getAlertClass(riskLevel)}`;
    
    // Update icon
    const iconName = getIconName(riskLevel);
    elements.riskIcon.setAttribute('data-feather', iconName);
    
    // Re-initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

/**
 * Get appropriate CSS class for risk level
 */
function getAlertClass(riskLevel) {
    switch (riskLevel) {
        case 'Safe': return 'alert-success';
        case 'Suspicious': return 'alert-warning';
        case 'Dangerous': return 'alert-danger';
        default: return 'alert-secondary';
    }
}

/**
 * Get appropriate badge class for risk level
 */
function getBadgeClass(riskLevel) {
    switch (riskLevel) {
        case 'Safe': return 'bg-success';
        case 'Suspicious': return 'bg-warning';
        case 'Dangerous': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

/**
 * Get appropriate icon for risk level
 */
function getIconName(riskLevel) {
    switch (riskLevel) {
        case 'Safe': return 'check-circle';
        case 'Suspicious': return 'alert-triangle';
        case 'Dangerous': return 'x-circle';
        default: return 'help-circle';
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.scanButton.disabled = true;
        elements.buttonText.classList.add('d-none');
        elements.spinner.classList.remove('d-none');
        elements.loadingText.classList.remove('d-none');
    } else {
        elements.scanButton.disabled = false;
        elements.buttonText.classList.remove('d-none');
        elements.spinner.classList.add('d-none');
        elements.loadingText.classList.add('d-none');
    }
}

/**
 * Show error message
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorSection.classList.remove('d-none');
    elements.errorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Hide error message
 */
function hideError() {
    elements.errorSection.classList.add('d-none');
}

/**
 * Hide results section
 */
function hideResults() {
    elements.resultsSection.classList.add('d-none');
}

/**
 * Utility function to get environment variables in different contexts
 */
function getEnvVar(name, defaultValue = '') {
    // Try Vite environment variables
    try {
        if (import.meta && import.meta.env) {
            return import.meta.env[`VITE_${name}`] || defaultValue;
        }
    } catch (e) {
        // import.meta not available in this context
    }
    
    // Try Node.js environment variables
    if (typeof process !== 'undefined' && process.env) {
        return process.env[name] || defaultValue;
    }
    
    return defaultValue;
}

/**
 * Save scan result to database
 */
async function saveScanToDatabase(url, patternAnalysis, aiAnalysis, finalResult) {
    try {
        if (window.database) {
            const urlObj = new URL(url);
            
            await window.database.saveScanResult({
                url: url,
                domain: urlObj.hostname,
                patternScore: patternAnalysis.score,
                patternRiskLevel: patternAnalysis.riskLevel,
                detectedPatterns: patternAnalysis.detectedPatterns,
                aiRiskLevel: aiAnalysis.riskLevel,
                aiConfidence: Math.round((aiAnalysis.confidence || 0) * 100),
                aiExplanation: aiAnalysis.explanation,
                finalRiskLevel: finalResult.riskLevel
            });
            
            // Track analytics event
            await window.database.trackEvent('scan', {
                riskLevel: finalResult.riskLevel,
                domain: urlObj.hostname,
                patternScore: patternAnalysis.score,
                hasAiAnalysis: aiAnalysis.riskLevel !== 'Unknown'
            });
        }
    } catch (error) {
        console.error('Failed to save scan to database:', error);
        // Continue without blocking user experience
    }
}

/**
 * Load and display scan history
 */
async function loadScanHistory() {
    try {
        if (window.database) {
            const history = await window.database.getScanHistory(5);
            displayScanHistory(history);
        }
    } catch (error) {
        console.error('Failed to load scan history:', error);
    }
}

/**
 * Display scan history in the UI
 */
function displayScanHistory(history) {
    if (!elements.scanHistory || !history || history.length === 0) {
        if (elements.scanHistory) {
            elements.scanHistory.innerHTML = `
                <div class="text-center text-muted">
                    <p>No previous scans found</p>
                </div>
            `;
        }
        return;
    }

    const historyHtml = history.map(scan => {
        const riskClass = scan.finalRiskLevel.toLowerCase();
        const timeAgo = formatTimeAgo(new Date(scan.scannedAt));
        const shortUrl = scan.url.length > 50 ? scan.url.substring(0, 50) + '...' : scan.url;
        
        return `
            <div class="history-item ${riskClass}">
                <div class="history-url">${escapeHtml(shortUrl)}</div>
                <div class="history-risk">
                    <span class="badge ${getBadgeClass(scan.finalRiskLevel)}">${scan.finalRiskLevel}</span>
                    <span class="ms-2">Score: ${scan.patternScore}/10</span>
                </div>
                <div class="history-time">${timeAgo}</div>
            </div>
        `;
    }).join('');

    elements.scanHistory.innerHTML = historyHtml;
}

/**
 * Format time ago string
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzePatterns,
        isValidUrl,
        combineAnalysis
    };
}
