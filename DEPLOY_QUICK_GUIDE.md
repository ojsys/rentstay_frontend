# Frontend Deployment - Quick Guide

**No npm on cPanel? No problem!** Deploy in 3 simple steps.

---

## 🚀 Quick Deploy (3 Steps)

### Step 1: Build Locally

```bash
cd /Users/Apple/projects/rentstay/frontend
npm run build
```

**Output:** `dist/` folder with all compiled files

### Step 2: Upload to cPanel

**Option A: Using deploy script (Fastest)**
```bash
./deploy.sh
```

**Option B: Manual upload via SCP**
```bash
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

**Option C: Using File Manager**
1. Zip the dist folder: `cd dist && zip -r ../build.zip .`
2. Upload `build.zip` to `/home/myrentst/public_html/app/` via cPanel File Manager
3. Extract the zip file
4. Upload `.htaccess` separately

### Step 3: Test

Visit: **https://app.myrentstay.com**

---

## 🔄 For Future Updates

```bash
# 1. Make changes locally
# 2. Test: npm run dev
# 3. Build: npm run build
# 4. Deploy: ./deploy.sh
```

---

## ✅ First Time Setup Checklist

Before deploying:

- [ ] Create subdomain `app.myrentstay.com` in cPanel
  - Go to: Domains → Create A New Domain
  - Domain: `app.myrentstay.com`
  - Document Root: `/home/myrentst/public_html/app`

- [ ] Verify `.env.production` has correct API URL
  ```bash
  cat .env.production
  # Should show: VITE_API_URL=https://myrentstay.com/api
  ```

- [ ] Test build locally
  ```bash
  npm run build
  npm run preview  # Test at http://localhost:4173
  ```

---

## 🐛 Troubleshooting

### Build fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Upload fails
```bash
# Try rsync instead of scp
rsync -avz dist/ myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

### Site shows blank page
1. Check browser console (F12)
2. Verify .htaccess was uploaded
3. Clear browser cache (Ctrl+Shift+R)

### API calls not working
1. Check Network tab in browser
2. Verify no CORS errors
3. Check backend is running at https://myrentstay.com/api

---

## 📁 What Gets Deployed

```
/home/myrentst/public_html/app/
├── index.html           # Main HTML
├── .htaccess           # React Router config
└── assets/
    ├── index-[hash].js  # JavaScript
    ├── index-[hash].css # Styles
    └── [images]         # Images
```

**These are static files - no Node.js needed on server!**

---

## 🎯 Why This Works

1. **Build locally** = All React code compiled to HTML/CSS/JS
2. **Upload static files** = Just files, no dependencies
3. **Apache serves files** = Regular web server, no Node.js needed

---

## 📚 Full Documentation

- **CPANEL_DEPLOYMENT_NO_NPM.md** - Complete guide
- **ENV_CONFIG.md** - Environment variables
- **deploy.sh** - Deployment script

---

## ⚡ Pro Tip

Add this alias to your shell (~/.bashrc or ~/.zshrc):

```bash
alias deploy-frontend="cd /Users/Apple/projects/rentstay/frontend && ./deploy.sh"
```

Then deploy from anywhere with:
```bash
deploy-frontend
```

---

**You're ready to deploy!** 🚀

Run: `./deploy.sh` from the frontend directory.
