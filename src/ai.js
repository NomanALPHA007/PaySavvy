// AI-powered scam detection using OpenAI GPT-4o
export class AIDetector {
  constructor() {
    // Support both environment configurations
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async analyzeWithAI(url) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are a cybersecurity expert specializing in Malaysian digital payment scams. Analyze this URL for potential scam characteristics:

URL: ${url}

Focus on:
1. Domain legitimacy for Malaysian banks/e-wallets (Maybank, CIMB, Public Bank, RHB, Grab, Boost, Touch'n Go, etc.)
2. Typosquatting patterns
3. Suspicious TLDs or hosting
4. Social engineering tactics
5. URL structure anomalies

Respond with JSON only:
{
  "riskLevel": "safe|suspicious|dangerous",
  "confidence": 0.0-1.0,
  "explanation": "Clear explanation for Malaysian users",
  "flags": ["specific concerns found"],
  "suggestions": ["actionable safety advice"]
}`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: 'system',
              content: 'You are a cybersecurity expert. Respond only with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 500,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${errorData.error?.message || ''}`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.choices[0].message.content);

      // Validate and sanitize AI response
      return {
        riskLevel: this.validateRiskLevel(aiResult.riskLevel),
        confidence: Math.max(0, Math.min(1, aiResult.confidence || 0.5)),
        explanation: aiResult.explanation || 'AI analysis completed',
        flags: Array.isArray(aiResult.flags) ? aiResult.flags : [],
        suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [],
        source: 'ai_analysis'
      };

    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  validateRiskLevel(level) {
    const validLevels = ['safe', 'suspicious', 'dangerous'];
    return validLevels.includes(level) ? level : 'suspicious';
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey;
  }

  // Test API connectivity
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