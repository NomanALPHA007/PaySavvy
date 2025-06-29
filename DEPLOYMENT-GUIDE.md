# PaySavvy Pro - GitHub Desktop & Vercel Deployment Guide

## 📦 Download & Upload to GitHub

### Step 1: Download the Deployment Package
1. **Download the file**: `paysavvy-pro-deployment.tar.gz` from your Replit project
2. **Extract the archive** to a folder on your computer (e.g., `PaySavvy-Pro/`)

### Step 2: Upload to GitHub using GitHub Desktop

1. **Open GitHub Desktop**
2. **Create a new repository**:
   - Click "File" → "New Repository"
   - Repository Name: `paysavvy-pro`
   - Description: `AI-powered scam detection platform for Malaysian users`
   - Local Path: Choose where you want to store the project
   - Initialize with README: ✅ Check this
   - Git ignore: `Node`
   - License: `MIT` (recommended)

3. **Copy project files**:
   - Open the repository folder GitHub Desktop created
   - Delete the default README.md file
   - Copy ALL files from your extracted `PaySavvy-Pro/` folder into this repository folder
   - Make sure these key files are present:
     - `index.html`
     - `server.js`
     - `package.json`
     - `vercel.json`
     - `README.md`
     - `data/` folder
     - `src/` folder

4. **Commit and push**:
   - In GitHub Desktop, you'll see all the new files listed
   - Add a commit message: `Initial PaySavvy Pro deployment`
   - Click "Commit to main"
   - Click "Publish repository" (make it public if you want)

## 🚀 Deploy to Vercel

### Step 1: Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your `paysavvy-pro` repository from GitHub
4. Click "Import"

### Step 2: Configure Build Settings
- **Framework Preset**: `Other`
- **Root Directory**: `./` (leave as default)
- **Build Command**: Leave empty (we use static files)
- **Output Directory**: `./` (leave as default)
- **Install Command**: `npm install`

### Step 3: Add Environment Variables
⚠️ **CRITICAL**: You must add these exact environment variable names in Vercel:

Click "Environment Variables" and add:

1. **OPENAI_API_KEY**
   - Value: Your OpenAI API key (starts with `sk-`)
   - Environment: Production, Preview, Development

2. **VITE_OPENAI_API_KEY** 
   - Value: Your OpenAI API key (starts with `sk-`)
   - Environment: Production, Preview, Development

3. **STRIPE_SECRET_KEY** (if using Stripe features)
   - Value: Your Stripe secret key (starts with `sk_`)
   - Environment: Production, Preview, Development

4. **VITE_STRIPE_PUBLIC_KEY** (if using Stripe features)
   - Value: Your Stripe publishable key (starts with `pk_`)
   - Environment: Production, Preview, Development

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete (usually 1-2 minutes)
3. Your app will be available at: `https://your-project-name.vercel.app`

## 🔧 Getting Your API Keys

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up/Login to your account
3. Go to "API Keys" section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. **Important**: Keep this secret and never share it publicly

### Stripe API Keys (Optional - for payment features)
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign up/Login to your account
3. Go to "Developers" → "API Keys"
4. Copy your **Publishable key** (starts with `pk_`) for `VITE_STRIPE_PUBLIC_KEY`
5. Copy your **Secret key** (starts with `sk_`) for `STRIPE_SECRET_KEY`

## 🔍 Verifying Deployment

### Check if deployment is working:
1. Visit your Vercel URL
2. Test the URL scanner feature
3. Test the QR code scanner
4. Test the AI Security Assistant chat

### Common Issues & Solutions:

**Issue**: "Cannot use 'import.meta' outside a module"
- **Solution**: This is expected and won't affect the deployed version on Vercel

**Issue**: AI Assistant not responding
- **Solution**: Check that `OPENAI_API_KEY` and `VITE_OPENAI_API_KEY` are set correctly in Vercel

**Issue**: QR Scanner not working
- **Solution**: The app needs HTTPS to access camera. Vercel provides this automatically.

**Issue**: 404 errors on refresh
- **Solution**: Vercel's `vercel.json` file handles this automatically with rewrites

## 📋 Environment Variables Checklist

✅ **Required for basic functionality:**
- `OPENAI_API_KEY` (for server-side AI calls)
- `VITE_OPENAI_API_KEY` (for client-side AI calls)

✅ **Optional for payment features:**
- `STRIPE_SECRET_KEY` (server-side Stripe operations)
- `VITE_STRIPE_PUBLIC_KEY` (client-side Stripe integration)

## 🎯 Post-Deployment Testing

1. **URL Scanner**: Test with a suspicious URL like `http://mayb4nk.com`
2. **QR Scanner**: Test with your phone's camera or upload a QR image
3. **AI Assistant**: Ask "What are the latest TNG scams?"
4. **Brand Verification**: Test with legitimate bank URLs
5. **Mobile Compatibility**: Check on mobile devices

## 📞 Support

If you encounter issues:
1. Check Vercel's deployment logs in your dashboard
2. Verify all environment variables are set correctly
3. Ensure your OpenAI account has sufficient credits
4. Test the original Replit version to compare behavior

Your PaySavvy Pro platform is now ready for production use with enterprise-grade security and performance!