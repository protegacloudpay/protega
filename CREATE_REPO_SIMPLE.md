# 📦 Create GitHub Repo - Super Simple Guide

**Just follow these steps exactly. 2 minutes total.**

---

## STEP 1: Create GitHub Account (if you don't have one)

1. Go to: **https://github.com/signup**
2. Enter your email
3. Create a password
4. Choose a username
5. Verify email
6. Done!

---

## STEP 2: Create Repository (1 minute)

1. **Go to:** https://github.com/new

2. **Fill in ONLY these fields:**
   ```
   Repository name: protega-cloudpay
   ```

3. **Select:**
   - ⚪ Public (OR)
   - ⚪ Private (your choice)

4. **IMPORTANT: Leave these UNCHECKED:**
   - ☐ Add a README file
   - ☐ Add .gitignore
   - ☐ Choose a license

5. **Click:** Green "Create repository" button

6. **You'll see a page with commands. IGNORE IT. Close the tab.**

---

## STEP 3: Create Access Token (1 minute)

1. **Go to:** https://github.com/settings/tokens

2. **Click:** "Generate new token (classic)"

3. **Fill in:**
   ```
   Note: Protega Deploy
   Expiration: 90 days
   ```

4. **Check ONLY these boxes:**
   - ✅ repo (this will check all sub-boxes)
   - ✅ workflow

5. **Click:** Green "Generate token" button at bottom

6. **COPY THE TOKEN:** It looks like `ghp_xxxxxxxxxxxxxxxxxxxx`
   
   ⚠️ **SAVE IT SOMEWHERE** - You won't see it again!

---

## STEP 4: Done! Now Run This

**Copy and paste into Terminal:**

```bash
cd /Users/mjrodriguez/Desktop/Protega
./SETUP_GITHUB.sh
```

**When it asks:**
- `Username:` → Type your GitHub username
- Press Enter

**Then run:**
```bash
git push -u origin main
```

**When it asks:**
- `Username:` → Your GitHub username
- `Password:` → Paste your token (ghp_xxxxx)

---

## ✅ That's It!

Go to: `https://github.com/YOUR_USERNAME/protega-cloudpay`

You should see all your code!

---

## 🚀 Next: Deploy

Now follow `DEPLOY_NOW.md` for Railway + Vercel.

---

## ❓ Stuck?

**Can't find settings?**
- Click your profile picture (top right)
- Click "Settings"
- Scroll down left sidebar to "Developer settings"
- Click "Personal access tokens" → "Tokens (classic)"

**Token not working?**
- Make sure you checked "repo" and "workflow"
- Make sure you copied the ENTIRE token (starts with `ghp_`)
- Token is case-sensitive

**Username not found?**
- Your username is in your GitHub profile URL: `github.com/YOUR_USERNAME`

