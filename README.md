# Protega CloudPay

**Device-free biometric payments** — Pay with your fingerprint, no phone or card needed.

## 🏗️ Architecture

This is a working prototype with:
- **Backend**: FastAPI + PostgreSQL + Stripe (test mode)
- **Frontend**: Next.js + TypeScript + TailwindCSS
- **Biometrics**: Salted template hashing (PBKDF2) with simulated hardware adapter
- **Deployment**: Docker Compose for local development

## 🔐 Security

- **No raw fingerprints stored** — Only salted, irreversible template hashes (PBKDF2-HMAC-SHA256, 200k iterations)
- **Per-record random salts** — Prevents rainbow table attacks
- **JWT-based merchant authentication**
- **Stripe test mode** — Safe for development

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Stripe test account ([stripe.com](https://stripe.com))

### Setup

1. **Clone and configure environment**:
```bash
cd protega-cloudpay
cp .env.example .env
cp frontend/.env.example frontend/.env
```

2. **Add your Stripe test keys** to `.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
JWT_SECRET=your_super_secret_jwt_key_change_this
```

3. **Start all services**:
```bash
docker compose up --build
```

Wait for all services to be healthy (may take 1-2 minutes on first run).

4. **Access the application**:
- 🌐 Web UI: http://localhost:3000
- 📚 API Docs: http://localhost:8000/docs
- 🗄️ Database: localhost:5432

## 📖 Demo Walkthrough

### Step 1: Create a Merchant Account

Go to http://localhost:8000/docs and use the Swagger UI:

1. POST `/merchant/signup`:
```json
{
  "name": "Demo Coffee Shop",
  "email": "cafe@example.com",
  "password": "test1234"
}
```

2. Copy the `terminal_api_key` from the response (you'll need this for payments)

### Step 2: Enroll a Customer

Visit http://localhost:3000/enroll and fill in:

- **Email**: `customer@example.com`
- **Full Name**: `Jane Doe`
- **Fingerprint Sample**: `DEMO-FINGER-001` (save this exact string!)
- **Consent**: Check the box
- **Stripe Test PM Token**: `pm_card_visa`

Click "Enroll" — you should see success with masked email and card last4.

> 💡 **Important**: Remember your fingerprint sample string! You'll need the EXACT same string to make payments.

### Step 3: Make a Payment

Visit http://localhost:3000/kiosk:

- **Terminal API Key**: (paste from Step 1)
- **Fingerprint Sample**: `DEMO-FINGER-001` (must match enrollment!)
- **Amount**: `2000` (= $20.00)

Click "Process Payment" — you should see a big green "Transaction Approved" banner!

### Step 4: View Transaction History

1. Visit http://localhost:3000/merchant/login
2. Login with `cafe@example.com` / `test1234`
3. You'll be redirected to the dashboard showing your transaction

## 🧪 Test Data

### Stripe Test Payment Methods

Use these in the enrollment form:
- `pm_card_visa` — Visa (succeeds)
- `pm_card_mastercard` — Mastercard (succeeds)
- `pm_card_chargeDeclined` — Declined card

See more at [Stripe Testing Docs](https://stripe.com/docs/testing)

### Sample Fingerprints

For demo purposes, use consistent strings:
- `DEMO-FINGER-001`
- `DEMO-FINGER-002`
- `DEMO-FINGER-USER-ALICE`

The system will hash these consistently. In production, these would be real biometric templates from hardware.

## 🏗️ Project Structure

```
protega-cloudpay/
├── backend/                    # FastAPI application
│   ├── protega_api/
│   │   ├── adapters/          # Hardware, hashing, payments
│   │   ├── routers/           # API endpoints
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── security.py        # Auth & crypto
│   │   └── main.py            # FastAPI app
│   ├── alembic/               # Database migrations
│   └── pyproject.toml
├── frontend/                   # Next.js application
│   └── src/
│       ├── pages/             # Route pages
│       ├── lib/               # API & auth helpers
│       └── styles/
├── docker-compose.yml
└── .env.example
```

## 🔌 Hardware Integration (Future)

The current `SimulatedHardwareAdapter` is a placeholder. To integrate real fingerprint readers:

1. **Supported SDKs**: DigitalPersona U.are.U, Futronic, ZKTeco, etc.
2. **Integration point**: `backend/protega_api/adapters/hardware.py`
3. **Process**:
   - Capture raw template from SDK (bytes)
   - Normalize to deterministic string representation
   - Pass to existing hashing layer (already implemented)

See detailed TODOs in `hardware.py` for the integration contract.

## 🛠️ Development

### Run backend only:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -e .
uvicorn protega_api.main:app --reload
```

### Run frontend only:
```bash
cd frontend
npm install
npm run dev
```

### Database migrations:
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Seed test data:
```bash
docker compose exec api python -m protega_api.seed
```

## 🔒 Security Considerations

### ✅ What's Implemented

- Salted template hashing with PBKDF2 (200k iterations)
- No raw biometric data storage
- JWT-based merchant authentication
- Password hashing with bcrypt
- Stripe PCI-compliant payment handling

### ⚠️ Production Readiness Checklist

Before production deployment:

- [ ] Replace `SimulatedHardwareAdapter` with real SDK
- [ ] Enable HTTPS/TLS everywhere
- [ ] Use production Stripe keys
- [ ] Add rate limiting (enrollment, payments)
- [ ] Implement audit logging
- [ ] Add fraud detection rules
- [ ] Comply with biometric data regulations (GDPR, CCPA, BIPA)
- [ ] Security audit & penetration testing
- [ ] Add monitoring and alerting
- [ ] Implement backup and disaster recovery
- [ ] Add webhook verification for Stripe events

## 📝 API Documentation

Full interactive API docs available at http://localhost:8000/docs when running.

### Key Endpoints

- `POST /enroll` — Register user + biometric + payment method
- `POST /pay` — Process biometric payment
- `POST /merchant/signup` — Create merchant account
- `POST /merchant/login` — Merchant authentication
- `GET /merchant/transactions` — View transaction history

## 🧪 Running Tests

```bash
# Backend tests (TODO)
cd backend
pytest

# Frontend tests (TODO)
cd frontend
npm test
```

## 📄 License

This is a prototype for evaluation purposes. Not licensed for production use.

## 🤝 Support

For questions or issues, contact the development team.

---

**Built with ❤️ for secure, convenient payments**

