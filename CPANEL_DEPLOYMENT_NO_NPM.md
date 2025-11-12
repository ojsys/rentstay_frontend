# Frontend Deployment to cPanel (Without npm)

Complete guide to deploy your React frontend to cPanel when npm is not available on the server.

---

## 🎯 Deployment Strategy

Since npm is not available on cPanel, we'll **build locally** and **upload the compiled files**.

**Benefits:**
- ✅ No need for Node.js on server
- ✅ Faster deployment
- ✅ Smaller upload size (only static files)
- ✅ Works on any cPanel hosting

---

## 📋 Prerequisites

- [x] Node.js installed on your **local machine**
- [x] cPanel access
- [x] SSH or FTP access to server

---

## 🚀 Method 1: Build Locally + Upload via SCP (Recommended)

### Step 1: Build Production Bundle Locally

```bash
# Navigate to frontend directory
cd /Users/Apple/projects/rentstay/frontend

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Verify build was created
ls -la dist/
# Should show: index.html, assets/, etc.
```

**What happens:**
- Vite automatically uses `.env.production`
- API URL set to: `https://myrentstay.com/api`
- All files optimized and bundled into `dist/` folder

### Step 2: Create Subdomain in cPanel

**In cPanel:**
1. Go to **Domains** → **Create A New Domain**
2. Enter:
   - **Domain:** `app.myrentstay.com`
   - **Document Root:** `/home/myrentst/public_html/app`
3. Click **Submit**
4. Wait for DNS propagation (5-30 minutes)

### Step 3: Upload Files via SCP

```bash
# From your local machine
cd /Users/Apple/projects/rentstay/frontend

# Upload dist contents to server
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/

# Upload .htaccess file
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

**Enter your cPanel password when prompted**

### Step 4: Verify Deployment

```bash
# SSH into server to check files
ssh myrentst@myrentstay.com

# Verify files are present
ls -la /home/myrentst/public_html/app/
# Should show: index.html, assets/, .htaccess

# Check .htaccess content
cat /home/myrentst/public_html/app/.htaccess
```

### Step 5: Test Your Site

Visit: **https://app.myrentstay.com**

**Check:**
- [ ] Page loads without errors
- [ ] Navigation works
- [ ] Page refresh works (React Router)
- [ ] API calls work
- [ ] No CORS errors in console
- [ ] Login/Register functions

---

## 🚀 Method 2: Build Locally + Upload via cPanel File Manager

### Step 1: Build Locally

```bash
cd /Users/Apple/projects/rentstay/frontend
npm run build
```

### Step 2: Create ZIP Archive

```bash
# Create zip of dist folder contents
cd dist
zip -r ../frontend-build.zip .
cd ..

# The zip file is now at: frontend-build.zip
```

### Step 3: Upload via cPanel File Manager

**In cPanel:**
1. Go to **File Manager**
2. Navigate to `/home/myrentst/public_html/app/`
3. Click **Upload**
4. Select `frontend-build.zip`
5. Wait for upload to complete
6. Right-click on `frontend-build.zip` → **Extract**
7. Delete `frontend-build.zip` after extraction

### Step 4: Upload .htaccess Separately

1. In File Manager, still in `/home/myrentst/public_html/app/`
2. Click **Upload**
3. Upload the `.htaccess` file from `/Users/Apple/projects/rentstay/frontend/.htaccess`
4. Verify it's present

### Step 5: Test

Visit: **https://app.myrentstay.com**

---

## 🚀 Method 3: GitHub + Local Build (Best for Updates)

This combines version control with easy updates.

### Initial Setup

**1. Push frontend to GitHub:**

```bash
cd /Users/Apple/projects/rentstay/frontend

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/rentstay-frontend.git
git branch -M main
git push -u origin main
```

**2. Clone on server (source code only):**

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Clone repository
cd /home/myrentst
git clone https://github.com/YOUR_USERNAME/rentstay-frontend.git frontend-repo

# This gives you a copy for reference, but we won't build here
```

**3. Build locally and upload:**

```bash
# On your local machine
cd /Users/Apple/projects/rentstay/frontend
npm run build

# Upload to server
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

### Future Updates

**On your local machine:**

```bash
# Make changes to code
# Edit components, pages, etc.

# Test locally
npm run dev

# Commit to git
git add .
git commit -m "Update: describe changes"
git push origin main

# Build for production
npm run build

# Upload to server
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

---

## 🔄 Automated Deployment Script

Create a script to automate the build and upload process.

### Create `deploy-to-cpanel.sh`

```bash
cd /Users/Apple/projects/rentstay/frontend

cat > deploy-to-cpanel.sh << 'EOF'
#!/bin/bash

# Frontend Deployment to cPanel (No npm on server)
# Builds locally and uploads static files

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SERVER_USER="myrentst"
SERVER_HOST="myrentstay.com"
SERVER_PATH="/home/myrentst/public_html/app"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  RentStay Frontend Deployment${NC}"
echo -e "${BLUE}  (cPanel - Build Locally)${NC}"
echo -e "${BLUE}======================================${NC}"

# Step 1: Clean previous build
echo -e "\n${GREEN}[1/6]${NC} Cleaning previous build..."
rm -rf dist

# Step 2: Verify production environment
echo -e "${GREEN}[2/6]${NC} Verifying production environment..."
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production not found!${NC}"
    exit 1
fi

echo "Production API URL:"
grep VITE_API_URL .env.production

# Step 3: Install dependencies (if needed)
echo -e "\n${GREEN}[3/6]${NC} Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed ✓"
fi

# Step 4: Build for production
echo -e "\n${GREEN}[4/6]${NC} Building for production..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed! dist/ directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"
echo "Build size:"
du -sh dist/

# Step 5: Upload to server
echo -e "\n${GREEN}[5/6]${NC} Uploading to cPanel server..."
echo "Target: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

# Upload dist contents
echo "Uploading built files..."
scp -r dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

# Upload .htaccess
echo "Uploading .htaccess..."
scp .htaccess ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo -e "${GREEN}Upload complete!${NC}"

# Step 6: Verify deployment
echo -e "\n${GREEN}[6/6]${NC} Verifying deployment..."
echo "Checking if files were uploaded..."

ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/myrentst/public_html/app
echo "Files in deployment directory:"
ls -lh | head -10
echo ""
echo "Checking .htaccess:"
if [ -f .htaccess ]; then
    echo "✓ .htaccess present"
else
    echo "✗ .htaccess missing!"
fi
ENDSSH

# Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Your app is live at:"
echo -e "${GREEN}https://app.myrentstay.com${NC}"
echo ""
echo "Next steps:"
echo "1. Visit https://app.myrentstay.com"
echo "2. Clear browser cache (Ctrl+Shift+R)"
echo "3. Test all features"
echo "4. Check browser console for errors"
echo ""
echo -e "${BLUE}Happy deploying! 🚀${NC}"
EOF

chmod +x deploy-to-cpanel.sh
```

### Usage

```bash
# Deploy in one command
./deploy-to-cpanel.sh
```

---

## 🔧 Alternative: Install Node.js on cPanel (If Supported)

Some cPanel servers support Node.js apps. Check if yours does:

### Check Node.js Availability

**In cPanel:**
1. Search for "**Setup Node.js App**" or "**Application Manager**"
2. If available, you can set up Node.js

### If Node.js Setup is Available

1. Go to **Setup Node.js App**
2. Click **Create Application**
3. Settings:
   - **Node.js version:** Choose latest (18.x or 20.x)
   - **Application mode:** Production
   - **Application root:** `/home/myrentst/frontend-app`
   - **Application URL:** Leave empty
   - **Application startup file:** Leave empty (we just need npm)

4. Click **Create**

5. Note the command to enter the virtual environment, usually:
   ```bash
   source /home/myrentst/nodevenv/frontend-app/18/bin/activate
   ```

### Then You Can Build on Server

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Activate Node.js environment
source /home/myrentst/nodevenv/frontend-app/18/bin/activate

# Navigate to your app
cd /home/myrentst/public_html/app

# Now npm is available
npm install
npm run build
cp -r dist/* .
```

**Note:** This method is less common and depends on your hosting provider.

---

## 📁 What Gets Deployed

After building, your `dist/` folder contains:

```
dist/
├── index.html          # Main HTML file
├── assets/
│   ├── index-[hash].js     # JavaScript bundle
│   ├── index-[hash].css    # CSS bundle
│   └── [images/fonts]      # Static assets
└── favicon.ico
```

**These are static files** that work on any web server - no Node.js needed!

---

## 🔍 Verify Your Build

### Check Environment Variables Are Embedded

```bash
# After building, check if production API URL is in the bundle
cd dist
grep -r "myrentstay.com" assets/*.js

# Should show: https://myrentstay.com/api
```

### Test Locally Before Upload

```bash
# Preview production build
npm run preview

# Visit: http://localhost:4173
# Test that everything works with production API
```

---

## 🐛 Troubleshooting

### Issue: API calls going to localhost after deployment

**Problem:** Build used wrong environment file

**Solution:**
```bash
# Force production build
rm -rf dist
npm run build

# Verify API URL in build
grep -r "localhost:8000" dist/assets/*.js
# Should return nothing

grep -r "myrentstay.com" dist/assets/*.js
# Should show your production API
```

### Issue: 404 errors on page refresh

**Problem:** .htaccess not uploaded or incorrect

**Solution:**
```bash
# Re-upload .htaccess
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/

# Verify content
ssh myrentst@myrentstay.com
cat /home/myrentst/public_html/app/.htaccess
```

### Issue: White screen / blank page

**Check browser console:**
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

**Common fixes:**
```bash
# Rebuild from scratch
rm -rf dist node_modules
npm install
npm run build
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

### Issue: Files not uploading via SCP

**Use rsync instead:**
```bash
rsync -avz --progress dist/ myrentst@myrentstay.com:/home/myrentst/public_html/app/
```

**Or use SFTP:**
```bash
sftp myrentst@myrentstay.com
cd /home/myrentst/public_html/app
put -r dist/*
put .htaccess
bye
```

---

## 🔄 Complete Deployment Workflow

### First Time Deployment

```bash
# 1. Build locally
cd /Users/Apple/projects/rentstay/frontend
npm run build

# 2. Upload to server
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/
scp .htaccess myrentst@myrentstay.com:/home/myrentst/public_html/app/

# 3. Test
open https://app.myrentstay.com
```

### Regular Updates

```bash
# 1. Make changes locally
# Edit components, pages, etc.

# 2. Test locally
npm run dev

# 3. Rebuild
npm run build

# 4. Upload (just the changed files)
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/

# 5. Clear browser cache and test
```

### Using Deployment Script

```bash
# One command deployment
./deploy-to-cpanel.sh
```

---

## 📊 Deployment Checklist

Before deployment:
- [ ] Code tested locally (`npm run dev`)
- [ ] Production build successful (`npm run build`)
- [ ] No errors in browser console
- [ ] API URL correct in `.env.production`
- [ ] `.htaccess` file ready

After deployment:
- [ ] Visit https://app.myrentstay.com
- [ ] Check all pages load
- [ ] Test navigation
- [ ] Test API calls (check Network tab)
- [ ] Test authentication (login/register)
- [ ] Check for CORS errors
- [ ] Test on mobile device

---

## 🎯 Summary

**You Don't Need npm on Server Because:**
- ✅ React builds to static HTML/CSS/JS files
- ✅ These files run in the browser, not on the server
- ✅ Any web server (Apache/Nginx) can serve them

**Deployment Process:**
1. ✅ Build locally with `npm run build`
2. ✅ Upload `dist/` contents + `.htaccess` to server
3. ✅ Done! Site is live

**For Updates:**
1. ✅ Make changes locally
2. ✅ Build again
3. ✅ Upload again
4. ✅ Done!

---

**Your frontend is ready to deploy without npm on cPanel!** 🚀

**Recommended:** Use the deployment script (`deploy-to-cpanel.sh`) for fastest updates.
