# PaySavvy - AI-powered Fake Payment Link Detector

PaySavvy is a web application designed to help Malaysian users identify and avoid fake payment links and phishing scams. It combines pattern-based detection with AI-powered analysis using OpenAI's GPT model to provide comprehensive scam detection.

## 🚀 Features

- **Pattern-Based Detection**: Identifies suspicious URL patterns, typosquatting, and Malaysian-specific scam indicators
- **AI-Powered Analysis**: Uses OpenAI GPT-4o for advanced scam detection and risk assessment
- **Real-time Scanning**: Instant analysis of suspicious payment links
- **Risk Assessment**: Color-coded risk levels (Safe, Suspicious, Dangerous) with detailed explanations
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Malaysian Focus**: Specifically designed to detect common scams targeting Malaysian users

## 🛡️ Security Features

- URL validation and sanitization
- Pattern matching for common scam indicators
- Typosquatting detection for Malaysian banks
- Suspicious TLD detection
- AI-powered contextual analysis
- Comprehensive risk scoring system

## 🏗️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Feather Icons
- **AI Integration**: OpenAI GPT-4o API
- **Deployment**: Replit, Vercel compatible

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- OpenAI API key

### Local Development

1. **Clone or download the project files**
2. **Install dependencies**:
   ```bash
   npm install vite
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   