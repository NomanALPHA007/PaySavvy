// Regex-based scam detection rules for Malaysian context
export class RegexRules {
  constructor() {
    this.rules = [
      {
        name: "Suspicious TLD",
        regex: /\.(tk|ml|ga|cf|ru|click|download|bid|win|top|xyz|info|biz)$/i,
        weight: 3,
        description: "Uses suspicious top-level domain"
      },
      {
        name: "Bank Typosquatting",
        regex: /(mayb[a4@]nk|m[a@]yb[a@]nk|c[i1]mb|c[i1]mb[a@]|publ[i1]c|rhb[a@]|hon[g9]le[o0]n[g9]|[a@]mb[a@]nk|u[o0]b)/i,
        weight: 4,
        description: "Mimics Malaysian bank names with character substitution"
      },
      {
        name: "Payment Keywords",
        regex: /(pay|payment|transfer|banking|login|secure|verify|update|confirm)/i,
        weight: 1,
        description: "Contains payment-related keywords"
      },
      {
        name: "Urgency Words",
        regex: /(urgent|immediately|expire|suspended|blocked|limited|verify|update|confirm)/i,
        weight: 2,
        description: "Uses urgency tactics"
      },
      {
        name: "IP Address",
        regex: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
        weight: 3,
        description: "Uses IP address instead of domain name"
      },
      {
        name: "URL Shortener",
        regex: /(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|ow\.ly|is\.gd)/i,
        weight: 2,
        description: "Uses URL shortening service"
      },
      {
        name: "Suspicious Subdomain",
        regex: /(secure-|login-|verify-|update-|payment-|bank-)/i,
        weight: 2,
        description: "Uses suspicious subdomain pattern"
      },
      {
        name: "Malaysian Bank Domains",
        regex: /(maybank|cimb|publicbank|rhb|hongleong|ambank|uob)/i,
        weight: 1,
        description: "References Malaysian bank names"
      },
      {
        name: "E-wallet Names",
        regex: /(grab|boost|touchngo|bigpay|shopee)/i,
        weight: 1,
        description: "References Malaysian e-wallet services"
      },
      {
        name: "Homograph Attack",
        regex: /[а-я]|[αβγδε]|[а-я]/i,
        weight: 4,
        description: "Contains non-Latin characters that look similar to Latin"
      },
      {
        name: "Multiple Subdomains",
        regex: /^https?:\/\/[^\/]*\.[^\/]*\.[^\/]*\.[^\/]/,
        weight: 2,
        description: "Uses multiple suspicious subdomains"
      },
      {
        name: "Suspicious Port",
        regex: /:\d{4,5}(?!443|80)/,
        weight: 2,
        description: "Uses non-standard port number"
      }
    ];
  }

  analyzeUrl(url) {
    const results = {
      flags: [],
      score: 0,
      riskLevel: 'safe'
    };

    try {
      // Test each rule against the URL
      for (const rule of this.rules) {
        if (rule.regex.test(url)) {
          results.flags.push({
            name: rule.name,
            description: rule.description,
            weight: rule.weight
          });
          results.score += rule.weight;
        }
      }

      // Calculate risk level based on score
      if (results.score >= 5) {
        results.riskLevel = 'dangerous';
      } else if (results.score >= 3) {
        results.riskLevel = 'suspicious';
      } else {
        results.riskLevel = 'safe';
      }

      return results;
    } catch (error) {
      console.error('Error in regex analysis:', error);
      return {
        flags: [{ name: 'Analysis Error', description: 'Could not analyze URL', weight: 0 }],
        score: 0,
        riskLevel: 'safe'
      };
    }
  }

  // Check if URL matches legitimate Malaysian banking domains
  isLegitimateBank(url) {
    const legitimateDomains = [
      'maybank2u.com.my',
      'maybank.com.my',
      'cimbclicks.com.my',
      'cimb.com.my',
      'pbebank.com',
      'publicbank.com.my',
      'rhbbank.com.my',
      'rhbnow.com.my',
      'hlb.com.my',
      'hongleongbank.com.my',
      'ambank.com.my',
      'ambankgroup.com',
      'uob.com.my',
      'standardchartered.com.my'
    ];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return legitimateDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  // Check if URL matches legitimate e-wallet domains
  isLegitimateEwallet(url) {
    const legitimateDomains = [
      'grab.com',
      'grabpay.com',
      'myboost.com.my',
      'boostbank.com',
      'touchngo.com.my',
      'tngdigital.com.my',
      'bigpay.my',
      'shopee.com.my'
    ];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return legitimateDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }
}