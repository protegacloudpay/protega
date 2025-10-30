# Fly.io Deployment Guide for Protega CloudPay

## ✅ Already Deployed
- **Backend**: https://protega-api.fly.dev
- **Region**: Miami (mia)
- **Status**: Production-ready

---

## 📋 Configuration Files

### 1. `backend/fly.toml`
```toml
app = "protega-api"
primary_region = "mia"
min_machines_running = 1
auto_stop_machines = false
health_check = "/health"
```

### 2. `backend/Dockerfile`
- Python 3.11-slim base image
- Optimized layer caching
- Uvicorn server on port 8000
- PostgreSQL client included

### 3. CORS Configuration
- ✅ Allows all Vercel deployments (`*.vercel.app`)
- ✅ Allows `https://protega.vercel.app`
- ✅ Allows localhost for development

---

## 🔑 Secrets Management

### Current Secrets
```bash
fly secrets list -a protega-api
```

### Required Secrets
- `DATABASE_URL` - Neon PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `JWT_SECRET` - JWT signing key
- `FRONTEND_URL` - Vercel frontend URL

### Add New Secrets
```bash
cd backend
fly secrets set NEW_KEY=value -a protega-api
```

---

## 🚀 Deployment Commands

### Deploy Backend
```bash
cd backend
fly deploy -a protega-api
```

### View Logs
```bash
fly logs -a protega-api
```

### SSH into Machine
```bash
fly ssh console -a protega-api
```

### Restart Services
```bash
fly apps restart protega-api
```

### Scale Resources
```bash
# Scale to 2 machines for high availability
fly scale count 2 -a protega-api

# View current scale
fly status -a protega-api
```

---

## 🧪 Health Check

### Test Endpoint
```bash
curl https://protega-api.fly.dev/healthz
```

### Expected Response
```json
{
  "status": "ok",
  "service": "Protega CloudPay API",
  "ok": true,
  "version": "2.0",
  "database": "connected"
}
```

### Test Biometric Login
```bash
curl -X POST https://protega-api.fly.dev/auth/biometric-login \
  -H "Content-Type: application/json" \
  -d '{"fingerprint_sample": "test123"}'
```

---

## 📊 Monitoring

### Metrics
```bash
fly metrics -a protega-api
```

### Machine Status
```bash
fly status -a protega-api
```

### App Info
```bash
fly info -a protega-api
```

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL secret
fly secrets list -a protega-api

# Verify SSL connection
fly ssh console -a protega-api -C "psql $DATABASE_URL -c 'SELECT 1'"
```

### Application Errors
```bash
# View logs
fly logs -a protega-api

# Restart app
fly apps restart protega-api

# SSH into machine to debug
fly ssh console -a protega-api
```

### CORS Issues
- Verify `FRONTEND_URL` secret matches Vercel deployment
- Check CORS middleware in `main.py`
- Test with browser DevTools Network tab

---

## 🌍 Environment Variables

### Production
- `ENV=production`
- `DATABASE_URL=postgresql://...`
- `STRIPE_SECRET_KEY=sk_live_...` (for live mode)

### Development
- `ENV=development`
- `STRIPE_SECRET_KEY=sk_test_...` (for test mode)

---

## 🎯 Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Backend API | ✅ Running | https://protega-api.fly.dev |
| Frontend | ✅ Running | https://protega.vercel.app |
| Database | ✅ Connected | Neon PostgreSQL |
| Health Check | ✅ OK | `/healthz` |
| Biometric Auth | ✅ Working | `/auth/biometric-login` |

---

## 📈 Performance

### Current Configuration
- **Machines**: 1 (can scale to 2+)
- **Region**: Miami (mia)
- **Concurrency**: 20-25 connections
- **Auto-scaling**: Disabled (manual control)

### Optimization Tips
1. Enable auto-scaling for traffic spikes
2. Use multiple regions for global distribution
3. Add CDN for static assets
4. Implement Redis cache for sessions

---

## 🔒 Security

### HTTPS
- ✅ Automatically enforced by Fly.io
- ✅ Force HTTPS enabled in `fly.toml`

### Secrets
- ✅ Stored in Fly secrets (encrypted)
- ✅ Never committed to git

### CORS
- ✅ Configured to allow only authorized origins
- ✅ Vercel deployments whitelisted

---

## 📚 Additional Resources

- [Fly.io Docs](https://fly.io/docs/)
- [FastAPI on Fly.io](https://fly.io/docs/languages-and-frameworks/python/)
- [Fly.io Secrets](https://fly.io/docs/reference/secrets/)
- [Fly.io Scaling](https://fly.io/docs/apps/scale-count/)

---

## ✅ Checklist

- [x] Fly.toml configured
- [x] Dockerfile optimized
- [x] Secrets set
- [x] CORS configured
- [x] Health check working
- [x] Database connected
- [x] Backend deployed
- [x] Frontend connected
- [x] Biometric auth working
- [ ] Auto-scaling enabled (optional)
- [ ] Multiple regions (optional)
- [ ] Redis cache (optional)

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Status**: Production-ready

