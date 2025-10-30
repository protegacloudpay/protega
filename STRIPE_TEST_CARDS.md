# Stripe Test Cards for Protega CloudPay

## ⚠️ Important
**Never use real card numbers in test mode!** Stripe will automatically decline them.

## ✅ Valid Test Cards

### Basic Test Card (Recommended)
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Declined Card (for testing failures)
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Requires Authentication (3D Secure)
```
Card Number: 4000 0027 6000 3184
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Insufficient Funds
```
Card Number: 4000 0000 0000 9995
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

## Complete List
Visit: https://stripe.com/docs/testing

## How to Use

### In Customer Enrollment Form:
1. Go to: https://protega.vercel.app/customer
2. Fill in your information
3. Click "Save Card"
4. Enter one of the test cards above:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: `12/25` (any future date)
   - **CVC**: `123` (any 3 digits)
   - **ZIP**: `12345` (any 5 digits)
5. Complete enrollment

### Test Tokens (Alternative)
If you want to skip the card form entirely, you can also use Stripe test payment method tokens directly in the API:

```bash
# Visa
pm_card_visa

# Mastercard
pm_card_mastercard

# Amex
pm_card_amex
```

But for the enrollment form, use the card numbers above.

## Common Errors

### "Your card was declined - testing with real card"
- **Problem**: Using a real card in test mode
- **Solution**: Use test cards listed above

### "Invalid API Key"
- **Problem**: Missing or incorrect Stripe key
- **Solution**: Already fixed - Stripe key is configured

### "Payment method token required"
- **Problem**: Not completing card entry
- **Solution**: Fill out the Stripe card form completely

## Security Note
⚠️ **Never share real card numbers or use them in test mode!**
- Test cards only work in Stripe test mode
- Real cards are automatically declined in test mode
- Always use Stripe test cards during development

