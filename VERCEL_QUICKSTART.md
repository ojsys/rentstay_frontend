# Deploy to Vercel - Quick Start (5 Minutes)

**The easiest way to deploy your React frontend!**

---

## 🚀 5-Minute Deployment

### Step 1: Push to GitHub (2 minutes)

```bash
cd /Users/Apple/projects/rentstay/frontend

# Initialize git
git init

# Add files
git add .

# Commit
git commit -m "Initial commit"

# Create repo at https://github.com/new
# Name it: rentstay-frontend

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/rentstay-frontend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel (3 minutes)

1. **Go to https://vercel.com**
2. **Sign up** with GitHub
3. Click **"Add New..."** → **"Project"**
4. **Import** your `rentstay-frontend` repository
5. **Add Environment Variables:**
   - `VITE_API_URL` = `https://myrentstay.com/api`
   - `VITE_API_BASE_URL` = `https://myrentstay.com`
   - `VITE_ENV` = `production`
6. Click **"Deploy"**

### Step 3: Done! 🎉

Your app is live at: `https://rentstay-frontend.vercel.app`

---

## 🔄 Future Updates

```bash
# Make changes
# Test locally: npm run dev

# Push to GitHub
git add .
git commit -m "Update feature"
git push origin main

# Vercel auto-deploys! ✨
```

**That's it!** No manual builds, no uploads.

---

## 🌐 Use Custom Domain (Optional)

**On Vercel:**
1. Project → Settings → Domains
2. Add: `app.myrentstay.com`

**On cPanel DNS:**
1. Add CNAME record:
   - Name: `app`
   - Value: `cname.vercel-dns.com.`
2. Wait 30 minutes

**Done!** App live at `https://app.myrentstay.com`

---

## 🔧 Update Environment Variables

1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add/Edit variables
4. Redeploy (Deployments → ••• → Redeploy)

---

## 🐛 Troubleshooting

**Build fails?**
- Check build logs in Vercel
- Test locally: `npm run build`
- Fix errors and push again

**API not working?**
- Verify environment variables in Vercel
- Update backend CORS to allow Vercel domain:
  ```python
  CORS_ALLOWED_ORIGINS = [
      'https://rentstay-frontend.vercel.app',
      'https://app.myrentstay.com',
  ]
  ```

---

## ✅ Benefits

- ✅ **Free** hosting
- ✅ **Automatic** deployments (git push = deploy)
- ✅ **Fast** global CDN
- ✅ **SSL** included
- ✅ **Zero** configuration
- ✅ **Preview** deployments for branches
- ✅ **Rollback** with one click

---

**See full guide:** `VERCEL_DEPLOYMENT.md`

**Happy deploying!** 🚀
