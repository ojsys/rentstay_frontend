# Frontend Deployment Steps - Complete Walkthrough

**Step-by-step guide to deploy your React frontend to cPanel (no npm required on server)**

---

## 📋 Before You Start

**You need:**
- ✅ Local machine with Node.js installed
- ✅ cPanel access
- ✅ SSH or SFTP access to server
- ✅ cPanel credentials: `myrentst@myrentstay.com`

**What you'll deploy:**
- Frontend will be live at: `https://app.myrentstay.com`
- API backend at: `https://myrentstay.com/api`

---

## 🚀 Part 1: First-Time Setup

### Step 1: Create Subdomain in cPanel

1. **Log into cPanel** at `https://myrentstay.com:2083`
   - Username: `myrentst`
   - Password: [your cPanel password]

2. **Search for "Domains"** in the top search bar

3. Click **"Create A New Domain"**

4. Fill in the form:
   - **Domain:** `app.myrentstay.com`
   - **Document Root:** `/home/myrentst/public_html/app`
   - Leave "Share document root" unchecked

5. Click **"Submit"**

6. **Wait 5-30 minutes** for DNS propagation
   - You'll see a success message
   - The subdomain may take time to become accessible

### Step 2: Verify Environment Configuration

On your **local machine:**

```bash
cd /Users/Apple/projects/rentstay/frontend

# Check production environment file
cat .env.production
```

**Should show:**
```env
VITE_API_URL=https://myrentstay.com/api
VITE_API_BASE_URL=https://myrentstay.com
VITE_ENV=production
```

If the file doesn't exist or has wrong values, create it:

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://myrentstay.com/api
VITE_API_BASE_URL=https://myrentstay.com
VITE_ENV=production
EOF
```

### Step 3: Test Build Locally

```bash
# Still in /Users/Apple/projects/rentstay/frontend

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

**Expected output:**
```
vite v5.x.x building for production...
✓ built in 5.23s
dist/index.html              0.45 kB
dist/assets/index-abc123.js  150.23 kB
dist/assets/index-def456.css 25.45 kB
```

**Verify dist folder was created:**
```bash
ls -la dist/
```

Should show:
- `index.html`
- `assets/` folder
- Maybe `favicon.ico` or other static files

**Test the build locally:**
```bash
npm run preview
```

Visit `http://localhost:4173` and verify:
- [ ] Page loads
- [ ] Navigation works
- [ ] No console errors

Press `Ctrl+C` to stop the preview.

### Step 4: Deploy to cPanel

**Option A: Using the deployment script (Easiest)**

```bash
# Make sure you're in the frontend directory
cd /Users/Apple/projects/rentstay/frontend

# Run deployment script
./deploy.sh
```

**What it does:**
1. Cleans previous build
2. Builds production bundle
3. Uploads to server
4. Verifies deployment

Enter your cPanel password when prompted.

**Option B: Manual upload via SCP**

```bash
cd /Users/Apple/projects/rentstay/frontend

# Upload built files
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/

# Upload .htaccess
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

Enter your password when prompted for each command.

**Option C: Using cPanel File Manager**

1. **Create a zip file:**
   ```bash
   cd /Users/Apple/projects/rentstay/frontend/dist
   zip -r ../frontend-build.zip .
   cd ..
   ```

2. **Upload via cPanel:**
   - Log into cPanel
   - Go to **File Manager**
   - Navigate to `/home/myrentst/public_html/app/`
   - Click **Upload**
   - Select `frontend-build.zip`
   - Wait for upload to complete

3. **Extract the zip:**
   - Right-click on `frontend-build.zip`
   - Click **Extract**
   - Extract to current directory
   - Delete `frontend-build.zip` after extraction

4. **Upload .htaccess separately:**
   - In File Manager, still in `/home/myrentst/public_html/app/`
   - Click **Upload**
   - Select `.htaccess` from `/Users/Apple/projects/rentstay/frontend/`
   - Verify it uploaded

### Step 5: Verify Files on Server

**Via SSH:**
```bash
ssh myrentst@myrentstay.com

# Check files are present
cd /home/myrentst/public_html/app
ls -la

# Should see:
# index.html
# .htaccess
# assets/
```

**Via cPanel File Manager:**
1. Go to File Manager
2. Navigate to `/home/myrentst/public_html/app/`
3. Verify you see:
   - `index.html`
   - `.htaccess`
   - `assets/` folder

### Step 6: Test Your Deployment

**Visit your site:**
```
https://app.myrentstay.com
```

**If you see "DNS not found" or similar:**
- Wait longer for DNS propagation (can take up to 48 hours, usually 30 mins)
- Try incognito/private browsing mode
- Clear browser cache

**Once site loads, check:**
- [ ] Home page displays correctly
- [ ] Can navigate between pages
- [ ] Page refresh works (doesn't show 404)
- [ ] Browser console has no errors (Press F12)
- [ ] Can login/register (if backend is running)
- [ ] Images and styles load correctly

**Check API connection:**
- Open browser Developer Tools (F12)
- Go to Console tab
- Type: `console.log(import.meta.env.VITE_API_URL)`
- Should show: `https://myrentstay.com/api`

---

## 🔄 Part 2: Making Updates (After Initial Deploy)

### When You Make Changes to Code

**Step 1: Make changes locally**
```bash
cd /Users/Apple/projects/rentstay/frontend

# Edit your components, pages, etc.
# Test changes: npm run dev
```

**Step 2: Build new version**
```bash
npm run build
```

**Step 3: Deploy**
```bash
./deploy.sh
```

**That's it!** Your changes are live.

---

## 🎯 Common Tasks

### Update Styles Only

```bash
# Make CSS/Tailwind changes
npm run build
./deploy.sh
```

### Update Component

```bash
# Edit src/components/YourComponent.jsx
npm run build
./deploy.sh
```

### Update API Integration

```bash
# Edit src/services/api.js
npm run build
./deploy.sh
```

### Add New Page

```bash
# Create new page component
# Update routes in App.jsx
npm run build
./deploy.sh
```

---

## 🐛 Troubleshooting

### Issue 1: "Site cannot be reached"

**Cause:** DNS not propagated yet

**Solution:**
- Wait 30 minutes to 2 hours
- Clear browser cache
- Try different browser or incognito mode
- Check subdomain was created in cPanel → Domains

### Issue 2: "404 Not Found" on page refresh

**Cause:** .htaccess missing or not working

**Solution:**
```bash
# Re-upload .htaccess
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/

# Verify it exists on server
ssh myrentst@myrentstay.com
cat /home/myrentst/public_html/app/.htaccess
```

### Issue 3: White screen / Blank page

**Cause:** JavaScript error or build issue

**Solution:**
1. Open browser console (F12)
2. Look for error messages
3. Common fix:
   ```bash
   # Rebuild from scratch
   cd /Users/Apple/projects/rentstay/frontend
   rm -rf dist node_modules
   npm install
   npm run build
   ./deploy.sh
   ```

### Issue 4: API calls failing / CORS errors

**Cause:** Backend not allowing frontend domain

**Solution:**
- Verify backend is running at `https://myrentstay.com/api`
- Check backend CORS settings allow `https://app.myrentstay.com`
- See backend `config/settings/production.py`:
  ```python
  CORS_ALLOWED_ORIGINS = [
      'https://app.myrentstay.com',
  ]
  ```

### Issue 5: Styles not loading

**Cause:** CSS files not uploaded

**Solution:**
```bash
# Rebuild and redeploy
npm run build
./deploy.sh

# Verify assets folder exists on server
ssh myrentst@myrentstay.com
ls -la /home/myrentst/public_html/app/assets/
```

### Issue 6: Old version still showing

**Cause:** Browser cache

**Solution:**
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache completely
- Or use incognito mode

### Issue 7: Upload fails with SCP

**Cause:** Permission or connection issue

**Solution:**
```bash
# Try with verbose mode
scp -v -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/

# Or use rsync
rsync -avz dist/ myrentst@myrentstay.com:/home/myrentst/public_html/app/

# Or use SFTP
sftp myrentst@myrentstay.com
cd /home/myrentst/public_html/app
put -r dist/*
put .htaccess
bye
```

---

## 📊 Deployment Checklist

### Before Each Deployment

- [ ] Changes tested locally with `npm run dev`
- [ ] No errors in browser console
- [ ] All features working as expected
- [ ] Build successful with `npm run build`
- [ ] Checked dist/ folder was created

### After Each Deployment

- [ ] Visit https://app.myrentstay.com
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check all pages load
- [ ] Test navigation between pages
- [ ] Test API calls (login/register/data loading)
- [ ] Check browser console for errors
- [ ] Test on mobile if possible

---

## 🎓 Understanding the Process

**Why build locally?**
- Your code (React/JSX) needs to be compiled to regular JavaScript
- Vite bundles everything into optimized HTML/CSS/JS files
- These files can run in any browser, no Node.js needed

**What happens during build?**
1. Vite reads `.env.production`
2. Replaces all `import.meta.env.VITE_*` with actual values
3. Compiles React JSX to JavaScript
4. Bundles all code into a few files
5. Minifies and optimizes
6. Outputs to `dist/` folder

**Why upload static files?**
- The `dist/` folder contains pure HTML/CSS/JS
- Apache web server (on cPanel) can serve these directly
- No need for Node.js on the server

**What does .htaccess do?**
- Tells Apache to serve `index.html` for all routes
- This makes React Router work correctly
- Without it, page refreshes would show 404 errors

---

## 🚀 Quick Reference

### Deploy Command
```bash
cd /Users/Apple/projects/rentstay/frontend && ./deploy.sh
```

### Manual Deploy
```bash
npm run build
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

### Check Deployment
```bash
ssh myrentst@myrentstay.com
cd /home/myrentst/public_html/app && ls -la
```

### View Site
```
https://app.myrentstay.com
```

---

## 📞 Need Help?

1. **Check browser console** (F12) for errors
2. **Check this guide's** troubleshooting section
3. **Review documentation:**
   - `CPANEL_DEPLOYMENT_NO_NPM.md` - Detailed guide
   - `DEPLOY_QUICK_GUIDE.md` - Quick reference
   - `ENV_CONFIG.md` - Environment variables

---

**You're all set!** 🎉

Run `./deploy.sh` to deploy your frontend to cPanel.
