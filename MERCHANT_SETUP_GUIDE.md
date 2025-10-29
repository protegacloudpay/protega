# 🏪 Merchant Setup Guide - Universal POS Integration

## Overview

Protega CloudPay works with **ANY** card reader or POS system. This guide shows you how to integrate it regardless of your current setup.

---

## 📋 What You Need

**Hardware:**
- 1 tablet or iPad (for Protega terminal)
- 1 USB fingerprint scanner ($20-50)
- Your existing POS system (Square, Clover, etc.) - keep as is!

**Software:**
- Internet browser
- WiFi connection

---

## 🎯 Three Payment Collection Methods

### Method 1: Card Reader (Recommended)

**Works with ANY POS that accepts Stripe:**
- Square
- Clover
- Verifone
- Toast
- Shopify POS
- Any USB card reader
- Any contactless reader

**How it works:**
1. Customer visits your store
2. They want to enroll in Protega
3. They swipe/tap their card on YOUR EXISTING terminal
4. Your terminal generates a Stripe payment token
5. Token is sent to Protega (secure, no card numbers stored)
6. Customer scans fingerprint
7. Done!

**Setup Steps:**

```bash
# Option A: Use your existing POS terminal
1. Keep your Square/Clover/Verifone terminal
2. When customer enrolls, process card normally
3. Copy the payment method token
4. Enter token in Protega enrollment

# Option B: Use Stripe Terminal SDK (Advanced)
1. Get Stripe Terminal reader ($50-300)
2. Install Stripe Terminal JavaScript SDK
3. Integrate with Protega enrollment page
4. Fully automated card reading
```

---

### Method 2: Bank Account (Lowest Fees)

**Uses Plaid for instant bank linking:**

**Fees:**
- Card: 2.6% + $0.10 (standard)
- ACH (Bank): 0.8% + $0.00 (much lower!)

**Customer experience:**
1. Customer taps "Link Bank Account"
2. Plaid modal opens
3. Customer logs into their bank
4. Instant verification (no micro-deposits needed)
5. Done in 30 seconds!

**Benefits:**
- ✅ Lowest transaction fees
- ✅ Instant verification
- ✅ Works with 10,000+ banks
- ✅ Bank-level security
- ✅ No chargebacks

**Setup:**
```
No setup needed! Plaid is built-in.
Customer just needs:
- Their bank login credentials
- A smartphone or computer
```

---

### Method 3: Manual Entry (Backup)

**Always available as fallback:**
- Customer types in card number
- Works anywhere, no special equipment
- Standard Stripe processing
- Good for customers without physical card present

---

## 🔄 Integration Options

### Option A: Standalone (Easiest - Start Here!)

**Setup time: 5 minutes**

```
Counter Setup:
├── Your POS (Square/etc) - for all payments
└── Protega Tablet - for enrolled customer fingerprints

Workflow:
1. Customer orders
2. Barista asks: "Fingerprint or card?"
3. If fingerprint → use Protega tablet
4. If card → use your POS as usual
```

**Setup steps:**
1. Get tablet
2. Open browser to: https://protega.vercel.app/enroll-pro
3. Bookmark it
4. Place at counter
5. Done!

---

### Option B: API Integration (Advanced)

**For tech-savvy merchants who want full integration**

**Create custom integration:**

```javascript
// Example: Integrate Protega with your POS

// 1. Enroll customer via your POS
fetch('https://protega-api.fly.dev/enroll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: customer.email,
    full_name: customer.name,
    fingerprint_sample: fingerprintData,
    stripe_payment_method_token: stripeToken,
    consent_text: 'I consent...'
  })
});

// 2. Process payment via your POS
fetch('https://protega-api.fly.dev/pay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    terminal_api_key: YOUR_API_KEY,
    fingerprint_sample: fingerprintData,
    amount_cents: 500, // $5.00
    currency: 'usd'
  })
});
```

**Benefits:**
- Fully automated
- Single POS interface
- Custom branding
- Seamless experience

**Cost:**
- $500-2000 for custom integration
- Or DIY if you have a developer

---

## 🏗️ Physical Setup Examples

### Coffee Shop Example

```
Counter Layout:
┌─────────────────────────────────┐
│  Cash Register                  │
│  ├─ Square Terminal             │
│  ├─ Receipt Printer             │
│  └─ Protega Tablet + Scanner    │
└─────────────────────────────────┘

Near Entrance:
┌─────────────────────────────────┐
│  Enrollment Station             │
│  ├─ Tablet (enrollment page)    │
│  ├─ Fingerprint scanner         │
│  └─ QR code poster              │
└─────────────────────────────────┘
```

### Restaurant Example

```
Host Stand (Enrollment):
- Tablet for new customer signup
- "Get $5 off when you enroll!"

Checkout Counter (Payment):
- Your existing POS
- Protega terminal for enrolled customers
```

---

## 💰 Cost Breakdown

### One-Time Costs:
- Tablet: $150-500 (iPad or Android)
- Fingerprint Scanner: $20-80
- Optional stand/mount: $20-50
- **Total: $190-630**

### Monthly Costs:
- Protega fee: 0.25% + $0.30 per transaction
- Paid by merchant (deducted from sale)
- No monthly subscription
- No hidden fees

### Fee Comparison:

**Example: $5.00 coffee sale**

**Regular card (Square):**
- Sale: $5.00
- Square fee: $0.24 (2.6% + $0.10)
- You keep: $4.76

**Protega fingerprint:**
- Sale: $5.00
- Stripe fee: $0.25 (2.9% + $0.00)
- Protega fee: $0.31 (0.25% + $0.30)
- You keep: $4.44

**Protega bank account (ACH):**
- Sale: $5.00
- ACH fee: $0.04 (0.8%)
- Protega fee: $0.31 (0.25% + $0.30)
- You keep: $4.65

---

## 📱 Customer Enrollment Flow

### At Your Store:

**Step 1: Choose payment method**
```
Options shown:
┌────────────────────────────────┐
│ 💳 Card Reader                 │
│ Swipe on our terminal          │
└────────────────────────────────┘
┌────────────────────────────────┐
│ 🏦 Bank Account                │
│ Link via Plaid                 │
└────────────────────────────────┘
┌────────────────────────────────┐
│ ⌨️ Manual Entry                │
│ Type card details              │
└────────────────────────────────┘
```

**Step 2: Enter info**
- First name, last name, email
- Takes 10 seconds

**Step 3: Payment method**
- Card reader: swipe card
- Bank account: login to bank
- Manual: type card number

**Step 4: Fingerprint**
- Place finger on scanner
- One scan, done!

**Total time: 30-60 seconds**

---

## 🎯 Staff Training Script

### When customer asks about Protega:

**You say:**
> "Protega lets you pay with just your fingerprint - no phone or wallet needed! 
> It takes 30 seconds to enroll, and works at all Protega merchants.
> Would you like to try it?"

### If yes:

**Card reader method:**
> "Great! First, I'll swipe your card on our terminal like a normal purchase.
> Then you'll scan your fingerprint once. That's it - you're enrolled!
> Next time you're here, just use your fingerprint to pay."

**Bank account method:**
> "Perfect! You can link your bank account directly - it's more secure 
> and has lower fees. Just log in to your bank on this tablet, 
> then scan your fingerprint. You're all set!"

### If customer is unsure:

> "No worries! You can always pay with your card like usual.
> Protega is just an option for faster checkout."

---

## 🔐 Security & Compliance

### What we DON'T store:
- ❌ Actual fingerprint images
- ❌ Card numbers
- ❌ Bank account numbers
- ❌ Passwords

### What we DO store:
- ✅ One-way fingerprint hash (irreversible)
- ✅ Stripe payment method tokens
- ✅ Email (for receipts)

### Compliance:
- ✅ PCI-DSS Level 1 (Stripe)
- ✅ SOC 2 Type II (Plaid)
- ✅ GDPR compliant
- ✅ CCPA compliant
- ✅ Biometric privacy laws compliant

---

## 🚀 Go-Live Checklist

### Week 1 (Soft Launch):
- [ ] Purchase tablet and fingerprint scanner
- [ ] Set up enrollment station
- [ ] Train 2-3 staff members
- [ ] Test with employees
- [ ] Enroll 5-10 regular customers

### Week 2 (Beta):
- [ ] Promote to all customers
- [ ] Create signage
- [ ] Offer $1 off for enrollment
- [ ] Track usage metrics

### Week 3 (Full Launch):
- [ ] Announce on social media
- [ ] Add "We Accept Fingerprint Payments" to window
- [ ] Monitor and optimize

---

## 📊 Expected Usage

**Month 1:**
- 5-10% of customers enrolled
- Mostly regulars

**Month 3:**
- 20-30% of customers enrolled
- Faster checkout lines

**Month 6:**
- 40-50% of regular customers enrolled
- Significant time savings

---

## 🆘 Troubleshooting

### "Card reader not working"
**Solution:** Use bank account or manual entry as backup

### "Fingerprint not recognized"
**Solution:** 
1. Clean scanner
2. Customer tries different finger
3. Fallback to card payment

### "Customer doesn't have email"
**Solution:** Create store email: `customername@yourstorename.com`

### "Internet down"
**Solution:** Keep accepting cards on your regular POS

---

## 📞 Support

**Need help?**
- Email: support@protega.com
- Phone: 1-800-PROTEGA
- Dashboard: https://protega.vercel.app/merchant/dashboard

**Integration help:**
- Technical docs: https://protega-api.fly.dev/docs
- GitHub: https://github.com/protegacloudpay/protega
- Developer forum: forum.protega.com

---

## 🎉 Ready to Launch?

1. ✅ Order your hardware
2. ✅ Go to https://protega.vercel.app/enroll-pro
3. ✅ Train your staff
4. ✅ Start enrolling customers!

**Questions? We're here to help! 🚀**


