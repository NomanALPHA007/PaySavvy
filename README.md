# PaySavvy Pro - Advanced AI Cybersecurity Platform

> **Enterprise-grade scam detection for Malaysian users with 6 advanced cybersecurity features**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/paysavvy-pro)

## 🚀 Live Demo

[Try PaySavvy Pro](https://paysavvy-pro.vercel.app) - Test with: `https://maybank-secure.com`

## ⚡ Features

### Core Detection Engine
- **AI-Powered Analysis** - OpenAI GPT-4o integration for contextual threat assessment
- **Malaysian-Specific Patterns** - Specialized detection for local banking and e-wallet scams
- **Real-time Risk Scoring** - Instant threat assessment with confidence levels

### 6 Advanced Cybersecurity Features

1. **🧬 Scam DNA Fingerprinting**
   - SHA-256 pattern hashing for recurring scam detection
   - Machine learning similarity matching
   - Persistent threat intelligence database

2. **🔗 Redirect Chain Visualization**
   - URL shortener detection and analysis
   - Multi-hop redirect tracing
   - Hidden destination exposure

3. **🛡️ SMS/WhatsApp Paste Shield**
   - Real-time clipboard monitoring
   - Intelligent threat pattern recognition
   - User consent-based security alerts

4. **🌏 ASEAN Multilingual Detection**
   - 6-language threat analysis (English, Malay, Thai, Vietnamese, Indonesian, Tagalog)
   - Regional scam keyword databases
   - Cross-linguistic threat correlation

5. **🗺️ Regional Risk Heatmap**
   - Malaysia-focused threat intelligence
   - State-by-state risk visualization
   - Local banking/e-wallet threat tracking

6. **📱 QR Code Scanner**
   - Camera-based real-time scanning
   - File upload analysis
   - Hidden URL extraction and verification

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3
- **Build Tool**: Vite 6.x with optimized production builds
- **AI Integration**: OpenAI GPT-4o API
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Bootstrap 5 with custom CSS variables
- **QR Processing**: HTML5-QRCode library
- **Deployment**: Vercel with automatic CI/CD

## 📦 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/paysavvy-pro.git
cd paysavvy-pro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Add your OpenAI API key to .env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Development Server
```bash
npm run dev
```

Visit `http://localhost:5000`

### 5. Production Build
```bash
npm run build
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Initial PaySavvy Pro deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Import project from GitHub
   - Set environment variable: `VITE_OPENAI_API_KEY`
   - Deploy automatically

3. **Environment Variables**
   ```
   VITE_OPENAI_API_KEY=sk-...your-openai-key
   ```

### Alternative Deployments
- **Netlify**: `npm run build` → Deploy `dist/` folder
- **AWS S3**: Static hosting with CloudFront
- **GitHub Pages**: Enable in repository settings

## 🔧 Configuration

### OpenAI API Setup
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Generate API key
3. Add to environment variables
4. Ensure sufficient credits for GPT-4o usage

### Database Configuration (Optional)
For scan history and analytics:
```bash
# PostgreSQL connection
DATABASE_URL=your_postgresql_connection_string
npm run db:push
```

## 🧪 Testing

### Manual Testing Scenarios

1. **Basic Scam Detection**
   ```
   Test URL: https://maybank-secure.com
   Expected: High-risk detection with banking alerts
   ```

2. **QR Code Testing**
   ```
   Upload QR image containing suspicious URL
   Expected: Automatic extraction and analysis
   ```

3. **Paste Shield Testing**
   ```
   Copy: "URGENT: Your bank account suspended bit.ly/secure123"
   Expected: Paste shield alert with security warning
   ```

4. **Multilingual Testing**
   ```
   Test URL: https://akaun-terkini-maybank.com
   Expected: Malay keyword detection with regional alerts
   ```

## 📊 Performance

- **Bundle Size**: ~131KB gzipped
- **Load Time**: <2s on 3G networks
- **AI Response**: 1-3s average
- **Lighthouse Score**: 90+ Performance

## 🔐 Security Features

- **Privacy-First Design**: No user registration required
- **Anonymous Sessions**: Client-side data storage
- **HTTPS Enforcement**: All API communications encrypted
- **XSS Protection**: Input sanitization and validation
- **CSP Headers**: Content Security Policy implementation

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📈 Analytics Dashboard

Access real-time threat intelligence:
- Regional scam activity heatmaps
- Threat pattern evolution tracking
- AI confidence score distributions
- User engagement metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-detection`
3. Commit changes: `git commit -m "Add advanced threat detection"`
4. Push branch: `git push origin feature/new-detection`
5. Submit pull request

### Development Guidelines
- Follow ESLint configuration
- Add tests for new features
- Update documentation
- Maintain mobile responsiveness

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/paysavvy-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/paysavvy-pro/discussions)
- **Email**: support@paysavvy.com

## 🏆 Recognition

Built for **PayHack 2025** - Malaysia's premier cybersecurity hackathon.

---

**Made with ❤️ for Malaysia's cybersecurity community**