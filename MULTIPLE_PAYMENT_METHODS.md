# Multiple Payment Methods Feature

## 📋 Overview

Protega CloudPay now supports multiple payment methods per user! Users can add multiple cards and select which one to use at payment time. This feature maintains full PCI compliance through Stripe tokenization.

---

## 🎯 What's New

### 1. Multiple Cards Per User
- Users can now store multiple payment methods (credit/debit cards)
- Each payment method includes: brand, last4, expiration date
- One payment method can be set as default
- All stored securely via Stripe

### 2. Card Selection at Payment
- Choose specific card during payment
- Falls back to default if no card specified
- Terminal displays available cards for selection

### 3. Payment Method Management
- List all payment methods for a user
- Add new payment methods
- Set/change default payment method
- Delete payment methods (must keep at least one)

---

## 🔧 Database Changes

### Updated `payment_methods` Table
```sql
- exp_month (INTEGER) - Card expiration month
- exp_year (INTEGER) - Card expiration year
- updated_at (TIMESTAMP) - Last update timestamp
- provider_payment_method_id (UNIQUE INDEX) - Prevents duplicates
```

### Migration Applied
✅ Migration `002_add_payment_method_fields` has been applied automatically

---

## 🚀 API Endpoints

### 1. **List Payment Methods**
```http
GET /users/{user_id}/payment-methods
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "provider": "stripe",
      "provider_payment_method_id": "pm_card_visa",
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025,
      "is_default": true,
      "created_at": "2025-10-29T00:00:00",
      "updated_at": "2025-10-29T00:00:00"
    }
  ],
  "total": 1
}
```

---

### 2. **Add New Payment Method**
```http
POST /users/{user_id}/payment-methods
Content-Type: application/json

{
  "stripe_payment_method_token": "pm_card_mastercard",
  "set_default": false
}
```

**Response:**
```json
{
  "id": 2,
  "user_id": 1,
  "provider": "stripe",
  "provider_payment_method_id": "pm_card_mastercard",
  "brand": "mastercard",
  "last4": "4444",
  "exp_month": 6,
  "exp_year": 2026,
  "is_default": false,
  "created_at": "2025-10-29T00:00:00",
  "updated_at": "2025-10-29T00:00:00"
}
```

**Test Payment Method Tokens:**
- `pm_card_visa` - Visa (success)
- `pm_card_mastercard` - Mastercard (success)
- `pm_card_amex` - American Express (success)
- `pm_card_chargeDeclined` - Simulates decline

---

### 3. **Set Default Payment Method**
```http
POST /users/{user_id}/payment-methods/{pm_id}/default
```

**Response:**
```json
{
  "message": "MASTERCARD ending in 4444 set as default",
  "payment_method_id": 2
}
```

---

### 4. **Delete Payment Method**
```http
DELETE /users/{user_id}/payment-methods/{pm_id}
```

**Response:** `204 No Content`

**Note:** Cannot delete if it's the only payment method remaining.

---

### 5. **Make Payment with Specific Card**
```http
POST /pay
Content-Type: application/json

{
  "terminal_api_key": "TERMINAL-xxx",
  "fingerprint_sample": "DEMO-FINGER-001",
  "amount_cents": 2500,
  "currency": "usd",
  "payment_method_provider_ref": "pm_card_mastercard"
}
```

**If `payment_method_provider_ref` is omitted, the default payment method will be used.**

**Response:**
```json
{
  "status": "succeeded",
  "transaction_id": 123,
  "message": "Transaction Approved"
}
```

---

## 📝 Example Workflow

### Step 1: Enroll User (Initial Card)
```bash
POST http://localhost:8000/enroll
{
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "fingerprint_sample": "DEMO-FINGER-001",
  "consent_text": "I consent...",
  "stripe_payment_method_token": "pm_card_visa"
}
```
✅ User enrolled with Visa as default payment method

---

### Step 2: Add a Second Card
```bash
POST http://localhost:8000/users/1/payment-methods
{
  "stripe_payment_method_token": "pm_card_mastercard",
  "set_default": false
}
```
✅ Mastercard added (not default)

---

### Step 3: List All Cards
```bash
GET http://localhost:8000/users/1/payment-methods
```

**Response shows:**
- Visa (default)
- Mastercard (not default)

---

### Step 4: Make Payment with Mastercard
```bash
POST http://localhost:8000/pay
{
  "terminal_api_key": "TERMINAL-xxx",
  "fingerprint_sample": "DEMO-FINGER-001",
  "amount_cents": 1500,
  "currency": "usd",
  "payment_method_provider_ref": "pm_card_mastercard"
}
```
✅ Payment charged to Mastercard

---

### Step 5: Change Default Card
```bash
POST http://localhost:8000/users/1/payment-methods/2/default
```
✅ Mastercard is now the default

---

### Step 6: Make Payment (Uses New Default)
```bash
POST http://localhost:8000/pay
{
  "terminal_api_key": "TERMINAL-xxx",
  "fingerprint_sample": "DEMO-FINGER-001",
  "amount_cents": 2000,
  "currency": "usd"
}
```
✅ Payment automatically charged to Mastercard (current default)

---

## 🔒 Security Features

### Stripe Tokenization
- Raw card details never stored in our database
- Only Stripe payment method IDs stored
- PCI DSS compliant

### Biometric Authentication
- All payments require fingerprint match
- PBKDF2-HMAC-SHA256 hashing (200,000 iterations)
- Raw biometric data never stored

### Payment Method Validation
- Cards must belong to the authenticated user
- Cannot delete last remaining payment method
- Stripe validates all payment method tokens

---

## 🧪 Testing Instructions

### Using API Docs Interface
1. Navigate to http://localhost:8000/docs
2. Find "payment-methods" section
3. Try the endpoints with the examples above

### Using cURL

**Add a second card:**
```bash
curl -X POST http://localhost:8000/users/1/payment-methods \
  -H "Content-Type: application/json" \
  -d '{
    "stripe_payment_method_token": "pm_card_mastercard",
    "set_default": false
  }'
```

**List all cards:**
```bash
curl http://localhost:8000/users/1/payment-methods
```

**Pay with specific card:**
```bash
curl -X POST http://localhost:8000/pay \
  -H "Content-Type: application/json" \
  -d '{
    "terminal_api_key": "TERMINAL-xxx",
    "fingerprint_sample": "DEMO-FINGER-001",
    "amount_cents": 3000,
    "currency": "usd",
    "payment_method_provider_ref": "pm_card_visa"
  }'
```

---

## 📂 Modified Files

### Backend Changes
- ✅ `backend/protega_api/models.py` - Updated PaymentMethod model
- ✅ `backend/protega_api/schemas.py` - Added payment method schemas
- ✅ `backend/protega_api/routers/enroll.py` - Stores exp_month/exp_year
- ✅ `backend/protega_api/routers/pay.py` - Allows card selection
- ✅ `backend/protega_api/routers/payment_methods.py` - New router (CRUD)
- ✅ `backend/protega_api/adapters/payments.py` - New attach_pm_and_get()
- ✅ `backend/protega_api/main.py` - Registered payment_methods router
- ✅ `backend/alembic/versions/002_add_payment_method_fields.py` - Migration

### Database Migration
- ✅ Adds `exp_month`, `exp_year`, `updated_at` columns
- ✅ Makes `provider_payment_method_id` unique
- ✅ Automatically applied on API restart

---

## 🎉 Benefits

### For Users
- Store backup payment methods
- Switch between cards easily
- Set preferred default card
- One-touch biometric payments with any card

### For Merchants
- Higher transaction success rates
- Users can retry with different cards
- Better customer experience
- Reduced cart abandonment

### For Developers
- Clean REST API
- Full Stripe integration
- PCI compliant by design
- Easy to extend

---

## 🚦 Status

✅ **All features implemented and tested**
✅ **Database migration applied**
✅ **API endpoints live at http://localhost:8000**
✅ **Documentation available at http://localhost:8000/docs**

---

## 🔗 Next Steps

### Potential Enhancements
1. **Frontend Integration**
   - Card management UI in user dashboard
   - Card selector at payment kiosk
   - Visual card display with brand logos

2. **Additional Features**
   - Nickname/label for each card
   - Card usage statistics
   - Automatic retry on decline with backup card
   - Card expiration reminders

3. **Advanced Security**
   - CVV verification for high-value transactions
   - Location-based card restrictions
   - Transaction limits per card

---

## 📞 Support

For questions or issues, check:
- API Documentation: http://localhost:8000/docs
- Project README: `/Users/mjrodriguez/Desktop/Protega/README.md`
- Architecture Doc: `/Users/mjrodriguez/Desktop/Protega/ARCHITECTURE.md`

---

**Last Updated:** October 29, 2025
**Version:** 0.2.0 (Multiple Payment Methods)

