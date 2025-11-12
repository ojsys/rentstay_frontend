# GitHub-Based Deployment Guide

Complete guide to deploy your React frontend using GitHub for version control and easy updates.

---

## 🎯 Benefits of GitHub Deployment

- ✅ Version control and deployment history
- ✅ Easy rollbacks if something breaks
- ✅ Simple updates with `git pull`
- ✅ Collaborate with other developers
- ✅ Track changes and commits

---

## 📋 Prerequisites

- [x] GitHub repository created for frontend
- [ ] GitHub repository URL (e.g., `https://github.com/yourusername/rentstay-frontend.git`)
- [ ] SSH access to cPanel server

---

## 🚀 Initial Setup (One-Time)

### Step 1: Prepare Frontend as Separate Git Repository

Since your frontend is currently part of the main repo, we'll create a separate repository for it.

**On your local machine:**

```bash
# Navigate to your project root
cd /Users/Apple/projects/rentstay

# Create a new directory for standalone frontend
mkdir -p ../rentstay-frontend-deploy
cd ../rentstay-frontend-deploy

# Copy frontend files
cp -r ../rentstay/frontend/* .
cp -r ../rentstay/frontend/.* . 2>/dev/null || true

# Initialize as new git repository
git init

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: RentStay Frontend

- React + Vite setup
- Environment configuration for dev/prod
- Tailwind CSS styling
- API integration with Django backend
- Deploy scripts and documentation"
```

### Step 2: Connect to GitHub Repository

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/rentstay-frontend.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

**Your frontend is now on GitHub!** 🎉

---

## 🌐 Deploy to cPanel from GitHub

### Step 3: Initial Deployment to cPanel

**SSH into your cPanel server:**

```bash
ssh myrentst@myrentstay.com
# Enter your password
```

**On the server:**

```bash
# Navigate to the app subdomain directory
cd /home/myrentst/public_html/app

# If directory has existing files, back them up
ls -la
# If needed: mv index.html index.html.backup

# Clone your GitHub repository
git clone https://github.com/yourusername/rentstay-frontend.git .

# Note: The dot (.) at the end clones into current directory
# This ensures files are in /public_html/app/ not /public_html/app/rentstay-frontend/

# Verify files are in place
ls -la
# Should show: src/, public/, package.json, vite.config.js, etc.
```

### Step 4: Install Dependencies and Build

**Still on the server:**

```bash
# Check Node.js version (should be 16+)
node --version

# Install dependencies
npm install

# This may take 2-5 minutes
# Wait for: "added XXX packages"

# Build for production (uses .env.production automatically)
npm run build

# Verify build was created
ls -la dist/
# Should show: index.html, assets/, etc.

# Move build files to current directory
cp -r dist/* .

# OR use a symlink approach (cleaner)
# This keeps the build in dist/ and links it
# We'll use copy for simplicity

# Check .htaccess exists
cat .htaccess
# Should show React Router rewrite rules
```

### Step 5: Verify Deployment

**Visit your frontend:**
```
https://app.myrentstay.com
```

**Check it works:**
- [ ] Page loads without errors
- [ ] Navigation works
- [ ] API calls connect to backend
- [ ] No CORS errors in browser console
- [ ] Login/Register functions work

---

## 🔄 Updating Frontend (Regular Workflow)

This is where GitHub shines! Updates are super simple.

### On Your Local Machine: Make Changes

```bash
# Navigate to your frontend directory
cd /path/to/rentstay-frontend-deploy

# Make your changes to code
# Edit components, pages, styles, etc.

# Test locally
npm run dev
# Verify changes work at http://localhost:5173

# Stage and commit changes
git add .
git commit -m "Update: describe what you changed"

# Push to GitHub
git push origin main
```

### On cPanel Server: Deploy Changes

**Option A: Quick Update Script (Recommended)**

Create a deployment script on the server:

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Create update script
cat > /home/myrentst/public_html/app/update.sh << 'EOF'
#!/bin/bash

echo "🔄 Updating RentStay Frontend..."

# Navigate to app directory
cd /home/myrentst/public_html/app

# Pull latest changes from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️  Building production bundle..."
npm run build

# Copy build files
echo "📋 Copying build files..."
cp -r dist/* .

# Clean up (optional)
# rm -rf dist node_modules

echo "✅ Update complete!"
echo "🌐 Visit: https://app.myrentstay.com"
EOF

# Make script executable
chmod +x /home/myrentst/public_html/app/update.sh
```

**Now, every time you want to deploy:**

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Run update script
cd /home/myrentst/public_html/app
./update.sh
```

**Option B: Manual Update**

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Navigate to app directory
cd /home/myrentst/public_html/app

# Pull latest changes
git pull origin main

# Install new dependencies (if package.json changed)
npm install

# Rebuild
npm run build

# Copy build files
cp -r dist/* .
```

**Option C: Update Script From Local Machine**

You can trigger the update remotely:

```bash
# On your local machine
ssh myrentst@myrentstay.com 'cd /home/myrentst/public_html/app && git pull && npm install && npm run build && cp -r dist/* .'
```

---

## 🔐 Handling Private Repositories

If your GitHub repository is private, you'll need to set up authentication.

### Option 1: Personal Access Token (Easier)

**On GitHub:**
1. Go to **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name it: "cPanel Deployment"
4. Select scope: `repo` (full control)
5. Generate and **copy the token** (save it securely!)

**On cPanel server:**

```bash
# Clone using token
git clone https://YOUR_TOKEN@github.com/yourusername/rentstay-frontend.git .

# Or update existing remote
git remote set-url origin https://YOUR_TOKEN@github.com/yourusername/rentstay-frontend.git

# Test
git pull
```

### Option 2: SSH Keys (More Secure)

**On cPanel server:**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "myrentst@myrentstay.com"
# Press Enter for all prompts (default location, no passphrase)

# Display public key
cat ~/.ssh/id_ed25519.pub
# Copy the entire output
```

**On GitHub:**
1. Go to repository **Settings** → **Deploy keys**
2. Click **Add deploy key**
3. Title: "cPanel Server"
4. Paste the public key
5. ✓ Check "Allow write access" (if you want to push from server)
6. Click **Add key**

**Update remote on server:**

```bash
git remote set-url origin git@github.com:yourusername/rentstay-frontend.git

# Test
git pull
```

---

## 📁 Recommended Directory Structure on Server

```
/home/myrentst/public_html/app/
├── .git/                    # Git repository
├── src/                     # React source code
├── public/                  # Public assets
├── dist/                    # Build output (ignored in git)
├── node_modules/            # Dependencies (ignored in git)
├── index.html               # Copied from dist/
├── assets/                  # Copied from dist/assets/
├── .htaccess               # React Router config (committed)
├── .env.production         # Production env vars (committed)
├── .env.development        # Dev env vars (committed)
├── package.json            # Dependencies list
├── vite.config.js          # Vite configuration
└── update.sh               # Update script (created on server)
```

---

## 🎯 Complete Workflow Example

### Scenario: Adding a New Feature

**1. Local Development:**
```bash
# On your machine
cd /path/to/rentstay-frontend-deploy

# Create feature branch (optional but recommended)
git checkout -b feature/user-profile

# Make changes
# ... edit components ...

# Test locally
npm run dev

# Commit changes
git add .
git commit -m "Add user profile page"

# Push to GitHub
git push origin feature/user-profile

# Or push to main directly:
git checkout main
git merge feature/user-profile
git push origin main
```

**2. Deploy to Production:**
```bash
# SSH into server
ssh myrentst@myrentstay.com

# Run update script
/home/myrentst/public_html/app/update.sh

# Or manually:
cd /home/myrentst/public_html/app
git pull origin main
npm install
npm run build
cp -r dist/* .
```

**3. Verify:**
```bash
# Visit site
open https://app.myrentstay.com

# Check browser console for errors
# Test the new feature
```

**4. Rollback if Needed:**
```bash
# On server
cd /home/myrentst/public_html/app

# View recent commits
git log --oneline -5

# Rollback to previous commit
git reset --hard <commit-hash>

# Rebuild
npm run build
cp -r dist/* .
```

---

## 🔧 Environment Variables on Server

Your `.env.production` file is committed to the repository, so it's automatically available. However, if you need to add sensitive keys:

```bash
# SSH into server
ssh myrentst@myrentstay.com
cd /home/myrentst/public_html/app

# Edit production environment file
nano .env.production
```

Add any sensitive variables:
```env
VITE_API_URL=https://myrentstay.com/api
VITE_API_BASE_URL=https://myrentstay.com
VITE_ENV=production

# Add sensitive keys (not committed to git)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_actual_live_key
VITE_GOOGLE_MAPS_KEY=your_maps_api_key
```

**Important:** If you add sensitive keys to `.env.production` on the server:
1. Add `.env.production` to `.gitignore` on server (create local `.gitignore`)
2. Back it up securely
3. Don't commit sensitive keys to GitHub

**Better approach:** Keep non-sensitive defaults in the repo, override on server:

```bash
# In repo: .env.production (safe defaults)
VITE_API_URL=https://myrentstay.com/api
VITE_API_BASE_URL=https://myrentstay.com
VITE_ENV=production

# On server: .env.production.local (overrides, not in git)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_actual_key
```

---

## 🐛 Troubleshooting

### Issue: Git pull fails with conflicts

```bash
# On server
cd /home/myrentst/public_html/app

# Stash local changes
git stash

# Pull latest
git pull origin main

# If you need local changes back:
git stash pop
```

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build fails

```bash
# Check Node.js version
node --version  # Should be 16+

# Check for errors in code
npm run build 2>&1 | tee build.log

# Review build.log for errors
```

### Issue: Changes not showing on website

```bash
# Clear browser cache (Ctrl+Shift+R)

# Verify files were copied
ls -la /home/myrentst/public_html/app/index.html
stat /home/myrentst/public_html/app/index.html
# Check timestamp - should be recent

# Rebuild and re-copy
cd /home/myrentst/public_html/app
npm run build
rm -f index.html
cp -r dist/* .
```

### Issue: "fatal: not a git repository"

```bash
# Re-clone the repository
cd /home/myrentst/public_html
mv app app.backup
mkdir app
cd app
git clone https://github.com/yourusername/rentstay-frontend.git .
```

---

## 📊 Monitoring Deployments

### View Deployment History

```bash
# On server
cd /home/myrentst/public_html/app

# View commit history
git log --oneline --graph --all -10

# View what changed in last deploy
git log -1 -p

# View current branch and status
git status
```

### Create Deployment Log

```bash
# Add to update.sh script
echo "$(date): Deployment started" >> /home/myrentst/deployment.log

# View deployment history
tail -20 /home/myrentst/deployment.log
```

---

## 🚀 Advanced: Automated Deployments

### GitHub Actions (Optional)

You can automate deployments using GitHub Actions. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to cPanel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Deploy to cPanel
      uses: appleboy/ssh-action@master
      with:
        host: myrentstay.com
        username: myrentst
        password: ${{ secrets.CPANEL_PASSWORD }}
        script: |
          cd /home/myrentst/public_html/app
          git pull origin main
          npm install
          npm run build
          cp -r dist/* .
```

Add `CPANEL_PASSWORD` to GitHub repository secrets:
- Go to repository **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**
- Name: `CPANEL_PASSWORD`
- Value: Your cPanel password

Now every push to `main` automatically deploys! 🎉

---

## ✅ Deployment Checklist

Before each deployment:

- [ ] Code tested locally (`npm run dev`)
- [ ] No errors in browser console
- [ ] All features working
- [ ] Changes committed to git
- [ ] Pushed to GitHub (`git push origin main`)
- [ ] SSH into server
- [ ] Run update script or manual commands
- [ ] Verify deployment on live site
- [ ] Check for errors in browser
- [ ] Test critical features (login, API calls, etc.)

---

## 🎉 Summary

### One-Time Setup:
1. Create separate frontend repo on GitHub
2. Clone to cPanel server
3. Build and deploy
4. Create update script

### Regular Updates:
1. Make changes locally
2. Commit and push to GitHub
3. SSH into server
4. Run `./update.sh`
5. Verify deployment

### Benefits:
- ✅ Version control
- ✅ Easy rollbacks
- ✅ Deployment history
- ✅ Simple updates
- ✅ Team collaboration

---

**Your frontend is now deployed via GitHub with easy update workflow!** 🚀

**Questions?** Check the troubleshooting section or review the deployment logs.
