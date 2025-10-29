# ⚡ Protega CloudPay - Pilot Quick Start

**For Pilot Test Participants**

---

## 🎯 System Access

### Main URLs
```
Frontend:  http://localhost:3000
API Docs:  http://localhost:8000/docs
```

### Demo Credentials (For Testing)
```
Merchant Email:    demo@protega.com
Merchant Password: demo1234
Terminal API Key:  yvFkO58OsOIUE1ZzR0uw-qrWLatgrPnZuTx-ZNFG6BI
```

---

## 👨‍💼 For Merchants

### 1. Login
→ Go to: http://localhost:3000/merchant/login  
→ Enter your email and password  
→ Click "Login"

### 2. View Transactions
→ You'll see your dashboard with:
- Total transactions
- Successful payments
- Total revenue
- Recent transactions table

### 3. Manage Customer Cards
→ In "Quick Actions" panel:
- Enter customer User ID
- Click "Manage Payment Methods"
- You can:
  - View all their cards
  - Add new cards
  - Set default card
  - Remove cards

---

## 👤 For Customers

### 1. Enroll
→ Go to: http://localhost:3000/enroll

**Fill in:**
```
Email:           your@email.com
Full Name:       Your Name
Fingerprint:     my-unique-string-123
                 (remember this exactly!)
Card Token:      pm_card_visa
                 (ask staff for test tokens)
☑ Set as default payment method
☑ I consent...
```

→ Click "Enroll Now"

### 2. Make a Payment
→ Go to: http://localhost:3000/kiosk

**Enter:**
```
Terminal API Key: [from merchant]
Fingerprint:      my-unique-string-123
                  (EXACT same as enrollment!)
Amount:           1500
                  (in cents, so 1500 = $15.00)
Payment Method:   [leave empty for default card]
```

→ Click "💳 Process Payment"  
→ See success message with transaction ID!

---

## 💳 Test Card Tokens

Use these for testing (Stripe test mode):

```
pm_card_visa         → Visa ending in 4242
pm_card_mastercard   → Mastercard ending in 5555
pm_card_amex         → Amex ending in 1005
pm_card_discover     → Discover ending in 1117
```

---

## ❓ Common Questions

**Q: What fingerprint should I use?**  
A: For pilot, use any consistent text string. Remember it exactly (case-sensitive).

**Q: Can I use a real credit card?**  
A: No! System is in test mode. Use only the test tokens above.

**Q: How do I add a second card?**  
A: Ask merchant to add it via dashboard, or they can re-enroll you.

**Q: Transaction failed, what do I do?**  
A: Check you used exact same fingerprint. Try again or contact support.

**Q: How do I know which card was charged?**  
A: Success screen shows the card brand and last 4 digits.

---

## 🆘 Need Help?

**Issue:** Can't login  
**Fix:** Verify email/password, try refreshing page

**Issue:** Payment failed  
**Fix:** Use exact fingerprint from enrollment, check amount > 0

**Issue:** Card not found  
**Fix:** Make sure you enrolled first, check with merchant

---

## 📊 What to Test

### Basic Flow (Everyone)
1. ✅ Enroll with first card
2. ✅ Make a payment
3. ✅ See transaction in dashboard

### Multi-Card (Advanced)
1. ✅ Merchant adds 2nd card
2. ✅ Merchant changes default
3. ✅ Make payment with new default
4. ✅ Merchant removes old card

### Error Cases
1. ✅ Try wrong fingerprint
2. ✅ Try zero amount
3. ✅ Try without enrollment

---

## 📝 Please Report

✅ What worked well  
✅ What was confusing  
✅ Any errors you saw  
✅ Ideas for improvement  
✅ Overall experience rating (1-5)

---

**Thank you for participating in the pilot!** 🎉

*Your feedback will help us build a better product.*

