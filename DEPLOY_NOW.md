# 🚀 Deploy Protega CloudPay NOW

**3 Simple Steps to Go Live**

---

## ⚡ QUICK START (30 minutes total)

### 📋 Prerequisites (Free!)

1. **GitHub Account** → https://github.com/signup
2. **Railway Account** → https://railway.app (signup with GitHub)
3. **Vercel Account** → https://vercel.com (signup with GitHub)

---

## 🎯 STEP 1: Push to GitHub (5 minutes)

### Option A: Automated Script (Easiest)

```bash
cd /Users/mjrodriguez/Desktop/Protega
./SETUP_GITHUB.sh
```

Then:
1. Go to https://github.com/new
2. Create repository: `protega-cloudpay`
3. Go to https://github.com/settings/tokens
4. Generate token with `repo` and `workflow` scopes
5. Run: `git push -u origin main`
6. Enter username and token

### Option B: Manual

```bash
cd /Users/mjrodriguez/Desktop/Protega

# Initialize git
git init

# Add files
git add .

# Commit
git commit -m "Initial commit - Protega CloudPay"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/protega-cloudpay.git

# Push
git branch -M main
git push -u origin main
```

**When prompted:**
- Username: `your-github-username`
- Password: `ghp_xxxxx` (your Personal Access Token)

✅ **Verify:** Visit `https://github.com/YOUR_USERNAME/protega-cloudpay`

---

## 🚂 STEP 2: Deploy Backend to Railway (15 minutes)

### 1. Create Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access GitHub
5. Select `protega-cloudpay`

### 2. Add Database

1. Click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically sets `DATABASE_URL`

### 3. Configure Backend Service

1. Click on your repo service
2. Go to "Settings"
3. Set "Root Directory" → `/backend`
4. Railway auto-detects Dockerfile ✓

### 4. Add Environment Variables

Click "Variables" tab:

```bash
# Stripe (REQUIRED - use your own keys)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# JWT Secret (REQUIRED - generate random)
JWT_SECRET=protega_production_jwt_secret_key_change_me_in_production

# Environment (REQUIRED)
ENV=production

# Frontend URL (add after Vercel deploy)
FRONTEND_URL=https://protega-cloudpay.vercel.app
```

### 5. Generate Domain

1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. **Copy your API URL:** `https://protega-cloudpay-production-xxxx.up.railway.app`

### 6. Deploy

- Railway deploys automatically!
- Wait 3-5 minutes for build

### 7. Test

```bash
curl https://your-railway-url.up.railway.app/
```

Should return: `{"status":"OK","message":"Protega CloudPay API"}`

✅ **Backend is live!**

---

## ⚡ STEP 3: Deploy Frontend to Vercel (10 minutes)

### 1. Create Project

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Choose `protega-cloudpay`

### 2. Configure Build

```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build (default)
Output Directory: .next (default)
Install Command: npm install (default)
```

### 3. Add Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
```

**Replace `your-railway-url` with actual Railway URL from Step 2!**

### 4. Deploy

- Click "Deploy"
- Wait 2-3 minutes
- **Copy your Frontend URL:** `https://protega-cloudpay.vercel.app`

✅ **Frontend is live!**

### 5. Update Backend CORS

1. Go back to Railway
2. Click your backend service
3. Go to "Variables"
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://protega-cloudpay.vercel.app
   ```
5. Railway redeploys automatically (2 minutes)

✅ **CORS configured!**

---

## ✅ FINAL VERIFICATION

### Test Backend

```bash
# Health check
curl https://your-railway-url.up.railway.app/

# Should return:
# {"status":"OK","message":"Protega CloudPay API"}
```

### Test Frontend

1. Open: `https://protega-cloudpay.vercel.app`
2. You should see the Protega CloudPay landing page
3. Try all tabs: "Home", "For Customers", "For Merchants"

### Test Complete Flow

#### A. Enroll User

1. Go to "For Customers" tab
2. Click "Enroll Now"
3. Fill form:
   ```
   First Name: John
   Last Name: Doe
   Email: john@test.com
   Phone: 555-0100
   Fingerprint: test123
   Card Number: 4242424242424242
   Exp: 12/26
   CVC: 123
   ZIP: 10001
   ```
4. Submit → **Note the User ID** (e.g., User ID: 1)

#### B. Create Merchant

1. Go to "For Merchants" tab
2. Click "Merchant Login"
3. Click "Create merchant account"
4. Fill form:
   ```
   Business Name: Test Coffee Shop
   Email: cafe@test.com
   Password: test1234
   ```
5. Submit → **Copy Terminal API Key**

#### C. Process Payment

1. Go to "For Customers" tab
2. Click "Make a Payment"
3. Fill form:
   ```
   User ID: 1 (from step A)
   Fingerprint: test123 (same as enrollment)
   Terminal API Key: (from step B)
   Amount: 10.00
   ```
4. Submit → Should see:
   ```
   ✅ Payment Successful!
   Transaction Approved - Amount: $10.00, Protega Fee: $0.33, Total Charged: $10.33
   ```

#### D. View Dashboard

1. Go back to "For Merchants" tab
2. Click "Merchant Login"
3. Login:
   ```
   Email: cafe@test.com
   Password: test1234
   ```
4. See your transaction:
   ```
   Total Revenue: $10.00
   Protega Fee: $0.33
   ```

### 🎉 IT WORKS!

---

## 📊 Production Checklist

- [x] Code on GitHub
- [x] Backend on Railway
- [x] Frontend on Vercel
- [x] PostgreSQL database
- [x] Stripe test mode
- [x] HTTPS everywhere
- [x] CORS configured
- [x] Protega markup fee (0.25% + $0.30)
- [x] Multi-card support
- [ ] **Switch to Stripe LIVE mode** (when ready for real money)

---

## 🔄 Updating Your App

```bash
# Make changes locally
cd /Users/mjrodriguez/Desktop/Protega

# Commit changes
git add .
git commit -m "Description of changes"
git push

# Railway and Vercel auto-redeploy! ✨
```

---

## 🎯 What You Have Now

### 🌐 Live URLs

- **Frontend:** `https://protega-cloudpay.vercel.app`
- **Backend API:** `https://your-railway-url.up.railway.app`
- **Database:** PostgreSQL on Railway
- **Payments:** Stripe (test mode)

### 💰 Revenue Model

- **Your platform fee:** 0.25% + $0.30 per transaction
- **Automatic calculation:** Built into every payment
- **Tracked in database:** See in merchant dashboard

### 🔒 Security

- ✅ HTTPS everywhere
- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ PBKDF2 biometric hashing
- ✅ Stripe secure tokens
- ✅ Environment variables

### ✨ Features

- ✅ Biometric enrollment
- ✅ Multi-card management
- ✅ Card selection at checkout
- ✅ Merchant dashboard
- ✅ Transaction history
- ✅ Real-time revenue tracking
- ✅ Test card support

---

## 🔧 Troubleshooting

### GitHub Push Fails

```bash
# Use Personal Access Token as password
# Create at: https://github.com/settings/tokens
# Scopes: repo, workflow
```

### Railway Build Fails

1. Check "Deployments" tab for errors
2. Ensure `DATABASE_URL` is set automatically
3. Check backend logs

### Vercel Build Fails

1. Check build logs
2. Ensure `NEXT_PUBLIC_API_URL` is set
3. Root directory should be `frontend`

### CORS Errors

1. Update `FRONTEND_URL` in Railway
2. Wait 2 minutes for redeploy
3. Hard refresh browser (Cmd+Shift+R)

### Payment Fails

1. Check Stripe keys are correct
2. Use test card: `4242 4242 4242 4242`
3. Check backend logs in Railway

---

## 📞 Support

### Resources

- **GitHub:** https://docs.github.com
- **Railway:** https://docs.railway.app
- **Vercel:** https://vercel.com/docs
- **Stripe:** https://stripe.com/docs

### Common Issues

- **"Repository not found"** → Check GitHub username in URL
- **"Invalid credentials"** → Use Personal Access Token
- **"Build failed"** → Check logs in Railway/Vercel
- **"CORS error"** → Update FRONTEND_URL in Railway
- **"Payment failed"** → Check Stripe keys

---

## 🎊 YOU'RE LIVE!

**Congratulations! Protega CloudPay is now in production.**

### Share Your App

- Frontend: `https://protega-cloudpay.vercel.app`
- Backend: `https://your-railway-url.up.railway.app`

### Monitor Your App

- **Railway Dashboard:** View logs, metrics, database
- **Vercel Dashboard:** View deployments, analytics
- **Stripe Dashboard:** View payments, customers

### Go to Production

When ready for real payments:
1. Switch Stripe to LIVE mode
2. Update API keys in Railway
3. Test with real card (small amount)
4. You're in business! 💰

---

**Total Time:** ~30 minutes  
**Cost:** $0 (free tiers)  
**Status:** 🟢 PRODUCTION READY

**Let's go! 🚀**

