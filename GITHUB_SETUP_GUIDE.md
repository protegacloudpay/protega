# 🚀 GitHub Setup for Protega CloudPay

**Quick guide to create repository and deploy**

---

## ⚡ OPTION 1: Quick Setup (5 minutes)

### Step 1: Create GitHub Account (2 minutes)

1. **Go to:** https://github.com/signup
2. **Enter:**
   - Email address
   - Password
   - Username (e.g., `protega-cloudpay` or your name)
3. **Verify email**
4. **Done!** You have a GitHub account

### Step 2: Create Repository (2 minutes)

1. **Login to GitHub**
2. **Click the "+" icon** (top right) → "New repository"
3. **Fill in:**
   ```
   Repository name: protega-cloudpay
   Description: Device-free biometric payment system
   Public ✓ (or Private if you prefer)
   ☐ DON'T initialize with README (we have code already)
   ```
4. **Click "Create repository"**

### Step 3: Push Your Code (1 minute)

```bash
# Navigate to your project
cd /Users/mjrodriguez/Desktop/Protega

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create .gitignore to exclude sensitive files
cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
*.env

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/

# Node
node_modules/
.next/
out/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite
postgres_data/

# Logs
*.log
logs/
EOF

# Commit your code
git commit -m "Initial commit - Protega CloudPay with markup fee"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/protega-cloudpay.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**If you get authentication error:**
```bash
# GitHub no longer accepts passwords
# You need to create a Personal Access Token

# Go to: https://github.com/settings/tokens
# Click "Generate new token (classic)"
# Select scopes: repo (all), workflow
# Copy the token
# Use it as password when pushing
```

---

## 🔑 GitHub Authentication Options

### Option A: Personal Access Token (Recommended for now)

1. **Go to:** https://github.com/settings/tokens
2. **Click:** "Generate new token (classic)"
3. **Name it:** "Protega CloudPay Deploy"
4. **Select scopes:**
   - ✓ repo (all checkboxes)
   - ✓ workflow
5. **Click:** "Generate token"
6. **Copy the token** (you won't see it again!)
7. **Use it as password when pushing:**
   ```bash
   Username: YOUR_GITHUB_USERNAME
   Password: ghp_xxxxxxxxxxxxxxxxxxxx (your token)
   ```

### Option B: SSH Keys (Better for long-term)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter for all prompts

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub:
# 1. Go to https://github.com/settings/keys
# 2. Click "New SSH key"
# 3. Paste your key
# 4. Save

# Test connection
ssh -T git@github.com

# Use SSH URL instead:
git remote set-url origin git@github.com:YOUR_USERNAME/protega-cloudpay.git
git push -u origin main
```

---

## ✅ Verify Your Repository

After pushing, go to:
```
https://github.com/YOUR_USERNAME/protega-cloudpay
```

You should see all your files!

---

## 🚀 NOW DEPLOY!

### 1. Deploy Backend to Railway

**Go to:** https://railway.app

1. **Sign up** (use GitHub to login - easiest!)
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Authorize Railway** to access your repos
5. **Select:** `protega-cloudpay`
6. **Railway will auto-detect** your Dockerfile
7. **Add PostgreSQL:**
   - Click "New" → "Database" → "PostgreSQL"
8. **Add Environment Variables:**
   ```
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   JWT_SECRET=<generate-random-string>
   ENV=production
   FRONTEND_URL=https://protega-app.vercel.app
   ```
9. **Deploy!**
10. **Generate domain:** Settings → Networking → Generate Domain
11. **Your API URL:** `https://protega-cloudpay-production.up.railway.app`

### 2. Deploy Frontend to Vercel

**Go to:** https://vercel.com

1. **Sign up** (use GitHub to login - easiest!)
2. **Click "Add New..." → "Project"**
3. **Import Git Repository:**
   - Select `protega-cloudpay`
4. **Configure:**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   ```
5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
   ```
6. **Deploy!**
7. **Your Frontend URL:** `https://protega-cloudpay.vercel.app`

### 3. Update CORS

1. **Go back to Railway**
2. **Update environment variable:**
   ```
   FRONTEND_URL=https://protega-cloudpay.vercel.app
   ```
3. **Redeploy** (automatic)

### 4. Test!

```bash
# Test API
curl https://your-railway-url.up.railway.app/

# Test Frontend
# Open in browser: https://protega-cloudpay.vercel.app
```

**Done! You're live! 🎉**

---

## 🔧 Troubleshooting

### Error: "Permission denied (publickey)"

**You need authentication. Use Personal Access Token:**
```bash
# When pushing:
Username: your-github-username
Password: ghp_xxxxxxxxxxxx (your token)
```

### Error: "Repository not found"

**Check the URL:**
```bash
# View your remote
git remote -v

# Update if wrong
git remote set-url origin https://github.com/YOUR_USERNAME/protega-cloudpay.git
```

### Error: "Failed to push some refs"

**Pull first (if repo has README):**
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## 📝 Complete Command Sequence

**Copy and paste this (replace YOUR_USERNAME):**

```bash
# Navigate to project
cd /Users/mjrodriguez/Desktop/Protega

# Initialize git
git init

# Create .gitignore (already shown above)

# Stage all files
git add .

# Commit
git commit -m "Initial commit - Protega CloudPay production ready"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/protega-cloudpay.git

# Push
git branch -M main
git push -u origin main

# Enter your GitHub username and Personal Access Token when prompted
```

---

## ⚡ Super Quick Alternative

**Use GitHub Desktop (GUI):**

1. **Download:** https://desktop.github.com/
2. **Install and sign in**
3. **File → Add Local Repository**
4. **Select:** `/Users/mjrodriguez/Desktop/Protega`
5. **Click "Publish repository"**
6. **Done!**

Then continue with Railway/Vercel deployment.

---

## 🎯 What You Need

1. ✅ **GitHub Account** (free) - https://github.com/signup
2. ✅ **Personal Access Token** - For pushing code
3. ✅ **Railway Account** (free tier) - https://railway.app
4. ✅ **Vercel Account** (free tier) - https://vercel.com
5. ✅ **Stripe Account** (free test mode) - https://stripe.com

**All are free to start!**

---

## 💡 Tips

### Keep .env files secure
```bash
# NEVER commit .env files
# They're already in .gitignore
# Good! ✓
```

### Update your code later
```bash
# After making changes:
git add .
git commit -m "Description of changes"
git push

# Railway and Vercel will auto-redeploy!
```

### Make repository private
```bash
# Go to GitHub repo
# Settings → Danger Zone → Change visibility → Make private
# Railway/Vercel will still have access
```

---

## ✅ Checklist

- [ ] Create GitHub account
- [ ] Create new repository `protega-cloudpay`
- [ ] Create Personal Access Token
- [ ] Initialize git in project folder
- [ ] Create .gitignore file
- [ ] Commit all files
- [ ] Add GitHub remote
- [ ] Push to GitHub
- [ ] Verify files on GitHub
- [ ] Deploy to Railway
- [ ] Deploy to Vercel
- [ ] Test production URLs
- [ ] 🎉 You're live!

---

## 🚀 Time Estimate

- GitHub setup: 5 minutes
- Push code: 2 minutes
- Railway deploy: 15 minutes
- Vercel deploy: 10 minutes
- **Total: ~30 minutes**

---

## 📞 Need Help?

**GitHub Issues:**
- Authentication: Use Personal Access Token
- Can't find repo: Check username in URL
- Push rejected: Pull first with `--allow-unrelated-histories`

**Still stuck?**
- GitHub Desktop (GUI): https://desktop.github.com/
- GitHub Docs: https://docs.github.com/en/get-started

---

**Ready to go live? Let's do it! 🚀**

