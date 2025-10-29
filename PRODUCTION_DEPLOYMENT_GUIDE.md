# 🚀 Protega CloudPay - Production Deployment Guide

**Deploy to Railway (Backend) + Vercel (Frontend)**

---

## 📋 Overview

This guide will deploy Protega CloudPay to production with:
- ✅ **Backend** → Railway (FastAPI + PostgreSQL)
- ✅ **Frontend** → Vercel (Next.js)
- ✅ **Revenue Model** → 0.25% + $0.30 per transaction
- ✅ **HTTPS** → Automatic SSL
- ✅ **Live Environment** → Production Stripe keys

---

## 💰 Protega Revenue Model

**Every transaction automatically earns Protega revenue:**

```
Customer wants to pay: $20.00
Protega fee: ($20.00 × 0.0025) + $0.30 = $0.35
Total charged to customer: $20.35

Breakdown:
- Merchant receives: $20.00
- Protega earns: $0.35
- Stripe charges their fee from the $20.35
```

**Implementation:**
- ✅ Automatically calculated in `/pay` endpoint
- ✅ Tracked in `protega_fee_cents` database column
- ✅ Visible in Stripe metadata
- ✅ Reported in merchant dashboard

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   Vercel (CDN)   │────────▶│  Railway (API)   │     │
│  │   Frontend       │   HTTPS  │  Backend         │     │
│  │   Next.js        │         │  FastAPI         │     │
│  │  Port 443        │         │  Port 443        │     │
│  └──────────────────┘         └──────────────────┘     │
│         │                              │                 │
│         │                              ↓                 │
│         │                      ┌──────────────────┐     │
│         │                      │  Railway         │     │
│         │                      │  PostgreSQL      │     │
│         │                      └──────────────────┘     │
│         │                              │                 │
│         └──────────────────────────────┼────────────┐   │
│                                        ↓            ↓   │
│                                ┌──────────────────────┐ │
│                                │    Stripe API        │ │
│                                │  Payment Processing  │ │
│                                └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 PART 1: Deploy Backend to Railway

### Step 1: Prepare Repository

```bash
# 1. Ensure you're in the project root
cd /Users/mjrodriguez/Desktop/Protega

# 2. Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Production ready with Protega markup fee"

# 3. Create GitHub repository and push
# Go to https://github.com/new
# Name: protega-cloudpay
# Push code:
git remote add origin git@github.com:YOUR_USERNAME/protega-cloudpay.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Project

1. **Go to Railway:** https://railway.app
2. **Sign up/Login** (use GitHub for easy integration)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose:** `your-username/protega-cloudpay`
6. **Root Directory:** Leave empty (Railway will find Dockerfile)

### Step 3: Add PostgreSQL Database

1. **In your Railway project, click "New"**
2. **Select "Database" → "PostgreSQL"**
3. **Railway auto-creates:** `DATABASE_URL` environment variable
4. **Note:** This will be automatically available to your API service

### Step 4: Configure Backend Environment Variables

**In Railway project settings for the API service:**

Click **"Variables"** tab and add:

```bash
# Required - Stripe Keys (replace with your actual keys)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Required - JWT Secret (generate random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Required - Environment
ENV=production

# Required - Frontend URL (will update after Vercel deployment)
FRONTEND_URL=https://protega-app.vercel.app

# Auto-provided by Railway (don't add manually)
# DATABASE_URL=postgresql://...
```

**To generate a secure JWT_SECRET:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: Deploy Backend

1. **Railway will automatically detect:**
   - `backend/Dockerfile`
   - `backend/railway.json`
2. **Click "Deploy"**
3. **Wait for build** (2-3 minutes)
4. **Check logs** for successful deployment

**Expected logs:**
```
✓ Database migrations applied
✓ Starting Protega CloudPay API
✓ Environment: production
✓ Database connection successful
✓ Server running on port 8000
```

### Step 6: Get Backend URL

1. **In Railway, go to Settings → Networking**
2. **Click "Generate Domain"**
3. **Your API URL:** `https://protega-api.up.railway.app`
4. **Test it:** Visit `/` to see API status
5. **Test docs:** Visit `/docs` for Swagger UI

**Verify it works:**
```bash
curl https://protega-api.up.railway.app/
# Should return: {"service": "Protega CloudPay API", "status": "running"}
```

---

## 🎨 PART 2: Deploy Frontend to Vercel

### Step 1: Prepare Vercel

1. **Go to Vercel:** https://vercel.com
2. **Sign up/Login** (use GitHub)
3. **Click "Add New..." → "Project"**
4. **Import Git Repository:** `your-username/protega-cloudpay`

### Step 2: Configure Build Settings

**In Vercel project settings:**

```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 3: Add Environment Variables

**In Vercel project → Settings → Environment Variables:**

```bash
# Required - Backend API URL
NEXT_PUBLIC_API_URL=https://protega-api.up.railway.app
```

### Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for build** (1-2 minutes)
3. **Vercel provides URL:** `https://protega-app.vercel.app`

### Step 5: Update Backend CORS

**Go back to Railway → Your API Service → Variables:**

Update the `FRONTEND_URL`:
```bash
FRONTEND_URL=https://protega-app.vercel.app
```

**Redeploy Railway backend** to pick up new CORS settings.

---

## ✅ PART 3: Verify Production Deployment

### Test 1: Health Check

```bash
# Backend
curl https://protega-api.up.railway.app/
# Should return API status

# Frontend
curl https://protega-app.vercel.app/
# Should return HTML
```

### Test 2: Create Merchant Account

```bash
curl -X POST https://protega-api.up.railway.app/merchant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Test Merchant",
    "email": "merchant@protega.com",
    "password": "SecurePass123!"
  }'
```

**Save the response:**
- `merchant_id`
- `terminal_api_key`

### Test 3: Enroll User (via Frontend)

1. **Go to:** https://protega-app.vercel.app/enroll
2. **Fill in:**
   - Email: user@test.com
   - Full Name: Test User
   - Fingerprint: PROD-FINGER-001
   - Card Token: `pm_card_visa` (test) or real card
   - ✓ Set as default
   - ✓ I consent
3. **Click "Enroll Now"**
4. **Expected:** Success with masked email

### Test 4: Process Payment (via Frontend)

1. **Go to:** https://protega-app.vercel.app/kiosk
2. **Enter:**
   - Terminal API Key: [from merchant signup]
   - Fingerprint: PROD-FINGER-001
   - Amount: 2000 (= $20.00)
3. **Click "Process Payment"**

**Expected Response:**
```
✅ Transaction Approved
Amount: $20.00
Protega Fee: $0.35
Total Charged: $20.35
```

### Test 5: Verify in Stripe Dashboard

1. **Go to:** https://dashboard.stripe.com/payments
2. **Find the payment**
3. **Check metadata:**
   ```
   base_amount_cents: 2000
   protega_fee_cents: 35
   protega_revenue_model: 0.25% + $0.30
   ```
4. **Verify amount:** $20.35

### Test 6: Check Merchant Dashboard

1. **Go to:** https://protega-app.vercel.app/merchant/login
2. **Login with merchant credentials**
3. **Verify:**
   - Transaction shows in table
   - Revenue counter updated
   - All data displayed correctly

---

## 📊 Monitor Protega Revenue

### Via Database Query

**Connect to Railway PostgreSQL:**

```bash
# Get connection details from Railway
# In Railway → PostgreSQL → Connect

psql <DATABASE_URL>

# Query total Protega revenue
SELECT 
  COUNT(*) as total_transactions,
  SUM(amount_cents) / 100.0 as merchant_revenue_usd,
  SUM(protega_fee_cents) / 100.0 as protega_revenue_usd,
  SUM(amount_cents + protega_fee_cents) / 100.0 as total_charged_usd
FROM transactions
WHERE status = 'SUCCEEDED';
```

### Via Stripe Metadata

**In Stripe Dashboard:**
1. Go to Payments
2. Export to CSV
3. Metadata columns will show:
   - `base_amount_cents`
   - `protega_fee_cents`

### Create Revenue Report Endpoint (Optional)

**Add to `backend/protega_api/routers/merchant.py`:**

```python
@router.get("/revenue/protega")
async def get_protega_revenue(
    merchant: Annotated[dict, Depends(get_current_merchant)],
    db: Annotated[Session, Depends(get_db)]
):
    """Get Protega's total revenue (admin only)."""
    # Add admin check here
    
    result = db.execute(text("""
        SELECT 
            COUNT(*) as total_transactions,
            SUM(protega_fee_cents) as total_protega_cents
        FROM transactions
        WHERE status = 'SUCCEEDED'
    """)).first()
    
    return {
        "total_transactions": result.total_transactions,
        "total_revenue_cents": result.total_protega_cents,
        "total_revenue_usd": result.total_protega_cents / 100.0
    }
```

---

## 🔐 Security Checklist

### ✅ Production Ready

- [x] HTTPS enabled (automatic on Railway/Vercel)
- [x] Environment variables secured
- [x] Database encrypted at rest (Railway default)
- [x] CORS configured for production URLs
- [x] JWT secrets are strong random values
- [x] Stripe live keys used (after testing)
- [x] No sensitive data in git repository
- [x] Database connections use connection pooling
- [x] Biometric hashes non-reversible

### 🔒 Additional Security (Recommended)

- [ ] Enable Railway's IP whitelisting
- [ ] Set up database backups
- [ ] Add rate limiting to API
- [ ] Implement API key rotation policy
- [ ] Set up monitoring/alerting (e.g., Sentry)
- [ ] Add DDoS protection (Cloudflare)
- [ ] Implement audit logging
- [ ] Regular security audits

---

## 🌍 Custom Domains (Optional)

### Backend Custom Domain

**In Railway:**
1. Settings → Networking
2. Click "Custom Domain"
3. Add: `api.protega.com`
4. Follow DNS instructions
5. Update `FRONTEND_URL` in Vercel

### Frontend Custom Domain

**In Vercel:**
1. Settings → Domains
2. Add: `app.protega.com` or `protega.com`
3. Follow DNS instructions
4. Update `FRONTEND_URL` in Railway backend

---

## 📈 Scaling Considerations

### Railway Auto-scaling

**Default limits:**
- Memory: 512MB - 8GB
- CPU: Shared → Dedicated
- Database: 1GB → Unlimited

**To scale:**
1. Railway → Project Settings
2. Adjust resource limits
3. Pricing scales automatically

### Database Optimization

**For high traffic:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_transactions_status_created 
ON transactions(status, created_at DESC);

CREATE INDEX idx_transactions_merchant_created 
ON transactions(merchant_id, created_at DESC);
```

### Caching (Future)

Consider adding Redis for:
- Session management
- Rate limiting
- Frequently accessed data

---

## 🐛 Troubleshooting

### Issue 1: Database Connection Failed

**Symptoms:**
- 500 errors
- "Database connection failed" in logs

**Solution:**
```bash
# Check Railway PostgreSQL status
# Verify DATABASE_URL is set
# Check connection string format

# In Railway logs:
# Look for: "✅ Database connection successful"
```

### Issue 2: CORS Errors

**Symptoms:**
- Frontend can't call API
- "CORS policy" error in browser console

**Solution:**
1. Verify `FRONTEND_URL` in Railway matches Vercel URL
2. Redeploy Railway backend
3. Clear browser cache
4. Check browser console for exact error

### Issue 3: Stripe Payments Failing

**Symptoms:**
- Payments return "Payment declined"
- Stripe errors in logs

**Solution:**
1. Verify Stripe keys are correct
2. Check if using test vs live keys appropriately
3. Verify Stripe account is activated
4. Check Stripe Dashboard for error details

### Issue 4: Frontend Build Fails

**Symptoms:**
- Vercel deployment fails
- Build errors

**Solution:**
```bash
# Test build locally first
cd frontend
npm run build

# Check for TypeScript errors
npm run type-check

# Check Node version matches Vercel
# Vercel uses Node 18 by default
```

### Issue 5: Migration Not Applied

**Symptoms:**
- "Column does not exist: protega_fee_cents"

**Solution:**
```bash
# SSH into Railway container
railway run bash

# Run migrations manually
alembic upgrade head

# Verify
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='transactions';"
```

---

## 📝 Environment Variables Reference

### Railway (Backend)

```bash
# Required
DATABASE_URL=<auto-provided-by-railway>
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
JWT_SECRET=<random-32-char-string>
ENV=production
FRONTEND_URL=https://protega-app.vercel.app

# Optional
API_PORT=8000  # Railway handles this
```

### Vercel (Frontend)

```bash
# Required
NEXT_PUBLIC_API_URL=https://protega-api.up.railway.app
```

---

## 🎯 Production Checklist

### Before Launch

- [ ] Test with Stripe test keys
- [ ] Verify all endpoints work
- [ ] Test full enrollment → payment flow
- [ ] Verify Protega fee calculation
- [ ] Check merchant dashboard
- [ ] Test error scenarios
- [ ] Review logs for warnings

### During Launch

- [ ] Switch to Stripe live keys
- [ ] Monitor logs continuously
- [ ] Watch for errors
- [ ] Test with real cards (small amounts)
- [ ] Verify revenue tracking

### After Launch

- [ ] Set up monitoring (Sentry/DataDog)
- [ ] Configure backup schedule
- [ ] Document runbook for incidents
- [ ] Set up alerting
- [ ] Plan scaling strategy

---

## 📞 URLs Summary

### Development
```
Backend:  http://localhost:8000
Frontend: http://localhost:3000
```

### Production
```
Backend:  https://protega-api.up.railway.app
Frontend: https://protega-app.vercel.app
API Docs: https://protega-api.up.railway.app/docs
```

### Stripe
```
Test Dashboard: https://dashboard.stripe.com/test
Live Dashboard: https://dashboard.stripe.com
```

---

## 💰 Revenue Model Summary

```
Formula: Protega Fee = (Amount × 0.0025) + 30 cents

Examples:
$10.00 transaction → $0.33 Protega fee → $10.33 total
$20.00 transaction → $0.35 Protega fee → $20.35 total
$50.00 transaction → $0.43 Protega fee → $50.43 total
$100.00 transaction → $0.55 Protega fee → $100.55 total

Breakdown:
- Customer pays: Amount + Protega Fee
- Merchant receives: Amount
- Protega earns: Fee
- Stripe charges: Their fee from total
```

---

## 🎉 Success!

Your Protega CloudPay system is now live in production with:

✅ **Full HTTPS encryption**  
✅ **Production database**  
✅ **Automatic revenue on every transaction**  
✅ **Scalable infrastructure**  
✅ **Professional deployment**  

**Next steps:**
1. Monitor initial transactions
2. Gather user feedback
3. Scale as needed
4. Add custom domains
5. Implement monitoring

---

**Questions or issues?**  
Check Railway logs: `railway logs`  
Check Vercel logs: In Vercel dashboard → Deployment → Logs

**Ready to process real payments!** 🚀💳

---

*Protega CloudPay - Production Deployment Guide*  
*Version 1.0.0*

