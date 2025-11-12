# Deploy Frontend from GitHub - Quick Guide

**You've created a GitHub repository for your frontend. Here's what to do next:**

---

## 🎯 Quick Start (3 Steps)

### Step 1: Push Your Frontend to GitHub

**Option A: Use the automated script (Easiest)**
```bash
cd /Users/Apple/projects/rentstay/frontend
./setup-github-repo.sh
```

The script will:
- Create a standalone frontend directory
- Initialize git repository
- Commit all files
- Push to your GitHub repository

**Option B: Manual setup**
```bash
# Create new directory for standalone frontend
mkdir -p ../rentstay-frontend
cd ../rentstay-frontend

# Copy frontend files
cp -r ../rentstay/frontend/* .
cp -r ../rentstay/frontend/.* . 2>/dev/null || true

# Initialize git
git init
git add .
git commit -m "Initial commit: RentStay Frontend"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy to cPanel

**SSH into your server:**
```bash
ssh myrentst@myrentstay.com
```

**Clone and deploy:**
```bash
# Navigate to subdomain directory
cd /home/myrentst/public_html/app

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Install dependencies
npm install

# Build for production
npm run build

# Copy build files to root
cp -r dist/* .

# Verify .htaccess exists
cat .htaccess
```

**Visit your site:**
```
https://app.myrentstay.com
```

---

### Step 3: Create Update Script (For Future Updates)

**On the server, create an update script:**
```bash
cat > /home/myrentst/public_html/app/update.sh << 'EOF'
#!/bin/bash
cd /home/myrentst/public_html/app
echo "📥 Pulling latest changes..."
git pull origin main
echo "📦 Installing dependencies..."
npm install
echo "🏗️  Building..."
npm run build
echo "📋 Copying files..."
cp -r dist/* .
echo "✅ Update complete!"
EOF

chmod +x /home/myrentst/public_html/app/update.sh
```

---

## 🔄 Updating Frontend (Daily Workflow)

### On Your Local Machine:
```bash
# Make changes to your code
# Test locally: npm run dev

# Commit and push
git add .
git commit -m "Describe your changes"
git push origin main
```

### On cPanel Server:
```bash
# SSH into server
ssh myrentst@myrentstay.com

# Run update script
/home/myrentst/public_html/app/update.sh
```

**That's it!** Your changes are live. ✨

---

## 🔑 If Your Repository is Private

You'll need authentication to clone/pull.

### Option 1: Personal Access Token

**On GitHub:**
1. Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scope: `repo`
4. Copy the token

**On server:**
```bash
git clone https://YOUR_TOKEN@github.com/username/repo.git .

# Or update existing remote:
git remote set-url origin https://YOUR_TOKEN@github.com/username/repo.git
```

### Option 2: SSH Key (More Secure)

**On server:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "myrentst@myrentstay.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

**On GitHub:**
1. Repository Settings → Deploy keys
2. Add deploy key
3. Paste public key
4. Save

**Update remote:**
```bash
git remote set-url origin git@github.com:username/repo.git
```

---

## 📁 Environment Variables

Your `.env.production` is already configured:
```env
VITE_API_URL=https://myrentstay.com/api
VITE_API_BASE_URL=https://myrentstay.com
VITE_ENV=production
```

If you need to add sensitive keys on the server:
```bash
# On server
nano /home/myrentst/public_html/app/.env.production.local

# Add keys that shouldn't be in GitHub:
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_actual_key
```

---

## 🐛 Troubleshooting

### Issue: Permission denied (publickey)
```bash
# Use HTTPS instead of SSH
git remote set-url origin https://github.com/username/repo.git

# Or set up SSH keys (see above)
```

### Issue: Changes not showing
```bash
# Clear browser cache (Ctrl + Shift + R)

# On server, verify files updated
ssh myrentst@myrentstay.com
cd /home/myrentst/public_html/app
ls -la index.html  # Check timestamp

# Force rebuild
rm -rf dist
npm run build
cp -r dist/* .
```

### Issue: npm install fails
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Complete Documentation

For detailed information, see:
- **GITHUB_DEPLOYMENT.md** - Complete GitHub deployment guide
- **ENV_CONFIG.md** - Environment variable configuration
- **deploy.sh** - Local deployment script

---

## ✅ Summary

**Setup (One-Time):**
1. ✅ Push frontend to GitHub
2. ✅ Clone to cPanel server
3. ✅ Build and deploy
4. ✅ Create update script

**Daily Updates:**
1. ✅ Make changes locally
2. ✅ Push to GitHub
3. ✅ Run update script on server

**Benefits:**
- Version control and history
- Easy rollbacks
- Simple collaboration
- Tracked deployments

---

**Your frontend is ready for GitHub-based deployment!** 🎉

**Next:** Push your code to GitHub and follow Step 2 above.
