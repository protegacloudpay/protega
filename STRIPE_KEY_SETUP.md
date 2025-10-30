# Stripe Key Setup for Protega CloudPay

## Problem
The Stripe publishable key is missing or incorrect in Vercel, causing card entry to fail with error:
```
Invalid API Key provided: pk_test_51
```

## Solution

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click on **Developers** → **API Keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)

### Step 2: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **protega** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value**: Your Stripe publishable key (e.g., `pk_test_51...`)
   - **Environment**: Production, Preview, Development (select all)
5. Click **Save**

### Step 3: Redeploy

After adding the environment variable, Vercel will ask you to redeploy:
1. Click **Redeploy** button
2. Wait for deployment to complete (1-2 minutes)

### Step 4: Verify

Once deployed:
1. Go to https://protega.vercel.app/customer
2. Try adding a card
3. Should work without the "Invalid API Key" error

## Test Mode vs Live Mode

### Test Mode (Current)
- Use keys starting with `pk_test_` and `sk_test_`
- Works with test cards like: `pm_card_visa`, `pm_card_mastercard`
- No real charges

### Live Mode (Production)
- Use keys starting with `pk_live_` and `sk_live_`
- Processes real payments
- Requires additional Stripe account setup

## Important Notes

- The key must start with `pk_test_` (test) or `pk_live_` (production)
- Make sure there are no spaces or quotes around the key
- The environment variable name must be exactly: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Vercel caches environment variables - redeploy after adding/updating

## Quick Fix

If you have your Stripe publishable key right now, you can add it via command line:

```bash
# Using Vercel CLI
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste your key when prompted

# Or add via Vercel dashboard
# Go to: https://vercel.com/protegacloudpay/protega/settings/environment-variables
```

## Support

If you need help:
1. Check your Stripe dashboard for the correct key
2. Verify the key is added in Vercel
3. Make sure Vercel project has been redeployed after adding the key
4. Clear browser cache and try again

