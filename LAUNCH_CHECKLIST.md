# 🚀 Protega CloudPay - Launch Checklist

Use this checklist to verify your setup before running the application.

## ✅ Pre-Launch Verification

### 1. Prerequisites
- [ ] Docker Desktop installed and running
- [ ] Stripe account created (free test account)
- [ ] Port 3000 available (web)
- [ ] Port 8000 available (api)
- [ ] Port 5432 available (database)

### 2. Environment Configuration
- [ ] `env.example` exists in project root
- [ ] `frontend/env.example` exists
- [ ] Copied `env.example` to `.env`
- [ ] Copied `frontend/env.example` to `frontend/.env`
- [ ] Updated `STRIPE_SECRET_KEY` in `.env`
- [ ] Updated `STRIPE_PUBLISHABLE_KEY` in `.env`
- [ ] Updated `JWT_SECRET` to random 32+ char string

### 3. File Structure Verification

Run this command to verify all key files exist:
```bash
cd /Users/mjrodriguez/Desktop/Protega

# Check root files
ls -la README.md QUICKSTART.md docker-compose.yml env.example Makefile

# Check backend
ls -la backend/Dockerfile backend/pyproject.toml backend/uvicorn.sh
ls -la backend/protega_api/main.py backend/protega_api/models.py

# Check frontend
ls -la frontend/Dockerfile frontend/package.json
ls -la frontend/src/pages/index.tsx frontend/src/pages/enroll.tsx
```

Expected: All files should exist with no "No such file" errors.

### 4. Docker Configuration
- [ ] Docker Desktop is running
- [ ] At least 4GB RAM allocated to Docker
- [ ] At least 20GB disk space available

## 🏁 Launch Sequence

### Step 1: Build and Start Services
```bash
cd /Users/mjrodriguez/Desktop/Protega
docker compose up --build
```

**Expected Output:**
```
✅ db | database system is ready to accept connections
✅ api | 🔄 Running database migrations...
✅ api | 🚀 Starting Protega API...
✅ api | INFO: Uvicorn running on http://0.0.0.0:8000
✅ web | ready - started server on 0.0.0.0:3000
```

**Wait Time:** 2-3 minutes on first build

### Step 2: Verify Services

Open a new terminal and check:
```bash
# Check all containers are running
docker compose ps

# Should show 3 containers: db, api, web - all "Up"
```

### Step 3: Health Checks

**API Health:**
```bash
curl http://localhost:8000/healthz
# Expected: {"ok":true,"version":"0.1.0","database":"connected"}
```

**Web Health:**
Open http://localhost:3000 in browser
- [ ] Landing page loads
- [ ] "Protega CloudPay" title visible
- [ ] Navigation works

**API Docs:**
Open http://localhost:8000/docs
- [ ] Swagger UI loads
- [ ] Endpoints visible
- [ ] Can expand endpoint details

### Step 4: Create Test Merchant

Via API Docs (http://localhost:8000/docs):

1. Find **POST /merchant/signup**
2. Click "Try it out"
3. Paste this JSON:
```json
{
  "name": "Test Merchant",
  "email": "test@merchant.com",
  "password": "test1234"
}
```
4. Click "Execute"
5. Verify response code **201**
6. **IMPORTANT:** Copy the `terminal_api_key` from response

- [ ] Merchant created successfully
- [ ] Terminal API key copied (save for step 6)

### Step 5: Enroll Test User

Go to http://localhost:3000/enroll

Fill in form:
- Email: `user@example.com`
- Full Name: `Test User`
- Fingerprint Sample: `DEMO-FINGER-001` ⚠️ **Save this exact string!**
- Consent: ✅ Check the box
- Stripe PM Token: `pm_card_visa`

Click "Enroll Now"

**Expected:**
- [ ] Green success banner appears
- [ ] Masked email shown (e.g., `u***@example.com`)
- [ ] Card details shown (VISA •••• 4242)

### Step 6: Process Test Payment

Go to http://localhost:3000/kiosk

Fill in form:
- Terminal API Key: _(paste from Step 4)_
- Fingerprint Sample: `DEMO-FINGER-001` ⚠️ **Must match enrollment!**
- Amount: `2000` (= $20.00)

Click "Process Payment"

**Expected:**
- [ ] Green "Transaction Approved" banner
- [ ] Transaction ID displayed
- [ ] Amount shown: $20.00

### Step 7: View Transaction Dashboard

Go to http://localhost:3000/merchant/login

Login:
- Email: `test@merchant.com`
- Password: `test1234`

**Expected:**
- [ ] Redirected to dashboard
- [ ] Stats cards show: 1 total transaction, 1 successful, $20.00 revenue
- [ ] Transaction table shows payment
- [ ] User email visible in transaction

## 🎉 Success Criteria

All of the following should be true:

- ✅ All 3 containers running (db, api, web)
- ✅ API docs accessible at localhost:8000/docs
- ✅ Web UI accessible at localhost:3000
- ✅ Merchant account created
- ✅ User enrolled with biometric
- ✅ Payment processed successfully
- ✅ Transaction visible in dashboard
- ✅ No errors in console logs

## 🐛 Troubleshooting

### Services won't start

**Problem:** `docker compose up` fails

**Solutions:**
1. Check Docker Desktop is running
2. Check ports aren't in use:
   ```bash
   lsof -i :3000  # Should be empty
   lsof -i :8000  # Should be empty
   lsof -i :5432  # Should be empty
   ```
3. Clean restart:
   ```bash
   docker compose down -v
   docker compose up --build
   ```

### Database connection failed

**Problem:** API shows "Database connection failed"

**Solutions:**
1. Wait 30 seconds - database takes time to initialize
2. Check database health:
   ```bash
   docker compose ps db
   # Should show "healthy"
   ```
3. View database logs:
   ```bash
   docker compose logs db
   ```

### "Invalid Stripe key"

**Problem:** Enrollment or payment fails with Stripe error

**Solutions:**
1. Verify `.env` has correct Stripe test keys
2. Check keys start with `sk_test_` and `pk_test_`
3. Get keys from: https://dashboard.stripe.com/test/apikeys
4. Restart API after changing `.env`:
   ```bash
   docker compose restart api
   ```

### "Biometric authentication failed"

**Problem:** Payment fails to match fingerprint

**Solutions:**
1. Verify fingerprint sample **exactly** matches enrollment
2. Check case sensitivity: `demo` ≠ `DEMO`
3. Try copy/paste to avoid typos
4. Re-enroll with a new fingerprint sample

### Frontend shows "Network Error"

**Problem:** Frontend can't reach API

**Solutions:**
1. Verify API is running: `docker compose ps api`
2. Check `frontend/.env`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. Test API directly: `curl http://localhost:8000/healthz`
4. Check CORS errors in browser console

### Port already in use

**Problem:** "Port 3000/8000/5432 is already allocated"

**Solutions:**
```bash
# Find process using port
lsof -i :3000  # or :8000 or :5432

# Kill process (replace PID)
kill -9 <PID>

# Or change port in docker-compose.yml
```

## 📊 Validation Tests

### Test 1: Multiple Enrollments
- [ ] Enroll user A with fingerprint "USER-A-001"
- [ ] Enroll user B with fingerprint "USER-B-001"
- [ ] Pay with "USER-A-001" → Should charge user A
- [ ] Pay with "USER-B-001" → Should charge user B

### Test 2: Failed Payment
- [ ] Enroll with `pm_card_chargeDeclined`
- [ ] Attempt payment
- [ ] Should show "Payment declined"
- [ ] Transaction marked as "failed" in dashboard

### Test 3: Invalid Terminal Key
- [ ] Try payment with wrong terminal_api_key
- [ ] Should get 401 Unauthorized

### Test 4: Unregistered Fingerprint
- [ ] Try payment with fingerprint never enrolled
- [ ] Should show "Biometric authentication failed"

## 🔍 Logs & Monitoring

### View all logs
```bash
docker compose logs -f
```

### View API logs only
```bash
docker compose logs -f api
```

### View database logs
```bash
docker compose logs -f db
```

### Check API performance
```bash
# Time an enrollment request
time curl -X POST http://localhost:8000/enroll \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","full_name":"Test","fingerprint_sample":"TEST","consent_text":"I consent","stripe_payment_method_token":"pm_card_visa"}'
```

Expected: < 2 seconds

## 📝 Post-Launch Checklist

- [ ] Document terminal_api_key in secure location
- [ ] Save test fingerprint samples used
- [ ] Note any errors or issues encountered
- [ ] Review logs for warnings
- [ ] Test all UI pages (landing, enroll, kiosk, login, dashboard)
- [ ] Verify mobile responsiveness
- [ ] Test with different Stripe test cards
- [ ] Review security considerations in README.md

## 🚀 Ready for Demo?

If all items checked, you're ready to demonstrate Protega CloudPay!

### Quick Demo Script

1. **Introduction** (1 min)
   - "Protega CloudPay enables device-free biometric payments"
   - Show landing page

2. **Enrollment** (2 min)
   - Navigate to /enroll
   - Show form and explain fields
   - Complete enrollment
   - Show success message

3. **Payment** (2 min)
   - Navigate to /kiosk
   - Enter terminal key and fingerprint
   - Process payment
   - Show "Transaction Approved"

4. **Dashboard** (2 min)
   - Login as merchant
   - Show transaction history
   - Explain stats cards

5. **Security** (2 min)
   - Open API docs
   - Show biometric hashing implementation
   - Explain no raw data storage

6. **Q&A** (3 min)

Total: ~10 minutes

## 🎓 Learning Resources

After successful launch, explore:

1. **Backend Code:**
   - `backend/protega_api/routers/pay.py` - Payment logic
   - `backend/protega_api/adapters/hashing.py` - Biometric security
   - `backend/protega_api/models.py` - Database schema

2. **Frontend Code:**
   - `frontend/src/pages/kiosk.tsx` - Payment UI
   - `frontend/src/lib/api.ts` - API client
   - `frontend/src/pages/merchant/dashboard.tsx` - Analytics

3. **Documentation:**
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [README.md](README.md) - Full documentation
   - [QUICKSTART.md](QUICKSTART.md) - Setup guide

## ✅ Launch Complete!

When all checks pass, mark the launch as successful:

**Launch Date:** ___________  
**Launched By:** ___________  
**All Tests Passed:** ☐ Yes ☐ No  
**Notes:** ___________________________________________

---

**Next Steps:** See [README.md#next-steps](README.md) for production preparation and feature roadmap.

**Support:** Review [QUICKSTART.md#troubleshooting](QUICKSTART.md#-troubleshooting) for common issues.

🎉 **Congratulations on launching Protega CloudPay!** 🎉

