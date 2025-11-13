# Deploy Frontend to Vercel - Complete Guide

**Vercel is the easiest way to deploy your React/Vite app!**

---

## 🎯 Why Vercel?

- ✅ **Zero configuration** - Works with Vite out of the box
- ✅ **Free plan** - Perfect for your project
- ✅ **Automatic deployments** - Push to GitHub = Auto deploy
- ✅ **Global CDN** - Fast worldwide
- ✅ **Free SSL** - Automatic HTTPS
- ✅ **Custom domains** - Use app.myrentstay.com
- ✅ **Preview deployments** - Test before going live
- ✅ **Environment variables** - Easy configuration

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### Step 2: Push Frontend to GitHub

**On your local machine:**

```bash
cd /Users/Apple/projects/rentstay/frontend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create commit
git commit -m "Initial commit: RentStay Frontend"

# Create GitHub repository at: https://github.com/new
# Name it: rentstay-frontend

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/rentstay-frontend.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

**On Vercel dashboard:**

1. Click **"Add New..."** → **"Project"**
2. Click **"Import"** next to your `rentstay-frontend` repository
3. Configure project:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `dist` (auto-filled)

4. **Add Environment Variables:**
   Click **"Environment Variables"** and add:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://myrentstay.com/api` |
   | `VITE_API_BASE_URL` | `https://myrentstay.com` |
   | `VITE_ENV` | `production` |

5. Click **"Deploy"**

6. **Wait 30-60 seconds** - Vercel builds and deploys

7. **Done!** You'll get a URL like: `https://rentstay-frontend.vercel.app`

---

## 🌐 Step 4: Add Custom Domain

### Option 1: Use Vercel Subdomain (Easy)

Your app is already live at: `https://rentstay-frontend.vercel.app`

### Option 2: Use Your Domain (app.myrentstay.com)

**On Vercel:**
1. Go to your project → **Settings** → **Domains**
2. Add domain: `app.myrentstay.com`
3. Vercel will show DNS instructions

**On cPanel:**
1. Go to **Zone Editor** or **DNS Management**
2. Add a **CNAME record**:
   - **Name:** `app`
   - **Type:** `CNAME`
   - **Value:** `cname.vercel-dns.com.` (note the dot at end)
   - **TTL:** 3600

3. Wait 5-30 minutes for DNS propagation

4. Back on Vercel, verify domain

**Your app is now live at:** `https://app.myrentstay.com` 🎉

---

## 🔄 Automatic Deployments

**Every time you push to GitHub, Vercel automatically deploys!**

```bash
# Make changes to your code
# Edit components, pages, etc.

# Commit and push
git add .
git commit -m "Update header design"
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Runs npm install
# 3. Runs npm run build
# 4. Deploys to production
# 5. Updates https://app.myrentstay.com
```

**No manual deployment needed!** 🚀

---

## 🔧 Environment Variables

### Add/Update Environment Variables

**On Vercel Dashboard:**
1. Go to your project
2. **Settings** → **Environment Variables**
3. Add or edit variables:
   - `VITE_API_URL`
   - `VITE_PAYSTACK_PUBLIC_KEY`
   - etc.

4. **Redeploy** to apply changes:
   - Go to **Deployments**
   - Click **•••** on latest deployment
   - Click **Redeploy**

### Check Current Variables

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# View environment variables
vercel env ls
```

---

## 🌿 Branch Deployments (Preview Environments)

Vercel creates preview deployments for every branch!

```bash
# Create feature branch
git checkout -b feature/new-ui

# Make changes and push
git add .
git commit -m "Add new UI"
git push origin feature/new-ui

# Vercel creates preview at:
# https://rentstay-frontend-git-feature-new-ui-yourname.vercel.app

# Test the preview
# Merge to main when ready
git checkout main
git merge feature/new-ui
git push origin main

# Automatically deploys to production!
```

---

## 📊 Deployment Status

### View Deployments

1. Go to Vercel Dashboard
2. Click on your project
3. See all deployments with:
   - Status (Success/Failed)
   - Commit message
   - Deploy time
   - Preview URL

### Rollback to Previous Version

1. Go to **Deployments**
2. Find the version you want
3. Click **•••** → **Promote to Production**
4. Done! Instant rollback

---

## 🔍 Monitoring & Logs

### View Build Logs

1. Go to **Deployments**
2. Click on a deployment
3. See **Building** and **Runtime** logs

### View Runtime Logs

1. Your project → **Logs** tab
2. See real-time logs
3. Filter by status codes, paths, etc.

---

## ⚙️ Advanced Configuration

### Custom Build Settings (vercel.json)

Create `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Performance Optimization

Vercel automatically:
- ✅ Compresses assets
- ✅ Serves via global CDN
- ✅ Enables HTTP/2
- ✅ Optimizes images
- ✅ Caches static files

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs:**
1. Go to failed deployment
2. Read **Building** logs
3. Fix errors locally
4. Push again

**Common issues:**
```bash
# Missing dependencies
npm install --save <package-name>

# Build errors
npm run build  # Test locally first

# Environment variables
# Make sure all VITE_* vars are set in Vercel
```

### API Calls Not Working

**Check CORS:**
- Backend must allow Vercel domain
- Update backend `CORS_ALLOWED_ORIGINS`:

```python
# backend/config/settings/production.py
CORS_ALLOWED_ORIGINS = [
    'https://app.myrentstay.com',
    'https://rentstay-frontend.vercel.app',  # Add Vercel domain
]
```

**Check environment variables:**
1. Vercel → Settings → Environment Variables
2. Verify `VITE_API_URL` is set to `https://myrentstay.com/api`
3. Redeploy after changes

### Custom Domain Not Working

**Check DNS:**
```bash
# Check CNAME record
dig app.myrentstay.com CNAME

# Should show: cname.vercel-dns.com
```

**Wait for propagation:**
- DNS can take 5 minutes to 48 hours
- Usually works in 30 minutes

**Verify on Vercel:**
1. Settings → Domains
2. Status should be "Valid Configuration"

---

## 💰 Pricing

**Hobby Plan (FREE):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Preview deployments
- ✅ Analytics (basic)

**Perfect for your project!**

**Pro Plan ($20/month):**
- More bandwidth
- Team collaboration
- Advanced analytics
- Priority support

---

## 🔐 Security

### Enable Security Headers

Already configured in `vercel.json` above.

### Environment Variables

- ✅ Never commit secrets to GitHub
- ✅ Use Vercel Environment Variables
- ✅ Variables are encrypted at rest
- ✅ Only exposed during build

### SSL Certificate

- ✅ Automatic SSL for all domains
- ✅ Auto-renews
- ✅ Forces HTTPS

---

## 📱 Mobile App Support

Vercel works great for PWAs:

1. Configure `manifest.json`
2. Add service worker
3. Deploy to Vercel
4. Users can "Add to Home Screen"

---

## 🎯 Complete Workflow

### Initial Setup
```bash
1. Create GitHub repo
2. Push code to GitHub
3. Connect to Vercel
4. Add environment variables
5. Deploy
```

### Daily Workflow
```bash
# Make changes
# Test locally: npm run dev
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys!
```

### Testing Workflow
```bash
git checkout -b feature/test
# Make changes
git push origin feature/test
# Test preview deployment
# Merge to main when ready
```

---

## 🆚 Vercel vs cPanel

| Feature | Vercel | cPanel |
|---------|--------|--------|
| Setup Time | 5 minutes | 30+ minutes |
| Deployment | Automatic (git push) | Manual upload |
| Build Process | Automatic | Manual (local build) |
| SSL | Free & automatic | Free but manual setup |
| CDN | Global, built-in | Not included |
| Rollback | One click | Manual re-upload |
| Preview Envs | Automatic | Not available |
| Cost | Free | Included in hosting |

**Verdict:** Vercel is better for React apps! 🏆

---

## 📚 Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vite on Vercel:** https://vercel.com/docs/frameworks/vite
- **Custom Domains:** https://vercel.com/docs/concepts/projects/domains

---

## ✅ Checklist

### First Deployment
- [ ] Create Vercel account
- [ ] Push code to GitHub
- [ ] Import project to Vercel
- [ ] Add environment variables
- [ ] Deploy (automatic)
- [ ] Test deployment
- [ ] Add custom domain (optional)
- [ ] Update backend CORS settings

### After Deployment
- [ ] Verify site loads at Vercel URL
- [ ] Test API connections
- [ ] Check browser console for errors
- [ ] Test all features
- [ ] Share URL with team

---

## 🎉 Summary

**Vercel makes deployment:**
- ✅ Automatic (git push = deploy)
- ✅ Fast (30-60 second builds)
- ✅ Free (hobby plan)
- ✅ Reliable (99.99% uptime)
- ✅ Scalable (auto-scaling)

**Your new workflow:**
```
Make changes → Commit → Push → Done!
```

No manual builds, no uploads, no stress! 🚀

---

**Ready to deploy?** Follow Step 1 above!
