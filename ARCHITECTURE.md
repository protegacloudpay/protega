# Protega CloudPay - Architecture Documentation

## System Overview

Protega CloudPay is a biometric payment system enabling device-free authentication using fingerprint scanning. Users enroll once, then can make payments at any terminal without carrying a phone, wallet, or card.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 ENROLLMENT (once)           🏪 PAYMENT (recurring)          │
│  ┌───────────────┐              ┌───────────────┐              │
│  │ Scan finger   │              │ Scan finger   │              │
│  │ + Link card   │              │ at terminal   │              │
│  └───────┬───────┘              └───────┬───────┘              │
│          │                              │                      │
│          v                              v                      │
└──────────┼──────────────────────────────┼──────────────────────┘
           │                              │
           │                              │
┌──────────┼──────────────────────────────┼──────────────────────┐
│          │      PRESENTATION LAYER      │                      │
├──────────┼──────────────────────────────┼──────────────────────┤
│          │                              │                      │
│    ┌─────▼────────┐             ┌──────▼──────┐               │
│    │              │             │             │               │
│    │  /enroll     │             │  /kiosk     │               │
│    │  Page        │             │  Page       │               │
│    │              │             │             │               │
│    │  Next.js     │             │  Next.js    │               │
│    │  React       │             │  React      │               │
│    │  TailwindCSS │             │  TailwindCSS│               │
│    │              │             │             │               │
│    └─────┬────────┘             └──────┬──────┘               │
│          │                             │                      │
│          │  HTTP POST                  │  HTTP POST           │
│          │  /enroll                    │  /pay                │
│          │                             │                      │
└──────────┼─────────────────────────────┼──────────────────────┘
           │                             │
           │                             │
┌──────────┼─────────────────────────────┼──────────────────────┐
│          │       API LAYER (FastAPI)   │                      │
├──────────┼─────────────────────────────┼──────────────────────┤
│          │                             │                      │
│    ┌─────▼────────┐             ┌──────▼──────┐               │
│    │              │             │             │               │
│    │  POST        │             │  POST       │               │
│    │  /enroll     │             │  /pay       │               │
│    │              │             │             │               │
│    │  Router      │             │  Router     │               │
│    │              │             │             │               │
│    └─────┬────────┘             └──────┬──────┘               │
│          │                             │                      │
│          │                             │                      │
│          v                             v                      │
│  ┌───────────────────────────────────────────────┐            │
│  │         ADAPTER LAYER                         │            │
│  ├───────────────────────────────────────────────┤            │
│  │                                               │            │
│  │  ┌──────────────┐  ┌──────────────┐          │            │
│  │  │ Hardware     │  │ Hashing      │          │            │
│  │  │ Adapter      │  │ Adapter      │          │            │
│  │  │              │  │              │          │            │
│  │  │ Normalize    │──│ PBKDF2-HMAC  │          │            │
│  │  │ template     │  │ SHA256       │          │            │
│  │  │              │  │ 200k iter    │          │            │
│  │  └──────────────┘  └──────────────┘          │            │
│  │                                               │            │
│  │  ┌──────────────┐                            │            │
│  │  │ Payments     │                            │            │
│  │  │ Adapter      │                            │            │
│  │  │              │                            │            │
│  │  │ Stripe SDK   │                            │            │
│  │  │              │                            │            │
│  │  └──────────────┘                            │            │
│  │                                               │            │
│  └───────────────────────────────────────────────┘            │
│                        │                                      │
│                        v                                      │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │
┌────────────────────────┼──────────────────────────────────────┐
│         DATA LAYER (PostgreSQL)                               │
├────────────────────────┼──────────────────────────────────────┤
│                        │                                      │
│    ┌───────────────────▼──────────────────┐                  │
│    │                                       │                  │
│    │  ┌─────────────┐  ┌─────────────┐   │                  │
│    │  │ Users       │  │ Biometric   │   │                  │
│    │  │             │  │ Templates   │   │                  │
│    │  │ - id        │  │             │   │                  │
│    │  │ - email     │  │ - hash      │   │                  │
│    │  │ - name      │  │ - salt      │   │                  │
│    │  │ - stripe_id │  │ - user_id   │   │                  │
│    │  └─────────────┘  └─────────────┘   │                  │
│    │                                       │                  │
│    │  ┌─────────────┐  ┌─────────────┐   │                  │
│    │  │ Payment     │  │ Merchants   │   │                  │
│    │  │ Methods     │  │             │   │                  │
│    │  │             │  │ - id        │   │                  │
│    │  │ - pm_id     │  │ - email     │   │                  │
│    │  │ - brand     │  │ - name      │   │                  │
│    │  │ - last4     │  │ - password  │   │                  │
│    │  │ - user_id   │  │             │   │                  │
│    │  └─────────────┘  └─────────────┘   │                  │
│    │                                       │                  │
│    │  ┌─────────────┐  ┌─────────────┐   │                  │
│    │  │ Terminals   │  │ Transactions│   │                  │
│    │  │             │  │             │   │                  │
│    │  │ - id        │  │ - id        │   │                  │
│    │  │ - api_key   │  │ - amount    │   │                  │
│    │  │ - merchant  │  │ - status    │   │                  │
│    │  │ - label     │  │ - merchant  │   │                  │
│    │  │             │  │ - user      │   │                  │
│    │  └─────────────┘  └─────────────┘   │                  │
│    │                                       │                  │
│    └───────────────────────────────────────┘                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                         │
                         │
┌────────────────────────┼──────────────────────────────────────┐
│      EXTERNAL SERVICES │                                      │
├────────────────────────┼──────────────────────────────────────┤
│                        │                                      │
│              ┌─────────▼─────────┐                            │
│              │                   │                            │
│              │   Stripe API      │                            │
│              │                   │                            │
│              │   - Customers     │                            │
│              │   - PaymentMethods│                            │
│              │   - PaymentIntents│                            │
│              │                   │                            │
│              └───────────────────┘                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Security Architecture

### Biometric Data Flow

```
Raw Fingerprint
      ↓
[Hardware Adapter] ← SWAP POINT for real SDK
      ↓
Normalized Template String
      ↓
[Random 16-byte Salt Generated]
      ↓
[PBKDF2-HMAC-SHA256 200k iterations]
      ↓
Irreversible Hash (stored)

❌ Raw fingerprint NEVER stored
✅ Only salted hash persisted
✅ Cannot reverse to original
```

### Payment Authentication Flow

```
1. Terminal receives fingerprint scan
2. Normalize via Hardware Adapter
3. Retrieve all active biometric templates
4. For each template:
   - Hash input with stored salt
   - Compare with stored hash
5. On match:
   - Retrieve user's payment method
   - Call Stripe PaymentIntent API
   - Record transaction
6. Return result to terminal
```

## Technology Stack

### Backend
- **Framework**: FastAPI 0.109+
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0+
- **Migrations**: Alembic
- **Security**: 
  - Passlib (bcrypt) for passwords
  - python-jose for JWT
  - PBKDF2 for biometric hashing
- **Payments**: Stripe SDK 6.x

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript 5.3+
- **Styling**: TailwindCSS 3.4+
- **State**: React Hooks

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Reverse Proxy**: (Production: Nginx/Caddy)
- **Database**: PostgreSQL with connection pooling

## Data Models

### Core Entities

**User**
```python
- id: Primary Key
- email: Unique, indexed
- full_name: String
- stripe_customer_id: Unique, indexed
- created_at: Timestamp
```

**BiometricTemplate**
```python
- id: Primary Key
- user_id: Foreign Key → User
- template_hash: 128-char hex (PBKDF2 output)
- salt: 64-char hex (random salt)
- active: Boolean (for revocation)
- created_at: Timestamp
- INDEX: (user_id, active)
```

**Merchant**
```python
- id: Primary Key
- email: Unique, indexed
- password_hash: Bcrypt hash
- name: String
- created_at: Timestamp
```

**Terminal**
```python
- id: Primary Key
- merchant_id: Foreign Key → Merchant
- label: String
- api_key: Unique, 32-byte random
- created_at: Timestamp
```

**Transaction**
```python
- id: Primary Key
- merchant_id: Foreign Key → Merchant
- user_id: Foreign Key → User (nullable)
- amount_cents: Integer
- currency: String (ISO 4217)
- status: Enum (succeeded, failed)
- processor_txn_id: Stripe PaymentIntent ID
- merchant_ref: Optional reference
- created_at: Timestamp, indexed
- INDEX: (merchant_id, created_at)
```

## API Endpoints

### Public Endpoints

**POST /enroll**
- Enroll user with biometric + payment method
- Creates: User, BiometricTemplate, PaymentMethod, Consent
- Returns: Masked email, card details

**POST /pay**
- Process biometric payment
- Auth: Terminal API Key
- Matches: Biometric → User → PaymentMethod
- Creates: Transaction
- Returns: Status + transaction ID

### Merchant Endpoints

**POST /merchant/signup**
- Create merchant account
- Creates: Merchant, Terminal
- Returns: JWT + terminal API key

**POST /merchant/login**
- Authenticate merchant
- Returns: JWT token

**GET /merchant/transactions**
- List transactions
- Auth: JWT Bearer token
- Returns: Transaction list with user details

### Health Check

**GET /healthz**
- Service health status
- No auth required

## Security Considerations

### Authentication
- **Merchants**: JWT with 30-day expiration
- **Terminals**: API key authentication
- **Users**: Biometric-only (no passwords)

### Authorization
- Terminals scoped to merchant
- Transactions isolated per merchant
- Users can only access their own data

### Biometric Security
- **Hashing**: PBKDF2-HMAC-SHA256
- **Iterations**: 200,000 (OWASP recommended)
- **Salt**: 16 bytes random per template
- **Storage**: Only hash + salt, never raw

### Payment Security
- Stripe handles all card data (PCI DSS compliant)
- Payment methods attached to Stripe customer
- No card numbers stored in database
- Test mode enforced in this prototype

### Data Protection
- Passwords: Bcrypt with salt rounds
- JWTs: HMAC-SHA256 signed
- Database: Parameterized queries (SQLAlchemy ORM)
- CORS: Restricted to localhost in dev

## Scalability Considerations

### Current Prototype Limitations
- Linear biometric matching (O(n) templates)
- Single database instance
- No caching layer
- Synchronous payment processing

### Production Optimizations
1. **Biometric Matching**
   - Index biometric feature vectors
   - Use approximate nearest neighbor search
   - Cache active templates in memory

2. **Database**
   - Read replicas for transaction queries
   - Connection pooling (already configured)
   - Partition transactions by date

3. **Caching**
   - Redis for terminal API key validation
   - Cache merchant/terminal relationships
   - Session storage for web

4. **Async Processing**
   - Queue payment processing (Celery/RQ)
   - Webhook handling for Stripe events
   - Background fraud detection

5. **High Availability**
   - Load balancer across API instances
   - Database replication (primary/replica)
   - CDN for frontend assets

## Hardware Integration Points

### Current: Simulated Adapter
```python
class SimulatedHardwareAdapter:
    def to_template_input(sample: str) -> str:
        return sample.strip().upper()
```

### Production: Real SDK
```python
class DigitalPersonaAdapter:
    def __init__(self):
        self.sdk = dpfpdd  # DigitalPersona SDK
    
    def to_template_input(self, raw_bytes: bytes) -> str:
        # 1. Parse FMD (Fingerprint Minutiae Data)
        # 2. Extract stable feature points
        # 3. Normalize to deterministic format
        # 4. Encode as stable string (hex/base64)
        return normalized_template
```

### Supported SDKs
- **DigitalPersona U.are.U**: FMD extraction
- **Futronic**: ANSI 378 templates
- **ZKTeco**: ZKFinger SDK
- **Suprema**: BioStar templates

## Deployment Architecture

### Development (Current)
```
Docker Compose
├── db (PostgreSQL)
├── api (FastAPI)
└── web (Next.js dev server)
```

### Production (Recommended)
```
Load Balancer (Caddy/Nginx)
    ├── Frontend (Vercel/Static CDN)
    ├── API Cluster (3+ instances)
    ├── PostgreSQL (Primary + Replicas)
    ├── Redis (Caching)
    └── Stripe (External SaaS)
```

## Monitoring & Observability

### Recommended Tools
- **Logging**: Structured JSON logs (already implemented)
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Alerts**: PagerDuty/Opsgenie
- **Error Tracking**: Sentry

### Key Metrics to Monitor
- Biometric match success rate
- Payment approval rate
- API response times
- Database query performance
- Stripe API errors
- Failed authentication attempts

## Compliance & Regulations

### Biometric Data Laws
- **GDPR** (EU): Explicit consent, right to deletion
- **CCPA** (California): Consumer data rights
- **BIPA** (Illinois): Biometric privacy act
- **HIPAA** (if healthcare): PHI protections

### Payment Compliance
- **PCI DSS**: Use Stripe (compliant processor)
- **Strong Customer Authentication** (EU): 3DS support
- **AML/KYC**: Know Your Customer checks

### Data Retention
- Biometric templates: User-controlled deletion
- Transaction records: 7 years (financial)
- Audit logs: Immutable, long-term storage

## Future Enhancements

### Phase 1 (Months 1-3)
- [ ] Real fingerprint scanner integration
- [ ] Multi-factor authentication option
- [ ] Transaction limits and fraud rules
- [ ] Webhook support for Stripe events

### Phase 2 (Months 4-6)
- [ ] Mobile app for enrollment
- [ ] Support for multiple payment methods
- [ ] Refund processing
- [ ] Advanced merchant analytics

### Phase 3 (Months 7-12)
- [ ] Multi-biometric support (face, iris)
- [ ] International currency support
- [ ] Merchant API for custom integrations
- [ ] White-label solution

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NIST Biometric Standards](https://www.nist.gov/itl/iad/image-group/biometric-standards-activities)

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Maintainer**: Protega Development Team

