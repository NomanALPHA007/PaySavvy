# PaySavvy - AI-Powered Scam Link Detector

![PaySavvy Logo](https://img.shields.io/badge/PaySavvy-AI%20Scam%20Detector-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

PaySavvy is Malaysia's first real-time scam link scanner powered by AI and regex pattern logic. It detects fake payment links from banks or wallets and gives you a clear explanation of risk. Designed for local users, it works offline and online — and scales to fintech and government needs.

## 🚀 Live Demo

- **Production**: [Your Vercel URL here]
- **Dashboard**: [Your Vercel URL/dashboard.html]

## ✨ Features

### 🔍 **Advanced Detection Engine**
- **AI-Powered Analysis**: Uses OpenAI GPT-4o for contextual scam detection
- **Pattern Recognition**: Regex-based detection for Malaysian-specific threats
- **Offline Mode**: Works without internet using pattern-only detection
- **Real-time Scanning**: Instant URL analysis with confidence scoring

### 🇲🇾 **Malaysian-Focused Security**
- **Bank Typosquatting**: Detects fake Maybank, CIMB, Public Bank, RHB domains
- **E-wallet Protection**: Covers Grab, Boost, Touch'n Go, BigPay, ShopeePay
- **Local Threat Intelligence**: Patterns specific to Malaysian scam tactics
- **Bilingual Support**: English and Bahasa Malaysia interface

### 📊 **User Experience**
- **Color-Coded Risk Levels**: Green (Safe), Yellow (Suspicious), Red (Dangerous)
- **Detailed Explanations**: Clear reasoning for each risk assessment
- **Scan History**: Track and review previous URL scans
- **Personalized Preferences**: Select preferred banks for enhanced protection

### 🛡️ **Security & Privacy**
- **No Data Storage**: URLs are not permanently stored on servers
- **Client-Side Processing**: Pattern analysis happens in your browser
- **Optional Database**: PostgreSQL integration for enhanced analytics
- **Secure API Integration**: OpenAI API calls with proper key management

## 🏗️ Architecture

### Modular Structure
```
PaySavvy/
├── public/
│   ├── index.html          # Main application
│   └── dashboard.html      # Analytics dashboard
├── src/
│   ├── data/
│   │   ├── brandList.json  # Malaysian banks & e-wallets
│   │   └── countryMap.json # Regional threat intelligence
│   ├── utils/
│   │   ├── language.js     # Bilingual support
│   │   ├── regexRules.js   # Pattern detection engine
│   │   └── fallback.js     # Offline functionality
│   ├── styles/
│   │   └── style.css       # Modern responsive design
│   ├── main.js             # Application entry point
│   └── ai.js               # OpenAI integration
├── server/
│   ├── db.ts               # PostgreSQL connection
│   ├── storage.ts          # Database operations
│   └── api.ts              # Server-side API
├── shared/
│   └── schema.ts           # Database schema
├── vite.config.js          # Build configuration
├── vercel.json             # Deployment settings
└── package.json            # Dependencies
```

### Technology Stack

**Frontend:**
- **Framework**: Vite + Vanilla JavaScript (ES6+)
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Feather Icons
- **Build**: Terser minification with source maps

**Backend:**
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: Browser localStorage with database fallback
- **API**: OpenAI GPT-4o integration

**Deployment:**
- **Primary**: Vercel (recommended)
- **Alternative**: Any static hosting platform
- **Database**: Neon PostgreSQL (optional)

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/your-username/paysavvy.git
cd paysavvy
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

### 3. Development Server
```bash
npm run dev
# Opens on http://localhost:5000
```

### 4. Production Build
```bash
npm run build
# Output in dist/ folder
```

## 🔑 Configuration

### Required Environment Variables
```env
# OpenAI API Key (Required for AI analysis)
VITE_OPENAI_API_KEY=sk-your-key-here
```

### Optional Database Setup
```env
# PostgreSQL Database (Optional)
DATABASE_URL=postgresql://user:password@host:port/database
```

## 🌐 Deployment Guide

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy PaySavvy"
   git push origin main
   ```

2. **Import to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `VITE_OPENAI_API_KEY`
   - Deploy

3. **Automatic Configuration**
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Framework: Vite (auto-detected)

### Alternative Deployment

PaySavvy works on any static hosting platform:
- **Netlify**: Drag & drop the `dist` folder
- **GitHub Pages**: Push to `gh-pages` branch
- **AWS S3**: Upload `dist` contents to bucket

## 🧪 Testing

### Test URLs for Verification

| URL | Expected Result | Description |
|-----|----------------|-------------|
| `https://mayb4nk-login.tk/login` | **Dangerous** | Bank typosquatting |
| `https://www.maybank2u.com.my` | **Safe** | Legitimate bank |
| `https://payment-verify.ml/urgent` | **Dangerous** | Suspicious TLD + keywords |
| `bit.ly/pay-now-123` | **Suspicious** | URL shortener |

### Manual Testing Checklist

- [ ] URL input validation works
- [ ] Scan button shows loading state
- [ ] Risk levels display correctly
- [ ] Language toggle functions
- [ ] Scan history saves and displays
- [ ] Offline mode activates when internet is down
- [ ] AI analysis works with valid API key
- [ ] Pattern detection works without API key

## 🔧 Development

### Adding New Detection Rules

Edit `src/utils/regexRules.js`:
```javascript
{
  name: "New Pattern",
  regex: /pattern-to-match/i,
  weight: 3,
  description: "Description of the threat"
}
```

### Adding New Banks/E-wallets

Update `src/data/brandList.json`:
```json
{
  "malaysianBanks": {
    "newbank": {
      "official": ["newbank.com.my"],
      "name": "New Bank",
      "type": "bank"
    }
  }
}
```

### Customizing UI Language

Modify `src/utils/language.js` to add new languages or update translations.

## 📊 Analytics Dashboard

Access the dashboard at `/dashboard.html` to view:
- Real-time scan statistics
- Threat detection trends
- Most targeted banks
- Regional threat intelligence

## 🛡️ Security Features

### Pattern-Based Detection
- **Typosquatting**: Character substitution in bank names
- **Suspicious TLDs**: .tk, .ml, .ga, .cf domains
- **Phishing Keywords**: "verify account", "urgent action"
- **IP Addresses**: Direct IP instead of domain names
- **URL Shorteners**: bit.ly, tinyurl, t.co

### AI-Enhanced Analysis
- **Contextual Understanding**: GPT-4o analyzes URL context
- **Malaysian Expertise**: Trained prompts for local threats
- **Confidence Scoring**: 0-100% confidence in assessment
- **Detailed Explanations**: Human-readable threat analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure mobile responsiveness

## 📈 Roadmap

### v1.1 (Next Release)
- [ ] Chrome extension version
- [ ] Firebase logging for scam reports
- [ ] Enhanced mobile app experience
- [ ] Bulk URL scanning

### v1.2 (Future)
- [ ] Machine learning model training
- [ ] Government partnership integration
- [ ] Multi-language support expansion
- [ ] Advanced threat intelligence feeds

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/paysavvy/issues)
- **Email**: support@paysavvy.my
- **Documentation**: [Wiki](https://github.com/your-username/paysavvy/wiki)

## 🙏 Acknowledgments

- **Bank Negara Malaysia** for cybersecurity guidelines
- **OpenAI** for GPT-4o API access
- **Bootstrap Team** for UI framework
- **Feather Icons** for beautiful iconography
- **Malaysian Cybersecurity Community** for threat intelligence

---

**Built with ❤️ for Malaysia | Protecting digital payments one link at a time**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/paysavvy)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/paysavvy)