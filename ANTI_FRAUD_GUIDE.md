# Protega CloudPay Anti-Fraud System

## Overview

The anti-fraud system prevents duplicate enrollments (card reuse, duplicate fingerprints), implements risk scoring, and uses phone OTP verification for suspicious enrollments. **No limits on enrollment volume** - device and IP tracking is for analytics only.

## Features

### 1. Card Fingerprint Tracking
- **Block reuse of Stripe card fingerprint**: One card → one Protega ID
- Extracts card fingerprint from Stripe payment method token
- Flags enrollments with duplicate card fingerprints

### 2. Device Tracking (Analytics Only)
- **Tracks enrollments by device ID**: For analytics and monitoring
- No limits enforced - unlimited enrollments allowed per device
- Device data stored for fraud pattern detection

### 3. Phone OTP Verification
- **Progressive friction**: OTP required on mid-risk enrollments
- Twilio SMS integration (works without Twilio in dev mode)
- In-memory OTP store with 5-minute expiration

### 4. Risk Scoring
- Computes risk score based on multiple factors:
  - Card reuse: 50 points
  - Phone missing: 20 points
  - Fingerprint already registered: 80 points
- Device & IP velocity tracked for analytics only (no penalty)
- Triggers OTP at threshold 30
- Triggers KYC review at threshold 60

### 5. Admin Review
- Flagged enrollments stored in `flagged_enrolls` table
- Admin endpoints to view and resolve flags
- Actions: approve, deny, or merge to existing identity

## Database Changes

### New Tables
- `protega_identities`: Top-level identity container
- `flagged_enrolls`: Flagged enrollment attempts for review

### New Fields
- `users`: 
  - `protega_identity_id` (FK to protega_identities)
  - `phone_verified` (boolean)
  - `card_fingerprint` (string)
- `biometric_templates`:
  - `device_id` (string)
  - `enroll_ip` (string)
  - `finger_label` (string)
  - `liveness_score` (int)

## Environment Variables

Add these to your `.env` and production environment:

```bash
# Anti-fraud thresholds
PROTEGA_DEVICE_ENROLL_LIMIT=3           # Per device per 24h (default 3)
PROTEGA_RISK_OTP_THRESHOLD=30           # Score >= this -> require OTP
PROTEGA_RISK_KYC_THRESHOLD=60           # Score >= this -> require KYC/manual review

# Twilio (for OTP SMS)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

## Installation

### 1. Install Python Dependencies

```bash
pip install twilio
```

### 2. Run Database Migration

```bash
cd backend
alembic upgrade head
```

Or if using SQL directly:

```sql
-- See backend/alembic/versions/005_add_anti_fraud_fields.py for SQL
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
PROTEGA_DEVICE_ENROLL_LIMIT=3
PROTEGA_RISK_OTP_THRESHOLD=30
PROTEGA_RISK_KYC_THRESHOLD=60

# Optional (for production OTP)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1xxx
```

## API Endpoints

### Enrollment Flow

**POST /enroll**
- Enhanced with anti-fraud checks
- Returns different statuses based on risk:
  - `enrolled`: Low risk, enrollment successful
  - `otp_sent`: Medium risk, OTP required
  - `requires_kyc`: High risk, manual review needed

**POST /verify-otp**
- Verify OTP code received via SMS
- Completes enrollment if valid

### Admin Endpoints

**GET /admin/flagged**
- List all unresolved flagged enrollments
- Shows risk score, reasons, and enrollment data

**POST /admin/flagged/{flag_id}/resolve**
- Resolve a flagged enrollment
- Actions: `approve`, `deny`, `merge`
- Returns resolution status

## Usage Examples

### Low-Risk Enrollment

```bash
curl -X POST https://protega-api.fly.dev/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "John Doe",
    "fingerprint_sample": "FINGERPRINT-001",
    "consent_text": "I consent...",
    "stripe_payment_method_token": "pm_card_visa",
    "phone_number": "+1234567890",
    "device_id": "TERMINAL-001"
  }'

# Response: {"status": "enrolled", "user_id": 123, ...}
```

### Medium-Risk Enrollment (Requires OTP)

```bash
# Same card, different email
curl -X POST https://protega-api.fly.dev/enroll \
  -d '{
    "email": "another@example.com",
    "fingerprint_sample": "FINGERPRINT-002",
    "stripe_payment_method_token": "pm_card_visa",
    ...
  }'

# Response: {
#   "status": "otp_sent",
#   "message": "OTP sent to phone. Verify to complete enrollment.",
#   "phone": "+1234567890"
# }

# Verify OTP
curl -X POST https://protega-api.fly.dev/verify-otp \
  -d '{
    "phone": "+1234567890",
    "code": "123456"
  }'

# Response: {"status": "enrolled", "user_id": 124, ...}
```

### High-Risk Enrollment (Requires KYC)

```bash
# Same fingerprint, different account
curl -X POST https://protega-api.fly.dev/enroll \
  -d '{
    "email": "fraud@example.com",
    "fingerprint_sample": "FINGERPRINT-001",  # Already used
    ...
  }'

# Response: {
#   "status": "requires_kyc",
#   "message": "Enrollment flagged for KYC/manual review."
# }
```

### Admin Review

```bash
# List flagged enrollments
curl https://protega-api.fly.dev/admin/flagged

# Approve a flagged enrollment
curl -X POST https://protega-api.fly.dev/admin/flagged/1/resolve \
  -d '{"type": "approve"}'

# Deny a flagged enrollment
curl -X POST https://protega-api.fly.dev/admin/flagged/1/resolve \
  -d '{"type": "deny"}'

# Merge into existing identity
curl -X POST https://protega-api.fly.dev/admin/flagged/1/resolve \
  -d '{"type": "merge", "target_protega_id": 123}'
```

## Configuration Options

### Device Tracking (Analytics Only)

**No enrollment limits are enforced.** Device and IP tracking is for analytics and fraud pattern detection only. All enrollments are allowed.

### Adjust Risk Thresholds

Make the system more or less strict:

```bash
# Very strict - OTP required for low-risk scenarios
PROTEGA_RISK_OTP_THRESHOLD=20

# Balanced (default)
PROTEGA_RISK_OTP_THRESHOLD=30

# Permissive - fewer OTP challenges
PROTEGA_RISK_OTP_THRESHOLD=40
```

### Real-World Examples

**All Merchants:**
```bash
PROTEGA_RISK_OTP_THRESHOLD=30
PROTEGA_RISK_KYC_THRESHOLD=60
```
- Unlimited enrollments allowed
- OTP only for suspicious activity (card reuse, duplicate fingerprints)
- Manual review for high-risk scenarios

## Testing

```bash
# Normal enrollment with all data provided
curl -X POST http://localhost:8000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "fingerprint_sample": "TEST-FP-001",
    "consent_text": "I consent to Protega CloudPay storing my biometric data",
    "stripe_payment_method_token": "pm_card_visa",
    "phone_number": "+1234567890",
    "device_id": "TERMINAL-001"
  }'
```

### 2. Test Device Velocity

```bash
# Send 4 enrollments from same device (limit is 3)
for i in {1..4}; do
  curl -X POST http://localhost:8000/enroll \
    -d "{\"email\": \"user$i@example.com\", \"device_id\": \"TERMINAL-001\", ...}"
done

# 4th enrollment should be flagged
```

### 3. Test Card Reuse

```bash
# First enrollment with card
curl -X POST http://localhost:8000/enroll \
  -d '{"stripe_payment_method_token": "pm_card_visa", ...}'

# Second enrollment with same card (different email)
curl -X POST http://localhost:8000/enroll \
  -d '{"email": "other@example.com", "stripe_payment_method_token": "pm_card_visa", ...}'

# Should require OTP or be flagged
```

### 4. Test OTP Flow

```bash
# Trigger OTP (medium risk enrollment)
curl -X POST http://localhost:8000/enroll \
  -d '{"phone_number": "+1234567890", ...}'

# Check console for OTP code (dev mode)
# Or check SMS (production mode)

# Verify OTP
curl -X POST http://localhost:8000/verify-otp \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

## Development Notes

### OTP Storage
- **Development**: In-memory dictionary `OTP_STORE`
- **Production**: Should use Redis or database with TTL
- OTPs expire after 5 minutes

### Twilio Integration
- Works without Twilio in dev mode (prints OTP to console)
- To enable production SMS, set:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`

### Risk Scoring Tuning
- Default thresholds are conservative
- Adjust via environment variables:
  - Lower `RISK_OTP_THRESHOLD` for more OTP challenges
  - Higher `RISK_KYC_THRESHOLD` for fewer manual reviews

## Production Checklist

- [ ] Set Twilio credentials in environment
- [ ] Replace in-memory OTP store with Redis/Database
- [ ] Implement real admin authentication
- [ ] Set up monitoring/alerts for flagged enrollments
- [ ] Configure retention policy for flagged enrollments
- [ ] Review and tune risk thresholds
- [ ] Test OTP delivery (Twilio or alternative)
- [ ] Set up admin dashboard for reviewing flags

## Security Considerations

1. **Card Fingerprints**: Securely stored, indexed for fast lookups
2. **Phone Numbers**: Stored as-is, consider encryption for production
3. **IP Addresses**: Used for velocity checks, consider GDPR compliance
4. **OTP Security**: Short expiration, single-use (implementation needed in production)
5. **Admin Access**: Currently no authentication - must be added for production

## Known Limitations

1. In-memory OTP store (not persistent across restarts)
2. No admin authentication on review endpoints
3. Fingerprint salt not stored with flagged enrollments (needs fix)
4. No biometric similarity matching (only exact hash comparison)

## Future Enhancements

1. Redis integration for OTP storage
2. Admin JWT authentication
3. Real-time dashboard for flagged enrollments
4. SMS provider abstraction (Twilio, Vonage, etc.)
5. Advanced biometric similarity matching
6. Machine learning for risk scoring
7. Fraud analytics and reporting

