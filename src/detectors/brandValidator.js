// PaySavvy Pro - Brand Validation Engine
// Enhanced brand verification with comprehensive ASEAN + International coverage

export class BrandValidator {
    constructor(verifiedBrands) {
        this.verifiedBrands = verifiedBrands;
        this.domainCache = this.buildDomainCache();
    }

    buildDomainCache() {
        const cache = {
            verified: new Map(),
            scamMimics: new Map(),
            regions: new Set(),
            brandsByRegion: new Map()
        };

        for (const region in this.verifiedBrands) {
            if (region === 'metadata') continue;
            
            cache.regions.add(region);
            cache.brandsByRegion.set(region, []);

            for (const brandName in this.verifiedBrands[region]) {
                const brand = this.verifiedBrands[region][brandName];
                const brandData = { 
                    name: brandName, 
                    region, 
                    ...brand 
                };

                cache.brandsByRegion.get(region).push(brandData);

                // Cache verified domains
                if (brand.domains) {
                    brand.domains.forEach(domain => {
                        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
                        cache.verified.set(cleanDomain, brandData);
                    });
                }

                // Cache scam mimic patterns
                if (brand.commonScamMimics) {
                    brand.commonScamMimics.forEach(scamDomain => {
                        const cleanScam = scamDomain.toLowerCase().replace(/^www\./, '');
                        cache.scamMimics.set(cleanScam, {
                            targetBrand: brandName,
                            region,
                            legitimateDomains: brand.domains
                        });
                    });
                }
            }
        }

        return cache;
    }

    getAllDomains() {
        const whitelist = Array.from(this.domainCache.verified.keys());
        const blacklist = Array.from(this.domainCache.scamMimics.keys());
        const countryCodes = [];

        // Extract unique country codes
        for (const brandData of this.domainCache.verified.values()) {
            if (brandData.countryCode && !countryCodes.includes(brandData.countryCode)) {
                countryCodes.push(brandData.countryCode);
            }
        }

        return { whitelist, blacklist, countryCodes };
    }

    validateDomain(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
            
            // Check for exact verified domain match
            if (this.domainCache.verified.has(domain)) {
                const brand = this.domainCache.verified.get(domain);
                return {
                    isVerified: true,
                    isScam: false,
                    brand: brand,
                    confidence: 0.95,
                    matchType: 'exact_domain'
                };
            }

            // Check for subdomain of verified brand
            for (const [verifiedDomain, brandData] of this.domainCache.verified.entries()) {
                if (domain.endsWith('.' + verifiedDomain)) {
                    return {
                        isVerified: true,
                        isScam: false,
                        brand: brandData,
                        confidence: 0.85,
                        matchType: 'subdomain'
                    };
                }
            }

            // Check for known scam mimics
            if (this.domainCache.scamMimics.has(domain)) {
                const scamInfo = this.domainCache.scamMimics.get(domain);
                return {
                    isVerified: false,
                    isScam: true,
                    scamInfo: scamInfo,
                    confidence: 0.90,
                    matchType: 'known_scam'
                };
            }

            // Check for potential brand impersonation using similarity
            const suspiciousMatch = this.detectBrandImpersonation(domain);
            if (suspiciousMatch) {
                return {
                    isVerified: false,
                    isScam: true,
                    scamInfo: suspiciousMatch,
                    confidence: suspiciousMatch.confidence,
                    matchType: 'impersonation'
                };
            }

            return {
                isVerified: false,
                isScam: false,
                brand: null,
                confidence: 0.6,
                matchType: 'unknown'
            };

        } catch (error) {
            return {
                isVerified: false,
                isScam: false,
                error: error.message,
                confidence: 0.1,
                matchType: 'error'
            };
        }
    }

    detectBrandImpersonation(domain) {
        for (const [verifiedDomain, brandData] of this.domainCache.verified.entries()) {
            const similarity = this.calculateSimilarity(domain, verifiedDomain);
            
            // High similarity but not exact match suggests impersonation
            if (similarity > 0.7 && similarity < 1.0) {
                return {
                    targetBrand: brandData.name,
                    region: brandData.region,
                    legitimateDomains: brandData.domains,
                    suspiciousDomain: domain,
                    similarity: similarity,
                    confidence: Math.min(0.9, similarity + 0.1)
                };
            }

            // Check for character substitution patterns
            if (this.hasCharacterSubstitution(domain, verifiedDomain)) {
                return {
                    targetBrand: brandData.name,
                    region: brandData.region,
                    legitimateDomains: brandData.domains,
                    suspiciousDomain: domain,
                    pattern: 'character_substitution',
                    confidence: 0.8
                };
            }
        }

        return null;
    }

    hasCharacterSubstitution(suspicious, legitimate) {
        // Common character substitutions in scam domains
        const substitutions = {
            'a': ['@', '4'],
            'e': ['3'],
            'i': ['1', '!'],
            'o': ['0'],
            's': ['$', '5'],
            'l': ['1', 'I'],
            'm': ['rn'], // m can be mimicked by 'rn'
            'w': ['vv']
        };

        let transformedLegit = legitimate;
        for (const [original, replacements] of Object.entries(substitutions)) {
            for (const replacement of replacements) {
                transformedLegit = transformedLegit.replace(new RegExp(replacement, 'g'), original);
            }
        }

        return transformedLegit === suspicious;
    }

    calculateSimilarity(str1, str2) {
        // Optimized Levenshtein distance for domain comparison
        if (str1 === str2) return 1.0;
        
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j - 1][i] + 1,     // deletion
                    matrix[j][i - 1] + 1,     // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    getBrandsByRegion(region) {
        return this.domainCache.brandsByRegion.get(region) || [];
    }

    getAllRegions() {
        return Array.from(this.domainCache.regions);
    }

    getVerifiedBrandsForAI(limit = 20) {
        // Get a representative sample of verified domains for AI context
        const domains = Array.from(this.domainCache.verified.keys());
        return domains.slice(0, limit);
    }

    getStatistics() {
        return {
            totalVerifiedBrands: this.domainCache.verified.size,
            totalScamPatterns: this.domainCache.scamMimics.size,
            totalRegions: this.domainCache.regions.size,
            regionBreakdown: Object.fromEntries(
                Array.from(this.domainCache.brandsByRegion.entries())
                    .map(([region, brands]) => [region, brands.length])
            )
        };
    }
}