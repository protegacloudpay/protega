# 🚀 Vercel Clean Setup for Protega

## Issue
The deployment was linked to the wrong Vercel account (mypcpclinic). Protega needs its own separate Vercel account and project.

---

## ✅ Solution: Fresh Vercel Setup

### Step 1: Verify You're Logged Into Correct Account

```bash
cd /Users/mjrodriguez/Desktop/Protega/frontend
vercel whoami
```

**Expected output:**
```
> protegacloudpay
```

**If you see a different account:**
```bash
vercel logout
vercel login
# Enter protegacloudpay email when prompted
```

---

### Step 2: Create New Vercel Project (Clean Slate)

```bash
cd /Users/mjrodriguez/Desktop/Protega/frontend
vercel --prod --yes
```

**During setup, answer:**
- **Set up and deploy?** → `Y`
- **Which scope?** → Select `protegacloudpay` (your Protega account)
- **Link to existing project?** → `N` (create new)
- **What's your project's name?** → `protega-cloudpay`
- **In which directory?** → `.` (current directory)
- **Want to override settings?** → `N` (use defaults)

---

### Step 3: Verify Deployment

After deployment completes, you should see:
```
✅ Production: https://protega-cloudpay.vercel.app
```

**Or:**
```
✅ Production: https://protega-cloudpay-protegacloudpay.vercel.app
```

**No more "mypcp" or "mypcpclinic" in the URL!**

---

## 🔐 Verify Account Separation

### Check Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Make sure you're signed in as **protegacloudpay**
3. You should see **protega-cloudpay** project
4. **Should NOT see** any mypcpclinic projects

### If you see mypcpclinic projects:
- You're in the wrong account
- Click your profile → Switch Account → protegacloudpay

---

## 🎯 Custom Domain (Optional but Recommended)

Once deployed to the correct account:

### Option 1: Vercel Subdomain
```
protega-cloudpay.vercel.app
```
- Free
- Works immediately
- Professional enough for pilot

### Option 2: Custom Domain (Recommended for Production)
```
app.protegacloudpay.com
```

**Setup:**
1. Buy domain: protegacloudpay.com ($12/year)
2. In Vercel dashboard → Settings → Domains
3. Add domain: app.protegacloudpay.com
4. Follow DNS instructions
5. Done!

---

## 🔄 Environment Variables

After deployment, set environment variables in Vercel dashboard:

1. Go to: https://vercel.com/protegacloudpay/protega-cloudpay/settings/environment-variables

2. Add these variables:

```
NEXT_PUBLIC_API_URL=https://protega-api.fly.dev
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Q...
```

**Important:** These are SEPARATE from any other projects!

---

## 📱 Update Backend CORS

After you get your new Vercel URL, update backend to allow it:

```bash
# On Fly.io
cd /Users/mjrodriguez/Desktop/Protega/backend
flyctl secrets set FRONTEND_URL=https://protega-cloudpay.vercel.app -a protega-api
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Vercel URL does NOT contain "mypcp" or "mypcpclinic"
- [ ] Vercel dashboard shows only Protega projects
- [ ] You're logged in as protegacloudpay
- [ ] Environment variables are set correctly
- [ ] Backend CORS allows new frontend URL
- [ ] Test enrollment page works
- [ ] Test payment flow works

---

## 🚨 Common Issues

### Issue 1: Still seeing mypcpclinic in URL

**Solution:**
```bash
cd /Users/mjrodriguez/Desktop/Protega/frontend
rm -rf .vercel
vercel logout
vercel login
# Login with protegacloudpay email
vercel --prod --yes
```

### Issue 2: "Access Required" message

**Solution:**
- You're in the wrong Vercel account
- Click profile → Sign out
- Sign in with protegacloudpay account
- Try deployment again

### Issue 3: Multiple Vercel accounts with same email

**Solution:**
- Each account needs a unique email
- Create separate email for Protega: protegacloudpay@gmail.com
- Or use GitHub login with protegacloudpay GitHub account

---

## 📊 Account Structure (Best Practice)

```
Protega Account (protegacloudpay)
├── protega-cloudpay (frontend)
│   └── Production: protega-cloudpay.vercel.app
└── Environment Variables
    ├── NEXT_PUBLIC_API_URL
    └── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

Separate Account (mypcpclinic)
├── (other projects)
└── (completely separate)
```

**NO mixing of projects between accounts!**

---

## 🎯 Quick Fix Commands

### Clean slate deployment:
```bash
cd /Users/mjrodriguez/Desktop/Protega/frontend
rm -rf .vercel
vercel logout
vercel login
vercel --prod --yes
```

### Check current account:
```bash
vercel whoami
```

### List all projects:
```bash
vercel list
```

### Switch Vercel account:
```bash
vercel logout
vercel login
```

---

## 📞 Need Help?

If you're still seeing mypcpclinic:

1. **Double-check Vercel account:**
   - Go to https://vercel.com
   - Click profile icon (top right)
   - Verify it says "protegacloudpay"

2. **Create fresh account if needed:**
   - Sign out completely
   - Create NEW Vercel account
   - Use protegacloudpay email
   - Deploy fresh

3. **Contact Vercel support:**
   - Help → Support
   - "Need to separate projects between accounts"

---

## ✅ After Clean Deployment

Once you get the correct URL (without mypcpclinic):

1. **Update all documentation:**
   - Replace old URLs with new one
   - Update PILOT_READY.md
   - Update README.md

2. **Update backend:**
   - Set FRONTEND_URL on Fly.io
   - Test CORS

3. **Test everything:**
   - Enrollment page
   - Payment flow
   - Merchant dashboard

4. **Share with pilot merchants:**
   - Give them the CORRECT URL
   - No confusion with other projects

---

**Your Protega deployment should be 100% separate from any other projects!**


