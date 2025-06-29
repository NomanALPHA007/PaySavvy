// PaySavvy Pro - Centralized Risk Scoring Engine
// Integrates all 4 detection layers with verified brands dataset

export function getAllDomains(verifiedData) {
    const whitelist = [];
    const blacklist = [];
    const countryCodes = [];
    const brandMap = new Map();

    // Skip metadata section
    for (const region in verifiedData) {
        if (region === 'metadata') continue;
        
        for (const brandName in verifiedData[region]) {
            const brand = verifiedData[region][brandName];
            
            // Add verified domains to whitelist
            if (brand.domains) {
                brand.domains.forEach(domain => {
                    whitelist.push(domain.toLowerCase());
                    brandMap.set(domain.toLowerCase(), { name: brandName, ...brand, region });
                });
            }
            
            // Add scam mimics to blacklist
            if (brand.commonScamMimics) {
                blacklist.push(...brand.commonScamMimics.map(d => d.toLowerCase()));
            }
            
            // Collect country codes
            if (brand.countryCode && !countryCodes.includes(brand.countryCode)) {
                countryCodes.push(brand.countryCode);
            }
        }
    }

    return { whitelist, blacklist, countryCodes, brandMap };
}

export function assessRisk(inputURL, verifiedBrands, redirectChain = [], aiAssessment = null) {
    let score = 0;
    let labels = [];
    let result = {
        trustLevel: "Unknown",
        reason: [],
        brand: null,
        score: 0,
        confidence: 0.7,
        layerResults: {
            heuristics: { score: 0, flags: [] },
            brandCheck: { score: 0, flags: [] },
            redirects: { score: 0, flags: [] },
            aiAnalysis: { score: 0, flags: [] }
        }
    };

    try {
        const urlObj = new URL(inputURL);
        const domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
        const tld = domain.split('.').pop();
        const { whitelist, blacklist, countryCodes, brandMap } = getAllDomains(verifiedBrands);

        // Layer 1: Heuristic Analysis (TLDs, patterns, keywords)
        const layer1 = analyzeHeuristics(inputURL, domain, tld);
        result.layerResults.heuristics = layer1;
        score += layer1.score;
        labels.push(...layer1.flags);

        // Layer 2: Brand Verification
        const layer2 = analyzeBrandMatch(domain, whitelist, blacklist, brandMap, verifiedBrands);
        result.layerResults.brandCheck = layer2;
        score += layer2.score;
        labels.push(...layer2.flags);
        if (layer2.brand) result.brand = layer2.brand;

        // Layer 3: Redirect Chain Validation
        const layer3 = analyzeRedirects(redirectChain, whitelist);
        result.layerResults.redirects = layer3;
        score += layer3.score;
        labels.push(...layer3.flags);

        // Layer 4: AI Assessment Integration
        const layer4 = analyzeAIAssessment(aiAssessment);
        result.layerResults.aiAnalysis = layer4;
        score += layer4.score;
        labels.push(...layer4.flags);

        // Calculate final trust level and confidence
        result.score = score;
        result.reason = labels.filter(label => label); // Remove empty labels

        // Enhanced confidence calculation based on multiple factors
        let confidence = 0.7;
        if (result.brand) confidence = 0.95; // Verified brand
        else if (aiAssessment && aiAssessment.confidence) confidence = aiAssessment.confidence;
        else if (labels.length >= 3) confidence = 0.85; // Multiple detection factors
        result.confidence = confidence;

        // Final classification with verified brand override
        if (result.brand && score <= 0) {
            result.trustLevel = "Safe";
        } else if (score >= 7) {
            result.trustLevel = "Dangerous";
        } else if (score >= 3) {
            result.trustLevel = "Suspicious";
        } else if (score <= -3) {
            result.trustLevel = "Safe";
        } else {
            result.trustLevel = "Unknown";
        }

        return result;

    } catch (e) {
        return {
            trustLevel: "Error",
            reason: ["URL parsing failed: " + e.message],
            score: 0,
            confidence: 0.1,
            layerResults: {}
        };
    }
}

function analyzeHeuristics(url, domain, tld) {
    let score = 0;
    const flags = [];
    const urlLower = url.toLowerCase();

    // Suspicious TLD detection
    const riskyTLDs = ['tk', 'ml', 'ga', 'cf', 'pw', 'top'];
    if (riskyTLDs.includes(tld)) {
        score += 3;
        flags.push(`High-risk TLD detected: .${tld}`);
    }

    // Scam keyword detection
    const scamKeywords = ['urgent', 'verify', 'suspend', 'expire', 'claim', 'winner', 'prize'];
    scamKeywords.forEach(keyword => {
        if (urlLower.includes(keyword)) {
            score += 2;
            flags.push(`Scam keyword detected: ${keyword}`);
        }
    });

    // Malaysian-specific scam patterns
    const malaysianPatterns = ['bank negara', 'lhdn', 'kwsp', 'pdrm'];
    malaysianPatterns.forEach(pattern => {
        if (urlLower.includes(pattern.replace(' ', ''))) {
            score += 3;
            flags.push(`Malaysian scam pattern: ${pattern}`);
        }
    });

    // URL structure analysis
    if (url.length > 100) {
        score += 1;
        flags.push('Extremely long URL');
    }

    if ((domain.match(/-/g) || []).length > 3) {
        score += 2;
        flags.push('Multiple hyphens in domain');
    }

    // IP address instead of domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        score += 4;
        flags.push('IP address instead of domain name');
    }

    // URL shortener detection
    const shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'buff.ly'];
    if (shorteners.some(shortener => urlLower.includes(shortener))) {
        score += 2;
        flags.push('URL shortener detected');
    }

    return { score, flags };
}

function analyzeBrandMatch(domain, whitelist, blacklist, brandMap, verifiedBrands) {
    let score = 0;
    const flags = [];
    let brand = null;

    // Check for exact verified domain match
    if (brandMap.has(domain)) {
        brand = brandMap.get(domain);
        score = -5; // Strong positive score for verified brands
        flags.push(`✓ Verified ${brand.region} financial institution: ${brand.name}`);
        return { score, flags, brand };
    }

    // Check for subdomain matches (e.g., secure.paypal.com)
    for (const [verifiedDomain, brandData] of brandMap.entries()) {
        if (domain.endsWith(verifiedDomain) && domain !== verifiedDomain) {
            brand = brandData;
            score = -3; // Positive score for subdomain of verified brand
            flags.push(`✓ Subdomain of verified brand: ${brand.name}`);
            return { score, flags, brand };
        }
    }

    // Check for known scam mimics
    if (blacklist.includes(domain)) {
        score = 6;
        flags.push('⚠️ Known scam domain detected');
        return { score, flags, brand };
    }

    // Check for brand impersonation patterns
    for (const region in verifiedBrands) {
        if (region === 'metadata') continue;
        
        for (const brandName in verifiedBrands[region]) {
            const brandData = verifiedBrands[region][brandName];
            
            // Check if domain closely mimics a verified brand
            if (brandData.domains) {
                for (const verifiedDomain of brandData.domains) {
                    const cleanVerified = verifiedDomain.toLowerCase().replace(/^www\./, '');
                    const similarity = calculateSimilarity(domain, cleanVerified);
                    
                    if (similarity > 0.7 && similarity < 1.0) {
                        score = 5;
                        flags.push(`⚠️ Possible brand impersonation: ${brandName}`);
                        return { score, flags, brand };
                    }
                }
            }
        }
    }

    return { score, flags, brand };
}

function analyzeRedirects(redirectChain, whitelist) {
    let score = 0;
    const flags = [];

    if (redirectChain.length === 0) {
        return { score, flags };
    }

    // Multiple redirects increase suspicion
    if (redirectChain.length > 2) {
        score += 2;
        flags.push(`Multiple redirects detected (${redirectChain.length})`);
    }

    // Check if final destination is trusted
    try {
        const finalUrl = redirectChain[redirectChain.length - 1];
        const finalDomain = new URL(finalUrl).hostname.toLowerCase().replace(/^www\./, '');
        
        if (!whitelist.includes(finalDomain)) {
            score += 3;
            flags.push('Redirect to untrusted destination');
        } else {
            score -= 1;
            flags.push('Redirect to verified destination');
        }
    } catch (e) {
        score += 2;
        flags.push('Invalid redirect destination');
    }

    return { score, flags };
}

function analyzeAIAssessment(aiAssessment) {
    let score = 0;
    const flags = [];

    if (!aiAssessment || !aiAssessment.risk) {
        return { score, flags };
    }

    switch (aiAssessment.risk.toLowerCase()) {
        case 'dangerous':
            score = 4;
            flags.push(`AI flagged as dangerous: ${aiAssessment.reason || 'High risk detected'}`);
            break;
        case 'suspicious':
            score = 2;
            flags.push(`AI suggests caution: ${aiAssessment.reason || 'Potential risk'}`);
            break;
        case 'safe':
            score = -1;
            flags.push('AI assessment: Safe');
            break;
        default:
            flags.push('AI analysis: Inconclusive');
    }

    if (aiAssessment.impersonatedBrand) {
        score += 2;
        flags.push(`AI detected brand impersonation: ${aiAssessment.impersonatedBrand}`);
    }

    return { score, flags };
}

function calculateSimilarity(str1, str2) {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}