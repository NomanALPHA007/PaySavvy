# Stripe Payment Fix for Vercel Deployment

## Problem
The coffee tip payment buttons weren't working because Vercel's static hosting doesn't support the server-side endpoints needed for Stripe payments.

## Solution Applied
Created Vercel serverless functions to handle Stripe payments properly.

## Files Added/Updated
- **api/create-tip-payment.js** - Vercel serverless function for Stripe checkout
- **api/package.json** - Dependencies for the API function
- **vercel.json** - Updated configuration for serverless functions

## Updated Deployment Package
**Download**: `paysavvy-pro-stripe-fixed.tar.gz`

## Environment Variables Required
Add these in your Vercel project settings:

### Required for AI Features:
```
OPENAI_API_KEY = sk-your-openai-key-here
VITE_OPENAI_API_KEY = sk-your-openai-key-here
```

### Required for Payment Features:
```
STRIPE_SECRET_KEY = sk_test_your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY = pk_test_your-stripe-public-key
```

## Getting Stripe API Keys
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign up/login to your account
3. Go to "Developers" → "API Keys"
4. Copy your **Secret key** (starts with `sk_`) for `STRIPE_SECRET_KEY`
5. Copy your **Publishable key** (starts with `pk_`) for `VITE_STRIPE_PUBLIC_KEY`

## Deployment Steps
1. Download the new package and extract it
2. Replace your GitHub repository files
3. Commit: "Add Stripe serverless functions for Vercel"
4. Push to GitHub
5. Add the Stripe environment variables in Vercel
6. Redeploy

## Testing Payment
- Click any coffee tip button (RM 3, RM 5, RM 10)
- Should redirect to Stripe Checkout
- Test with card number: 4242 4242 4242 4242

Your payment links will now work properly on Vercel!