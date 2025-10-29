# Protega CloudPay - Quick Start Guide

Get up and running with Protega CloudPay in under 5 minutes!

## Prerequisites

✅ Docker Desktop installed and running  
✅ Stripe test account (free at [stripe.com](https://stripe.com))

## Step-by-Step Setup

### 1. Configure Environment

```bash
# Copy environment files
cp env.example .env
cp frontend/env.example frontend/.env

# Edit .env and add your Stripe test keys
# Get keys from: https://dashboard.stripe.com/test/apikeys
```

Update these lines in `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
JWT_SECRET=replace_with_random_32_char_string
```

### 2. Start Services

```bash
docker compose up --build
```

Wait for the services to start (2-3 minutes on first run). You should see:
- ✅ Database ready
- ✅ API running on port 8000
- ✅ Web running on port 3000

### 3. Create a Test Merchant

Open [http://localhost:8000/docs](http://localhost:8000/docs)

1. Find **POST /merchant/signup**
2. Click "Try it out"
3. Use this JSON:
```json
{
  "name": "Test Coffee Shop",
  "email": "test@merchant.com",
  "password": "test1234"
}
```
4. Click "Execute"
5. **Copy the `terminal_api_key`** from the response (you'll need this!)

### 4. Enroll Your First Customer

Visit [http://localhost:3000/enroll](http://localhost:3000/enroll)

Fill in the form:
- **Email**: `customer@example.com`
- **Full Name**: `Jane Doe`
- **Fingerprint Sample**: `DEMO-FINGER-001` ⚠️ Remember this exact string!
- **Consent**: ✅ Check the box
- **Stripe PM Token**: `pm_card_visa` (test card)

Click "Enroll Now" — you should see success! ✅

### 5. Make a Test Payment

Visit [http://localhost:3000/kiosk](http://localhost:3000/kiosk)

Fill in:
- **Terminal API Key**: (paste from Step 3)
- **Fingerprint Sample**: `DEMO-FINGER-001` (must match enrollment!)
- **Amount**: `2000` (= $20.00)

Click "Process Payment" — you should see **"Transaction Approved"** 🎉

### 6. View Transaction in Dashboard

1. Visit [http://localhost:3000/merchant/login](http://localhost:3000/merchant/login)
2. Login with:
   - Email: `test@merchant.com`
   - Password: `test1234`
3. See your transaction! 💰

## 🎯 What Just Happened?

1. **Enrollment**: Your fingerprint string was:
   - Normalized by hardware adapter (simulated)
   - Hashed with PBKDF2 (200k iterations) + random salt
   - Linked to Stripe payment method
   - **Raw fingerprint never stored** ✅

2. **Payment**: Your fingerprint was:
   - Normalized the same way
   - Hashed with stored salt
   - Matched against stored hash
   - Payment processed via Stripe
   - Transaction recorded

## 🔧 Useful Commands

```bash
# View logs
docker compose logs -f api

# Restart services
docker compose restart

# Stop everything
docker compose down

# Clean restart (deletes database)
docker compose down -v && docker compose up --build

# Seed test merchant (alternative to API)
docker compose exec api python -m protega_api.seed
```

## 🧪 Test Cards

Use these Stripe test payment method tokens:

- `pm_card_visa` — Visa (succeeds)
- `pm_card_mastercard` — Mastercard (succeeds)
- `pm_card_amex` — Amex (succeeds)
- `pm_card_chargeDeclined` — Declined card

[More test cards →](https://stripe.com/docs/testing)

## 🐛 Troubleshooting

### "Database connection failed"
- Make sure Docker Desktop is running
- Wait 30 seconds after `docker compose up`
- Check: `docker compose ps` (db should be "healthy")

### "Stripe error"
- Verify your `.env` has correct Stripe test keys
- Make sure you're using keys from Stripe **test mode** (not live)

### "Biometric authentication failed"
- Make sure fingerprint sample **exactly** matches enrollment
- Try copying/pasting to avoid typos
- Case-sensitive: "demo" ≠ "DEMO"

### Frontend can't connect to API
- Check both services are running: `docker compose ps`
- Verify `frontend/.env` has `NEXT_PUBLIC_API_URL=http://localhost:8000`

## 📚 Next Steps

- Read [README.md](README.md) for architecture details
- Explore API docs at [localhost:8000/docs](http://localhost:8000/docs)
- Check out the hardware integration TODOs in `backend/protega_api/adapters/hardware.py`

## 🆘 Need Help?

Check the logs:
```bash
docker compose logs -f
```

Still stuck? Review the complete documentation in [README.md](README.md)

---

**Happy Building! 🚀**

