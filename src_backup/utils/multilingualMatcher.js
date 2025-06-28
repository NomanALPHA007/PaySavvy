// ASEAN Multilingual Keyword Matcher
import keywordMap from '../data/keywordMap.json';

export class MultilingualMatcher {
  constructor() {
    this.keywordData = keywordMap;
    this.userLanguage = this.detectUserLanguage();
    this.loadLanguagePreferences();
  }

  detectUserLanguage() {
    // Check user preferences first
    const saved = localStorage.getItem('paysavvy_language');
    if (saved) return saved;

    // Detect from browser
    const browserLang = navigator.language.toLowerCase();
    
    if (browserLang.startsWith('ms') || browserLang.startsWith('my')) return 'bm';
    if (browserLang.startsWith('id')) return 'id';
    if (browserLang.startsWith('tl') || browserLang.startsWith('fil')) return 'ph';
    if (browserLang.startsWith('th')) return 'th';
    if (browserLang.startsWith('vi')) return 'vi';
    
    return 'en'; // Default to English
  }

  setUserLanguage(lang) {
    this.userLanguage = lang;
    localStorage.setItem('paysavvy_language', lang);
  }

  loadLanguagePreferences() {
    const preferences = localStorage.getItem('paysavvy_lang_preferences');
    if (preferences) {
      this.langPreferences = JSON.parse(preferences);
    } else {
      this.langPreferences = {
        primary: this.userLanguage,
        secondary: ['en'], // Always include English as fallback
        enabledLanguages: [this.userLanguage, 'en']
      };
    }
  }

  saveLanguagePreferences() {
    localStorage.setItem('paysavvy_lang_preferences', JSON.stringify(this.langPreferences));
  }

  analyzeText(text, options = {}) {
    const {
      languages = this.langPreferences.enabledLanguages,
      caseSensitive = false,
      includePartialMatches = true
    } = options;

    const results = {
      detectedLanguages: [],
      flaggedKeywords: [],
      riskScore: 0,
      categories: new Set(),
      suspiciousPhrases: []
    };

    const processedText = caseSensitive ? text : text.toLowerCase();

    // Analyze each enabled language
    languages.forEach(lang => {
      if (!this.keywordData.languages[lang]) return;

      const langData = this.keywordData.languages[lang];
      const langResults = this.analyzeLanguage(processedText, lang, langData, includePartialMatches);

      if (langResults.matches.length > 0) {
        results.detectedLanguages.push({
          language: lang,
          name: langData.name,
          confidence: langResults.confidence,
          matches: langResults.matches
        });

        results.flaggedKeywords.push(...langResults.matches);
        results.riskScore += langResults.riskScore;
        langResults.categories.forEach(cat => results.categories.add(cat));
      }
    });

    // Check for common scam phrases
    this.checkScamPhrases(processedText, results);

    // Calculate final risk level
    results.riskLevel = this.calculateRiskLevel(results.riskScore, results.categories.size);
    results.categories = Array.from(results.categories);

    return results;
  }

  analyzeLanguage(text, langCode, langData, includePartialMatches) {
    const matches = [];
    const categories = new Set();
    let riskScore = 0;
    let totalWords = 0;

    // Define category weights
    const categoryWeights = {
      urgencyWords: 3,
      accountWords: 4,
      actionWords: 2,
      moneyWords: 2,
      verificationWords: 3,
      prizeWords: 2,
      bankWords: 1,
      ewalletWords: 1
    };

    // Check each category
    Object.entries(langData).forEach(([category, keywords]) => {
      if (!Array.isArray(keywords)) return;

      keywords.forEach(keyword => {
        const weight = categoryWeights[category] || 1;
        let found = false;

        if (includePartialMatches) {
          // Check for partial matches and word boundaries
          const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const matches_found = text.match(regex);
          if (matches_found) {
            found = true;
            totalWords += matches_found.length;
          }
        } else {
          // Exact match only
          if (text.includes(keyword)) {
            found = true;
            totalWords++;
          }
        }

        if (found) {
          matches.push({
            keyword: keyword,
            category: category,
            weight: weight,
            language: langCode
          });
          categories.add(category);
          riskScore += weight;
        }
      });
    });

    // Calculate confidence based on matches and text length
    const confidence = Math.min(0.95, (totalWords * 0.1) + (categories.size * 0.15));

    return {
      matches,
      categories,
      riskScore,
      confidence,
      totalWords
    };
  }

  checkScamPhrases(text, results) {
    Object.entries(this.keywordData.commonScamPhrases).forEach(([lang, phrases]) => {
      phrases.forEach(phrase => {
        if (text.includes(phrase.toLowerCase())) {
          results.suspiciousPhrases.push({
            phrase: phrase,
            language: lang,
            riskLevel: 'high'
          });
          results.riskScore += 5; // High penalty for complete scam phrases
        }
      });
    });
  }

  calculateRiskLevel(score, categoryCount) {
    // Adjust score based on category diversity
    const adjustedScore = score + (categoryCount * 0.5);

    if (adjustedScore >= 8) return 'dangerous';
    if (adjustedScore >= 5) return 'suspicious'; 
    if (adjustedScore >= 2) return 'moderate';
    return 'safe';
  }

  getLanguageStats() {
    const stats = {};
    
    Object.entries(this.keywordData.languages).forEach(([lang, data]) => {
      let totalKeywords = 0;
      Object.values(data).forEach(category => {
        if (Array.isArray(category)) {
          totalKeywords += category.length;
        }
      });
      
      stats[lang] = {
        name: data.name,
        totalKeywords: totalKeywords,
        categories: Object.keys(data).filter(key => Array.isArray(data[key])).length
      };
    });

    return stats;
  }

  updateUserRegion(region) {
    // Adjust language preferences based on region
    const regionLanguages = {
      'Malaysia': ['bm', 'en'],
      'Singapore': ['en', 'bm'],
      'Indonesia': ['id', 'en'],
      'Philippines': ['ph', 'en'],
      'Thailand': ['th', 'en'],
      'Vietnam': ['vi', 'en'],
      'Cambodia': ['en'],
      'Laos': ['en'],
      'Myanmar': ['en'],
      'Brunei': ['bm', 'en']
    };

    if (regionLanguages[region]) {
      this.langPreferences.enabledLanguages = [...new Set([
        ...regionLanguages[region],
        this.langPreferences.primary
      ])];
      this.saveLanguagePreferences();
    }
  }

  generateLanguageReport(analysisResult) {
    if (!analysisResult.detectedLanguages.length) {
      return {
        summary: 'No suspicious multilingual patterns detected',
        details: [],
        recommendations: []
      };
    }

    const report = {
      summary: '',
      details: [],
      recommendations: []
    };

    // Generate summary
    const primaryLang = analysisResult.detectedLanguages[0];
    const flaggedCount = analysisResult.flaggedKeywords.length;
    
    report.summary = `Detected ${flaggedCount} suspicious keywords in ${analysisResult.detectedLanguages.length} language(s). Primary language: ${primaryLang.name}`;

    // Generate details
    analysisResult.detectedLanguages.forEach(lang => {
      const categoryGroups = {};
      lang.matches.forEach(match => {
        if (!categoryGroups[match.category]) {
          categoryGroups[match.category] = [];
        }
        categoryGroups[match.category].push(match.keyword);
      });

      Object.entries(categoryGroups).forEach(([category, keywords]) => {
        report.details.push({
          language: lang.name,
          category: category,
          keywords: keywords,
          count: keywords.length
        });
      });
    });

    // Generate recommendations
    if (analysisResult.riskLevel === 'dangerous') {
      report.recommendations.push('Do not click this link - multiple high-risk patterns detected');
      report.recommendations.push('Report this message to authorities');
    } else if (analysisResult.riskLevel === 'suspicious') {
      report.recommendations.push('Exercise extreme caution with this link');
      report.recommendations.push('Verify the sender through official channels');
    }

    if (analysisResult.suspiciousPhrases.length > 0) {
      report.recommendations.push('Contains known scam phrases - likely fraudulent');
    }

    return report;
  }
}