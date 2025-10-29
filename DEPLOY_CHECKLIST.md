# 🚀 Protega CloudPay - Production Deployment Checklist

**Quick reference for deploying to Railway + Vercel**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Code Ready
- [x] Protega markup fee added (0.25% + $0.30)
- [x] Database migration created (003_add_protega_fee_field.py)
- [x] CORS configured for production
- [x] Environment variable support added
- [x] Railway/Vercel configs created
- [x] All features tested locally

### Stripe Setup
- [ ] Live Stripe account created
- [ ] Business details verified
- [ ] Bank account connected
- [ ] API keys obtained (live mode)
  - `sk_live_xxx...`
  - `pk_live_xxx...`

### Repository
- [ ] Code pushed to GitHub
- [ ] Repository is public or Railway/Vercel have access
- [ ] .env files NOT committed
- [ ] Sensitive data removed

---

## 🔧 DEPLOYMENT STEPS

### 1. Deploy Backend to Railway (15 min)

- [ ] 1.1 Sign up at https://railway.app
- [ ] 1.2 Create new project from GitHub
- [ ] 1.3 Select `protega-cloudpay` repository
- [ ] 1.4 Add PostgreSQL database
- [ ] 1.5 Configure environment variables:
  ```
  STRIPE_SECRET_KEY=sk_live_xxx
  STRIPE_PUBLISHABLE_KEY=pk_live_xxx
  JWT_SECRET=<random-32-chars>
  ENV=production
  FRONTEND_URL=https://protega-app.vercel.app
  ```
- [ ] 1.6 Generate custom domain
- [ ] 1.7 Wait for deployment
- [ ] 1.8 Test: `curl https://your-api.up.railway.app/`

### 2. Deploy Frontend to Vercel (10 min)

- [ ] 2.1 Sign up at https://vercel.com
- [ ] 2.2 Import `protega-cloudpay` from GitHub
- [ ] 2.3 Set root directory: `frontend`
- [ ] 2.4 Add environment variable:
  ```
  NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
  ```
- [ ] 2.5 Deploy
- [ ] 2.6 Note your Vercel URL
- [ ] 2.7 Test: Visit https://your-app.vercel.app

### 3. Update CORS (5 min)

- [ ] 3.1 Go back to Railway
- [ ] 3.2 Update `FRONTEND_URL` with actual Vercel URL
- [ ] 3.3 Redeploy Railway backend
- [ ] 3.4 Verify CORS in browser console

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: API Health
```bash
curl https://your-api.up.railway.app/
# Expected: {"service": "Protega CloudPay API", "status": "running"}
```
- [ ] API returns 200 OK
- [ ] Response JSON is correct

### Test 2: Create Merchant
```bash
curl -X POST https://your-api.up.railway.app/merchant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Merchant",
    "email": "test@merchant.com",
    "password": "SecurePass123!"
  }'
```
- [ ] Returns merchant_id and terminal_api_key
- [ ] Save these values

### Test 3: Enroll User
- [ ] Visit: https://your-app.vercel.app/enroll
- [ ] Fill form with test data
- [ ] Use test token: `pm_card_visa`
- [ ] Enrollment succeeds
- [ ] Note user_id from response

### Test 4: Process Payment
- [ ] Visit: https://your-app.vercel.app/kiosk
- [ ] Enter terminal_api_key
- [ ] Enter same fingerprint
- [ ] Amount: 2000 ($20.00)
- [ ] Process payment
- [ ] Verify response shows:
  - Amount: $20.00
  - Protega Fee: $0.35
  - Total: $20.35

### Test 5: Verify in Stripe
- [ ] Login to Stripe Dashboard
- [ ] Find the $20.35 payment
- [ ] Check metadata shows:
  - `base_amount_cents: 2000`
  - `protega_fee_cents: 35`
  - `protega_revenue_model: 0.25% + $0.30`

### Test 6: Merchant Dashboard
- [ ] Visit: https://your-app.vercel.app/merchant/login
- [ ] Login with test merchant
- [ ] Verify transaction shows in table
- [ ] Check revenue totals

---

## 💰 VERIFY PROTEGA REVENUE MODEL

### Test Different Amounts

- [ ] $10 payment → $0.33 fee → $10.33 total
- [ ] $20 payment → $0.35 fee → $20.35 total
- [ ] $50 payment → $0.43 fee → $50.43 total
- [ ] $100 payment → $0.55 fee → $100.55 total

### Database Check
```sql
-- Connect to Railway PostgreSQL
SELECT 
  COUNT(*) as transactions,
  SUM(amount_cents)/100.0 as merchant_total,
  SUM(protega_fee_cents)/100.0 as protega_revenue,
  SUM(amount_cents + protega_fee_cents)/100.0 as customer_total
FROM transactions
WHERE status = 'SUCCEEDED';
```
- [ ] Query returns correct sums

---

## 🔐 SECURITY VERIFICATION

- [ ] HTTPS works (both URLs)
- [ ] No CORS errors in browser console
- [ ] Environment variables secured (not in code)
- [ ] JWT secret is random & strong
- [ ] Database uses encrypted connection
- [ ] API docs accessible at `/docs`
- [ ] Health endpoint returns correct info

---

## 📊 MONITORING SETUP

- [ ] Railway logs accessible
- [ ] Vercel deployment logs accessible
- [ ] Stripe dashboard bookmarked
- [ ] Set up error alerting (optional)
- [ ] Configure uptime monitoring (optional)

---

## 📝 DOCUMENTATION

- [ ] Note down all URLs
- [ ] Save environment variables (securely)
- [ ] Document test merchant credentials
- [ ] Create runbook for common issues
- [ ] Update README with production URLs

---

## 🎯 GO-LIVE CHECKLIST

### Before Accepting Real Payments

- [ ] Switch to Stripe live keys
- [ ] Test with real card (small amount)
- [ ] Verify refund process works
- [ ] Check Stripe payout schedule
- [ ] Confirm bank account receives funds
- [ ] Legal: Terms of Service posted
- [ ] Legal: Privacy Policy posted
- [ ] Support: Email/contact method ready

### Launch Day

- [ ] Monitor logs continuously
- [ ] Watch for errors
- [ ] Check Stripe dashboard frequently
- [ ] Respond to first customers quickly
- [ ] Document any issues
- [ ] Be ready to rollback if needed

---

## 🆘 TROUBLESHOOTING QUICK REFERENCE

### Database Connection Error
```bash
# Check Railway PostgreSQL status
# Verify DATABASE_URL is set
# Check logs: railway logs
```

### CORS Error
```bash
# Verify FRONTEND_URL matches Vercel domain
# Redeploy Railway after changing
# Clear browser cache
```

### Payment Failing
```bash
# Check Stripe keys are correct
# Verify account activated
# Check Stripe Dashboard logs
# Look for error in Railway logs
```

### Frontend Not Loading
```bash
# Check Vercel deployment logs
# Verify NEXT_PUBLIC_API_URL is set
# Test API URL directly
# Check browser console
```

---

## 📞 IMPORTANT URLS

```
Production Backend:  https://[your-app].up.railway.app
Production Frontend: https://[your-app].vercel.app
API Documentation:   https://[your-app].up.railway.app/docs

Railway Dashboard:   https://railway.app/project/[your-id]
Vercel Dashboard:    https://vercel.com/[your-username]/[project]
Stripe Dashboard:    https://dashboard.stripe.com
```

---

## ✅ DEPLOYMENT COMPLETE

When all checkboxes are checked:

- ✅ Backend deployed to Railway
- ✅ Frontend deployed to Vercel
- ✅ Database running on Railway
- ✅ All tests passing
- ✅ Protega revenue model working
- ✅ HTTPS enabled
- ✅ Ready for pilot/production!

---

## 🎉 SUCCESS INDICATORS

You know deployment is successful when:

✅ API health check returns 200  
✅ Frontend loads without errors  
✅ Can create merchant account  
✅ Can enroll users  
✅ Can process payments  
✅ Protega fee shows in Stripe  
✅ Dashboard displays transactions  
✅ No CORS errors  
✅ HTTPS works on both domains  

---

**Time Estimate:** 30-45 minutes for full deployment

**Next Steps:** Monitor first transactions, gather feedback, scale as needed

---

*For detailed instructions, see: PRODUCTION_DEPLOYMENT_GUIDE.md*

