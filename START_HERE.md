# 🎯 START HERE - Protega CloudPay Deployment

**Quick 3-step guide to go live in 30 minutes**

---

## ✅ What You Need (All Free)

1. **GitHub Account** → https://github.com/signup
2. **Railway Account** → https://railway.app
3. **Vercel Account** → https://vercel.com

---

## 🚀 3 STEPS TO DEPLOY

### STEP 1: GitHub (5 min)

```bash
# Option A: Run script (easiest)
cd /Users/mjrodriguez/Desktop/Protega
./SETUP_GITHUB.sh

# Option B: Manual
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/protega-cloudpay.git
git branch -M main
git push -u origin main
```

**Before pushing:**
1. Create repo: https://github.com/new → `protega-cloudpay`
2. Create token: https://github.com/settings/tokens → Select `repo` + `workflow`
3. Use token as password when pushing

---

### STEP 2: Railway Backend (15 min)

1. **Go to:** https://railway.app
2. **New Project** → Deploy from GitHub → `protega-cloudpay`
3. **Add Database:** + New → PostgreSQL
4. **Set Root Directory:** Settings → Root Directory → `/backend`
5. **Add Variables:**
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   JWT_SECRET=protega_production_secret_key
   ENV=production
   FRONTEND_URL=https://protega-cloudpay.vercel.app
   ```
6. **Generate Domain:** Settings → Networking → Generate Domain
7. **Copy URL:** `https://protega-cloudpay-production.up.railway.app`

**Test:**
```bash
curl https://your-railway-url.up.railway.app/
```

---

### STEP 3: Vercel Frontend (10 min)

1. **Go to:** https://vercel.com
2. **New Project** → Import → `protega-cloudpay`
3. **Configure:**
   ```
   Framework: Next.js
   Root Directory: frontend
   ```
4. **Add Variable:**
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
   ```
5. **Deploy**
6. **Copy URL:** `https://protega-cloudpay.vercel.app`

**Update Railway:**
- Go back to Railway
- Update `FRONTEND_URL` with Vercel URL
- Wait 2 min for redeploy

---

## ✅ TEST IT

1. **Open:** `https://protega-cloudpay.vercel.app`

2. **Enroll User:**
   - For Customers → Enroll Now
   - Card: `4242 4242 4242 4242`
   - Note User ID

3. **Create Merchant:**
   - For Merchants → Login → Sign Up
   - Copy Terminal API Key

4. **Make Payment:**
   - For Customers → Make Payment
   - Use User ID + Fingerprint + API Key
   - Should see: "Amount: $10.00, Protega Fee: $0.33"

5. **View Dashboard:**
   - For Merchants → Login
   - See transaction!

---

## 🎉 YOU'RE LIVE!

**Frontend:** https://protega-cloudpay.vercel.app  
**Backend:** https://your-railway-url.up.railway.app  
**Database:** PostgreSQL on Railway  
**Payments:** Stripe (test mode)  
**Revenue:** 0.25% + $0.30 per transaction  

---

## 📚 Full Guides

- **Detailed Steps:** `DEPLOY_NOW.md`
- **GitHub Help:** `GITHUB_SETUP_GUIDE.md`
- **Pilot Guide:** `PILOT_LAUNCH_PACKAGE.md`
- **Troubleshooting:** `PRODUCTION_DEPLOYMENT_GUIDE.md`

---

## 🔄 Update Your App

```bash
# Make changes
git add .
git commit -m "Update"
git push

# Railway + Vercel auto-redeploy! ✨
```

---

## 💡 Quick Tips

- ✅ Keep `.env` files local (never commit)
- ✅ Use test cards only in test mode
- ✅ Monitor deployments in Railway/Vercel dashboards
- ✅ Check logs for errors
- ✅ Switch to Stripe LIVE mode when ready for real money

---

**Time:** 30 minutes  
**Cost:** Free  
**Status:** Production Ready  

**GO! 🚀**

