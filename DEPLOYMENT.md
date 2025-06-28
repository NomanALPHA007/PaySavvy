# PaySavvy Deployment Guide

## GitHub to Vercel Deployment

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- OpenAI API key

### Step 1: Push to GitHub
1. Create a new repository on GitHub
2. Clone or upload all project files to the repository
3. Ensure `.gitignore` excludes sensitive files

### Step 2: Deploy to Vercel
1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite framework
5. Configure environment variables in Vercel dashboard:
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key

### Step 3: Build Configuration
Vercel will automatically use the `vercel.json` configuration:
- **Build Command**: `npx vite build`
- **Output Directory**: `dist`
- **Framework**: Vite (auto-detected)

### Environment Variables Required
- `VITE_OPENAI_API_KEY`: OpenAI API key for AI-powered scam detection

### File Structure for Deployment
```
PaySavvy/
├── index.html          # Main HTML file
├── main.js            # Application logic
├── database.js        # Database operations
├── style.css          # Styling
├── vite.config.js     # Vite configuration
├── vercel.json        # Vercel deployment config
├── package.json       # Dependencies
├── .gitignore         # Git ignore rules
├── .env.example       # Environment template
└── README.md          # Project documentation
```

### Build Verification
- ✅ Production build successful (`npx vite build`)
- ✅ All assets bundled correctly
- ✅ ES modules properly configured
- ✅ Environment variables handled securely

### Post-Deployment Testing
1. Verify the application loads on Vercel URL
2. Test URL scanning functionality
3. Confirm AI analysis works with API key
4. Check scan history persistence
5. Validate responsive design on mobile

### Custom Domain (Optional)
Add a custom domain in Vercel dashboard:
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

### Monitoring
- Vercel provides automatic monitoring
- Check Function Logs for any errors
- Monitor usage in Vercel Analytics

## Troubleshooting

### Common Issues
1. **Build Fails**: Check package.json scripts and dependencies
2. **API Key Issues**: Verify VITE_OPENAI_API_KEY is set correctly
3. **Assets Not Loading**: Check base path in vite.config.js
4. **Database Issues**: Ensure fallback to localStorage works

### Support
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vite Documentation: [vitejs.dev](https://vitejs.dev)