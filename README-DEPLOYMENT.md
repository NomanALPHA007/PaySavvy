# PaySavvy - Deployment Guide

## Overview
PaySavvy is an AI-powered scam detection platform that can be deployed on both Replit and Vercel platforms.

## Option 1: Replit Deployment (Recommended)

### Prerequisites
- OpenAI API key (optional, for AI features)

### Steps
1. Fork this repository to your Replit account
2. The project will automatically install dependencies
3. Add your OpenAI API key as an environment variable:
   - Go to Replit Secrets tab
   - Add `VITE_OPENAI_API_KEY` or `OPENAI_API_KEY`
4. Click the "Deploy" button in Replit
5. Your app will be live at your Replit deployment URL

### Features Available
- Full Express server functionality
- PostgreSQL database integration
- Real-time scam detection
- Complete AI analysis features
- All 6 advanced cybersecurity features

## Option 2: GitHub + Vercel Deployment

### Prerequisites
- GitHub account
- Vercel account
- OpenAI API key (optional, for AI features)

### Steps
1. Push your code to a GitHub repository
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `VITE_OPENAI_API_KEY` or `OPENAI_API_KEY`
4. Deploy using Vercel's automatic deployment

### Vercel Configuration
The project includes:
- `vercel.json` - Deployment configuration
- `api/server.js` - Serverless functions for health checks
- Static file serving for the main application

### Features Available
- Static site hosting
- Serverless API functions
- Health check endpoints
- Client-side scam detection
- Limited database functionality (uses localStorage)

## Environment Variables

### Required (Optional)
- `VITE_OPENAI_API_KEY` - OpenAI API key for AI-powered analysis
- `OPENAI_API_KEY` - Alternative OpenAI API key variable

### Database (Replit Only)
- `DATABASE_URL` - PostgreSQL connection string (automatically provided)

## Health Check Endpoints

Both deployments support health monitoring:
- `/health` - Detailed JSON health status
- `/healthz` - Simple "OK" response
- `/ping` - Returns "pong"

## Troubleshooting

### Replit Issues
- Ensure `server.js` is present and configured
- Check that port 5000 is properly configured
- Verify environment variables in Replit Secrets

### Vercel Issues
- Ensure `vercel.json` is properly configured
- Check that `api/server.js` exists for serverless functions
- Verify environment variables in Vercel dashboard
- Static files should be in the root directory

## Performance Considerations

### Replit
- Full server-side processing
- Real-time database operations
- Better for complex AI operations

### Vercel
- Faster static content delivery
- Serverless function limitations
- Better for high-traffic scenarios
- Limited server-side processing time

## Support

For deployment issues:
1. Check the health endpoints first
2. Review console logs for errors
3. Verify API key configuration
4. Ensure all dependencies are installed