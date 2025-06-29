# PaySavvy - AI-powered Fake Payment Link Detector

## Overview

PaySavvy is a web-based application designed to help Malaysian users identify and avoid fake payment links and phishing scams. The application combines pattern-based detection algorithms with AI-powered analysis using OpenAI's GPT-4o model to provide comprehensive scam detection and risk assessment.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla HTML5, CSS3, and JavaScript (ES6+)
- **Build Tool**: Vite for development server and build process
- **Styling Framework**: Bootstrap 5 with custom CSS variables and responsive design
- **Icons**: Feather Icons for consistent UI elements
- **Architecture Pattern**: Single Page Application (SPA) with client-side rendering

### Backend Architecture
- **Runtime**: Browser-based JavaScript execution with PostgreSQL database integration
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **API Integration**: Direct client-side calls to OpenAI API
- **Storage**: Local storage with database backup for scan history and analytics
- **Data Layer**: Client-side database operations with fallback to localStorage

### AI Integration
- **Service**: OpenAI GPT-4o API
- **Purpose**: Advanced contextual analysis of suspicious links
- **Integration Method**: Direct API calls from the frontend using fetch API
- **Model**: GPT-4o (latest available model as of May 2024)

## Key Components

### 1. Detection Engine (main.js)
- **Pattern-Based Detection**: Regex-based analysis for common scam indicators
- **Malaysian-Specific Patterns**: Typosquatting detection for local banks (Maybank, Public Bank, RHB, CIMB, etc.)
- **Risk Scoring System**: Numerical scoring with thresholds for Safe (0-2), Suspicious (3-4), and Dangerous (5+)
- **Suspicious TLD Detection**: Identification of high-risk top-level domains

### 2. Database Layer (PostgreSQL + Drizzle ORM)
- **Schema Definition**: User tracking, scanned URLs, scam reports, and analytics tables (shared/schema.ts)
- **Database Connection**: PostgreSQL integration with Neon serverless (server/db.ts)
- **Storage Interface**: Abstracted data operations with localStorage fallback (server/storage.ts)
- **Client Integration**: Browser-based database operations (database.js)

### 3. User Interface (index.html + style.css)
- **Responsive Design**: Mobile-first approach with Bootstrap grid system
- **Color-Coded Results**: Visual risk indication (green/yellow/red)
- **Input Validation**: URL format validation and sanitization
- **Loading States**: User feedback during API calls
- **Scan History**: Recent scans display with risk levels and timestamps

### 4. Scam Pattern Database
- **Typosquatting Patterns**: Common misspellings of Malaysian bank domains
- **Scam Keywords**: Context-aware detection of suspicious phrases
- **TLD Blacklist**: Known suspicious top-level domains

## Data Flow

1. **User Input**: User pastes suspicious URL into input field
2. **Client-Side Validation**: URL format validation and sanitization
3. **Pattern Analysis**: Local regex-based detection against known scam patterns
4. **AI Analysis**: Parallel request to OpenAI API for contextual analysis
5. **Risk Calculation**: Combination of pattern-based score and AI assessment
6. **Result Display**: Color-coded risk level with detailed explanation

## External Dependencies

### Production Dependencies
- **OpenAI API**: GPT-4o model for advanced scam detection
- **Bootstrap 5**: CSS framework via CDN
- **Feather Icons**: Icon library via CDN

### Development Dependencies
- **Vite**: Build tool and development server
- **Node.js**: Runtime for build process (16+ required)

### Environment Variables
- `VITE_OPENAI_API_KEY`: Required for AI-powered analysis functionality (Vite frontend requires VITE_ prefix)

## Deployment Strategy

### Primary Platform: Replit
- **Configuration**: Express.js production server on port 5000
- **Host**: 0.0.0.0 for external access
- **Health Checks**: /health and / endpoints for deployment monitoring
- **Environment**: Node.js server with browser-based frontend execution

### Secondary Platform: Vercel
- **Build Command**: `npm run build` (Vite build process)
- **Output Directory**: `dist/`
- **Static Site**: Fully client-side application

### Build Configuration
- **Source Maps**: Enabled for debugging
- **Minification**: Terser for production builds
- **Base Path**: Relative paths for flexible deployment

## Changelog

- June 28, 2025: Initial setup
- June 28, 2025: Added PostgreSQL database integration with Drizzle ORM
  - Created database schema for users, scanned URLs, scam reports, and analytics
  - Implemented client-side database operations with localStorage fallback
  - Added scan history display functionality
  - Enhanced user interface with collapsible history section
- June 28, 2025: Complete modular architecture restructure
  - Implemented full modular file structure as per PayHack 2025 specification
  - Created src/ directory with data/, utils/, styles/ subdirectories
  - Added bilingual support (English/Bahasa Malaysia) with language.js
  - Implemented comprehensive regex rules system with regexRules.js
  - Added offline fallback detection with fallback.js
  - Separated AI detection logic into dedicated ai.js module
  - Created Malaysian banking and e-wallet data structures (brandList.json, countryMap.json)
  - Added analytics dashboard at /dashboard.html
  - Updated build system for modular imports and production optimization
  - Enhanced documentation with comprehensive README.md
- June 28, 2025: PaySavvy Pro complete with all 6 advanced cybersecurity features
  - Core URL detection fully functional with pattern analysis and AI integration
  - Scam DNA Fingerprinting with SHA-256 hashing and pattern matching
  - Redirect Chain Visualization tracking URL shorteners and multi-hop redirects
  - SMS/WhatsApp Paste Shield with real-time suspicious content alerts
  - ASEAN Multilingual Detection analyzing threats in 6 languages
  - Regional Risk Heatmap with Malaysia-focused threat intelligence
  - QR Code Scanner supporting both camera and file upload methods
  - Production-ready deployment configuration for GitHub and Vercel
  - Comprehensive documentation and testing scenarios included
- June 28, 2025: Added GPT-powered AI chatbot for risk management guidance
  - Intelligent chatbot provides real-time cybersecurity advice and support
  - Specialized in Malaysian online scam detection and risk management
  - Quick-access buttons for common security questions
  - Professional chat interface with typing indicators and message history
  - Direct OpenAI GPT-4o integration for accurate, contextual responses
- June 28, 2025: Fixed Vercel deployment configuration issues
  - Identified and resolved styling and functionality problems in deployed version
  - Simplified vercel.json for static site deployment without build process
  - Updated deployment documentation with corrected steps and troubleshooting
  - Created fixed deployment package (paysavvy-pro-vercel-fixed.tar.gz)
- June 28, 2025: Resolved critical deployment health check failures
  - Created Express.js production server (server.js) with proper health check endpoints
  - Added /health endpoint for deployment monitoring and root / endpoint serving main application
  - Configured port 5000 with 0.0.0.0 binding for external access
  - Added WebSocket support for real-time scam alerts and notifications
  - Created comprehensive deployment configuration (Dockerfile, docker-compose.yml, Procfile, app.json)
  - Updated workflow from Vite dev server to production Express server
  - Implemented graceful shutdown handlers and error handling middleware
- June 28, 2025: Enhanced deployment robustness and health check system
  - Added multiple health check endpoints (/health, /healthz, /ping) for different deployment platforms
  - Enhanced server startup with comprehensive error handling and connection verification
  - Created automated server status checker (check-server.js) for deployment validation
  - Fixed port configuration issues and improved deployment platform compatibility
  - Verified all health check endpoints are responding correctly with 200 status codes
  - Server now properly reports uptime, port, and service status in health responses
- June 29, 2025: Professional AI assistant formatting and hackathon documentation
  - Enhanced AI chatbot response formatting with structured numbered lists and professional styling
  - Added proper HTML formatting for bot messages with color-coded sections and clear typography
  - Fixed API key authentication issues and improved error handling for OpenAI integration
  - Created comprehensive hackathon recruitment documentation (HACKATHON-RECRUITMENT.md)
  - Documented all 8 advanced cybersecurity features and Malaysian-specific advantages
  - Added technical architecture details and team member recruitment guidelines
- June 28, 2025: Complete production compatibility fixes applied
  - Fixed import.meta module errors by consolidating all JavaScript into single HTML file
  - Replaced invalid 'fingerprint' Feather icons with valid alternatives (shield, check-circle, etc.)
  - Enhanced OpenAI API configuration with multiple environment variable sources
  - Created production-ready version eliminating all Vite module dependency issues
  - Implemented comprehensive error handling with custom error classes and toast notifications
  - Added cache-busting headers and environment variable injection through server.js
  - All three critical production issues resolved: module errors, icon compatibility, API configuration
- June 28, 2025: Added dual-platform deployment support (Replit + Vercel)
  - Created Vercel serverless configuration with api/server.js for health checks
  - Updated vercel.json with proper routing and serverless function support
  - Added comprehensive deployment documentation (README-DEPLOYMENT.md)
  - Configured both static hosting (Vercel) and full server functionality (Replit)
  - Ensured cross-platform compatibility for all core scam detection features

## User Preferences

Preferred communication style: Simple, everyday language.