// Enhanced AI-powered scam detection using OpenAI GPT-4o
export class GPTScanner {
  constructor() {
    // Support both environment configurations
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.cache = new Map();
  }

  async analyzeURL(url, context = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(url, context);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = this.buildAnalysisPrompt(url, context);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 800,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${errorData.error?.message || ''}`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.choices[0].message.content);

      // Validate and enhance AI response
      const processedResult = this.processAIResponse(aiResult, url, context);
      
      // Cache the result
      this.cache.set(cacheKey, processedResult);
      
      return processedResult;

    } catch (error) {
      console.error('GPT analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  getSystemPrompt() {
    return `You are a cybersecurity expert specializing in scam detection for Malaysian and ASEAN users. Your expertise includes:

1. Malaysian banking systems (Maybank, CIMB, Public Bank, RHB, Hong Leong, AmBank, UOB)
2. Popular e-wallets (Grab, Boost, Touch'n Go, BigPay, ShopeePay)
3. Regional scam patterns and social engineering tactics
4. Multilingual scam detection (Bahasa Malaysia, English, Indonesian, Thai, Filipino)
5. Cryptocurrency and investment scams targeting ASEAN region
6. URL analysis, domain reputation, and redirect patterns

Analyze URLs with focus on:
- Domain legitimacy and typosquatting
- Suspicious TLDs (.tk, .ml, .ga, .cf, etc.)
- Social engineering indicators
- Regional targeting patterns
- Mobile payment scam indicators

Always respond in JSON format only.`;
  }

  buildAnalysisPrompt(url, context) {
    const {
      userRegion = 'Malaysia',
      userLanguage = 'en',
      preferredBanks = [],
      redirectChain = null,
      fingerprintMatch = null,
      multilingualFlags = null,
      qrSource = false
    } = context;

    let prompt = `Analyze this URL for scam indicators targeting users in ${userRegion}:

URL: ${url}

Context:
- User Region: ${userRegion}
- User Language: ${userLanguage}
- Preferred Banks: ${preferredBanks.join(', ') || 'None specified'}`;

    if (qrSource) {
      prompt += `\n- Source: QR Code scan (higher risk)`;
    }

    if (redirectChain && redirectChain.chain.length > 1) {
      prompt += `\n- Redirect Chain: ${redirectChain.chain.map(step => step.url).join(' → ')}`;
      prompt += `\n- Redirect Analysis: ${redirectChain.analysis.riskLevel} risk, ${redirectChain.totalRedirects} redirects`;
    }

    if (fingerprintMatch && fingerprintMatch.found) {
      prompt += `\n- Fingerprint Match: Seen ${fingerprintMatch.count} times, ${fingerprintMatch.daysSinceFirst} days ago`;
    }

    if (multilingualFlags && multilingualFlags.flaggedKeywords.length > 0) {
      prompt += `\n- Multilingual Flags: ${multilingualFlags.flaggedKeywords.length} suspicious keywords detected`;
      prompt += `\n- Languages: ${multilingualFlags.detectedLanguages.map(l => l.name).join(', ')}`;
    }

    prompt += `

Provide comprehensive analysis in JSON format:
{
  "riskLevel": "safe|suspicious|dangerous",
  "confidence": 0.0-1.0,
  "explanation": "Clear explanation for ${userRegion} users",
  "threats": {
    "typosquatting": boolean,
    "socialEngineering": boolean,
    "maliciousDomain": boolean,
    "phishing": boolean,
    "investment_scam": boolean,
    "fake_payment": boolean
  },
  "regionalAnalysis": {
    "targetingASEAN": boolean,
    "localBankMimicry": boolean,
    "culturalEngineering": boolean,
    "languageSpecificTactics": []
  },
  "technicalIndicators": {
    "suspiciousTLD": boolean,
    "newDomain": boolean,
    "encryptionIssues": boolean,
    "redirectConcerns": boolean
  },
  "recommendations": ["specific actionable advice"],
  "severity": 1-10,
  "reportToAuthorities": boolean
}`;

    return prompt;
  }

  processAIResponse(aiResult, url, context) {
    // Validate and sanitize AI response
    const processed = {
      riskLevel: this.validateRiskLevel(aiResult.riskLevel),
      confidence: Math.max(0, Math.min(1, aiResult.confidence || 0.5)),
      explanation: aiResult.explanation || 'AI analysis completed',
      threats: aiResult.threats || {},
      regionalAnalysis: aiResult.regionalAnalysis || {},
      technicalIndicators: aiResult.technicalIndicators || {},
      recommendations: Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [],
      severity: Math.max(1, Math.min(10, aiResult.severity || 5)),
      reportToAuthorities: Boolean(aiResult.reportToAuthorities),
      source: 'ai_analysis',
      timestamp: Date.now(),
      url: url,
      context: context
    };

    // Enhance with additional analysis
    processed.enhancedAnalysis = this.generateEnhancedAnalysis(processed, context);

    return processed;
  }

  generateEnhancedAnalysis(result, context) {
    const enhanced = {
      riskFactors: [],
      protectionTips: [],
      similarScams: [],
      verificationSteps: []
    };

    // Generate risk factors
    if (result.threats.typosquatting) {
      enhanced.riskFactors.push('Domain name mimics legitimate banking sites');
    }
    if (result.threats.socialEngineering) {
      enhanced.riskFactors.push('Uses psychological manipulation tactics');
    }
    if (result.regionalAnalysis.targetingASEAN) {
      enhanced.riskFactors.push('Specifically targets ASEAN region users');
    }

    // Generate protection tips based on context
    if (context.userRegion === 'Malaysia') {
      enhanced.protectionTips.push('Verify with Bank Negara Malaysia if suspicious');
      enhanced.protectionTips.push('Use official banking apps only');
    }

    if (context.qrSource) {
      enhanced.protectionTips.push('QR codes can hide malicious URLs - always scan before payment');
    }

    // Generate verification steps
    enhanced.verificationSteps = [
      'Check the domain spelling carefully',
      'Look for HTTPS encryption',
      'Verify through official channels',
      'Never enter banking credentials on suspicious sites'
    ];

    return enhanced;
  }

  validateRiskLevel(level) {
    const validLevels = ['safe', 'suspicious', 'dangerous'];
    return validLevels.includes(level) ? level : 'suspicious';
  }

  generateCacheKey(url, context) {
    const contextKey = JSON.stringify({
      region: context.userRegion,
      banks: context.preferredBanks?.sort(),
      hasRedirect: !!context.redirectChain,
      hasFingerprint: !!context.fingerprintMatch,
      qrSource: context.qrSource
    });
    return `${url}:${contextKey}`;
  }

  async analyzeBatch(urls, context = {}) {
    const results = [];
    const batchSize = 5; // Process in batches to avoid rate limiting

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.analyzeURL(url, context).catch(error => ({
          url,
          error: error.message,
          riskLevel: 'unknown'
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async getScamTrends() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Based on current cybersecurity intelligence, what are the top 5 scam trends targeting Malaysian and ASEAN users in 2025? Focus on:

1. Digital payment scams
2. Banking phishing
3. Investment fraud
4. E-wallet exploitation
5. QR code scams

Respond in JSON format:
{
  "trends": [
    {
      "name": "trend name",
      "description": "detailed description",
      "targetRegions": ["countries"],
      "commonTactics": ["tactic1", "tactic2"],
      "riskLevel": "high|medium|low",
      "preventionTips": ["tip1", "tip2"]
    }
  ],
  "emergingThreats": ["threat1", "threat2"],
  "protectionStrategies": ["strategy1", "strategy2"]
}`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a cybersecurity threat intelligence analyst specializing in ASEAN region scams.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Trends analysis failed: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (error) {
      console.error('Trends analysis failed:', error);
      return {
        trends: [],
        emergingThreats: ['Unable to fetch current trends'],
        protectionStrategies: ['Stay updated with official security advisories']
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 100 // Implement cache size limit if needed
    };
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async testConnection() {
    if (!this.apiKey) return false;

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}