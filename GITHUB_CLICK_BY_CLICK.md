# 🖱️ GitHub Setup - Click by Click

**I'll tell you EXACTLY what to click. Follow along!**

---

## 🎯 DO THIS FIRST

Open these 2 links in new tabs:

1. **https://github.com/new** ← Create repo here
2. **https://github.com/settings/tokens** ← Create token here

Keep this guide open too!

---

## 📦 TAB 1: Create Repository

**You're at: https://github.com/new**

### What you see:

```
Create a new repository

Repository name *
[                    ]

Description (optional)
[                    ]

⚪ Public
⚪ Private

☐ Add a README file
☐ Add .gitignore
☐ Choose a license

[Create repository]
```

### What to do:

1. **Click in "Repository name" box**
2. **Type:** `protega-cloudpay`
3. **Click:** Public (or Private - your choice)
4. **IMPORTANT:** Leave all checkboxes EMPTY (☐ not ☑)
5. **Click:** Green "Create repository" button

### After clicking:

You'll see a page with code. **IGNORE IT. Keep this tab open.**

---

## 🔑 TAB 2: Create Access Token

**You're at: https://github.com/settings/tokens**

### If you don't see "Personal access tokens":

1. Look for "Developer settings" in LEFT sidebar (scroll down)
2. Click "Developer settings"
3. Click "Personal access tokens"
4. Click "Tokens (classic)"

### What you see:

```
Personal access tokens (classic)

[Generate new token ▼]
```

### What to do:

1. **Click:** "Generate new token" dropdown
2. **Click:** "Generate new token (classic)"

### You might need to verify:

- Enter your password
- Or enter 2FA code
- Then continue...

### Fill in the form:

```
Note: [                    ]
Expiration: [90 days ▼]

Select scopes:
☐ repo
☐ workflow
☐ ...
```

### What to do:

1. **Click in "Note" box**
2. **Type:** `Protega`
3. **Click:** The checkbox next to "repo" (☑)
   - This will check all the boxes under it automatically
4. **Scroll down** and find "workflow"
5. **Click:** The checkbox next to "workflow" (☑)
6. **Scroll to bottom**
7. **Click:** Green "Generate token" button

### IMPORTANT - Copy your token:

You'll see:

```
ghp_xxxxxxxxxxxxxxxxxxxx

⚠️ Make sure to copy your personal access token now.
You won't be able to see it again!
```

**Click the copy icon** (📋) or select all and copy (Cmd+C)

**Paste it somewhere safe** (Notes app, TextEdit, anywhere!)

**DONE!** Keep the token handy.

---

## ✅ Now Run This Command

Open Terminal and run:

```bash
cd /Users/mjrodriguez/Desktop/Protega
./quick_push.sh
```

### It will ask you 3 things:

**1. GitHub username?**
```
Username: your-github-username
```
Type your username and press Enter

**2. Created the repo?**
```
Press Enter when done...
```
Press Enter (you did Tab 1 above!)

**3. Have the token?**
```
Press Enter when ready...
```
Press Enter

**4. Then it pushes:**
```
Username: your-github-username
Password: 
```

**Paste your token** (ghp_xxxxx) and press Enter

### Success looks like:

```
✅ SUCCESS! Code is on GitHub!

View your code at:
https://github.com/your-username/protega-cloudpay
```

---

## ❌ If Something Goes Wrong

### Error: "Repository not found"

**You didn't create the repo yet!**
- Go back to Tab 1 (https://github.com/new)
- Create the repo
- Run `./quick_push.sh` again

### Error: "Authentication failed"

**Wrong token or missing permissions!**
- Go back to Tab 2 (https://github.com/settings/tokens)
- Create a NEW token
- Make sure you check "repo" and "workflow"
- Copy the new token
- Run `./quick_push.sh` again

### Error: "Username not found"

**Wrong username!**
- Check your profile: click your icon (top right) → Your profile
- Look at the URL: `github.com/YOUR-USERNAME-HERE`
- Run `./quick_push.sh` again with correct username

---

## 🎉 DONE!

Once you see "SUCCESS!", go to:

```
https://github.com/YOUR-USERNAME/protega-cloudpay
```

You should see ALL your code!

---

## 🚀 NEXT STEP

Now deploy to Railway + Vercel:

```bash
# Open this file:
open DEPLOY_NOW.md
```

Or just continue with Step 2 in `START_HERE.md`

---

**Total time: 3 minutes**

**You got this! 💪**

