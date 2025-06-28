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
- `OPENAI_API_KEY`: Required for AI-powered analysis functionality

## Deployment Strategy

### Primary Platform: Replit
- **Configuration**: Vite development server on port 5000
- **Host**: 0.0.0.0 for external access
- **Environment**: Browser-based execution with API key management

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

## User Preferences

Preferred communication style: Simple, everyday language.