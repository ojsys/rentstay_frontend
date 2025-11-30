# Fix CORS Error for Vercel Deployment

**Your app is deployed but backend is blocking requests from Vercel.**

---

## 🔍 The Problem

Your Vercel app at `https://rentstay-frontend.vercel.app` is being blocked by CORS:

```
Access to XMLHttpRequest at 'https://myrentstay.com/api/...' from origin
'https://rentstay-frontend.vercel.app' has been blocked by CORS policy
```

**Why?** Backend doesn't have Vercel domain in CORS_ALLOWED_ORIGINS.

---

## ✅ Quick Fix (Follow These Steps)

### Step 1: SSH into Your Server

```bash
ssh myrentst@myrentstay.com
```

Enter your password.

### Step 2: Check Current CORS Settings

```bash
# Check if VERCEL_DOMAINS is set
cat /home/myrentst/rentstay_backend/.env | grep VERCEL_DOMAINS
```

**If empty or missing**, continue to Step 3.

### Step 3: Add Vercel Domain to Backend

```bash
# Navigate to backend
cd /home/myrentst/rentstay_backend

# Edit .env file
nano .env
```

**Add this line at the end:**

```env
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 4: Verify the Change

```bash
# Check it was added
cat .env | grep VERCEL_DOMAINS

# Should show:
# VERCEL_DOMAINS=https://rentstay-frontend.vercel.app
```

### Step 5: Restart Backend

```bash
# Still in /home/myrentst/rentstay_backend
touch tmp/restart.txt

# Wait 5 seconds
sleep 5
```

### Step 6: Test Backend CORS

```bash
# Test if backend allows Vercel origin
curl -I -X OPTIONS \
  -H "Origin: https://rentstay-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://myrentstay.com/api/

# Look for this line in output:
# Access-Control-Allow-Origin: https://rentstay-frontend.vercel.app
```

**If you see that line, CORS is fixed!** ✅

### Step 7: Test in Browser

```bash
# Exit SSH
exit
```

Visit: `https://rentstay-frontend.vercel.app`

**Check browser console (F12):**
- No CORS errors = ✅ Fixed!
- Still CORS errors = Continue to troubleshooting below

---

## 🐛 Troubleshooting

### Issue 1: VERCEL_DOMAINS not working

**Check the backend production.py file is reading it:**

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Check production settings
cat /home/myrentst/rentstay_backend/config/settings/production.py | grep -A 5 VERCEL_DOMAINS
```

**Should show:**
```python
VERCEL_DOMAINS = config('VERCEL_DOMAINS', default='', cast=str)
if VERCEL_DOMAINS:
    CORS_ALLOWED_ORIGINS.extend([domain.strip() for domain in VERCEL_DOMAINS.split(',')])
```

**If this code is missing**, we need to add it.

### Issue 2: Backend not restarting

**Try different restart methods:**

```bash
# Method 1: Touch restart file
cd /home/myrentst/rentstay_backend
touch tmp/restart.txt

# Method 2: Restart via cPanel Python App
# Go to cPanel → Setup Python App → Click Restart

# Method 3: Create a new restart.txt
rm tmp/restart.txt
mkdir -p tmp
touch tmp/restart.txt
```

### Issue 3: Wrong domain format

**Ensure exact format:**

✅ Correct:
```env
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app
```

❌ Wrong:
```env
VERCEL_DOMAINS=http://rentstay-frontend.vercel.app  # Wrong protocol
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app/  # Trailing slash
VERCEL_DOMAINS=rentstay-frontend.vercel.app  # Missing https://
```

### Issue 4: Multiple domains

If you also have a custom domain, use comma-separated:

```env
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app,https://app.myrentstay.com
```

**No spaces between domains!**

---

## 🔍 Verify Backend Configuration

### Check DJANGO_ENV

```bash
ssh myrentst@myrentstay.com
cat /home/myrentst/rentstay_backend/.env | grep DJANGO_ENV

# Should show:
# DJANGO_ENV=production
```

### Check CORS Settings are Loading

```bash
cd /home/myrentst/rentstay_backend

# Run Django shell
source /home/myrentst/virtualenv/rentstay_backend/3.11/bin/activate
export DJANGO_ENV=production
python manage.py shell
```

**In Django shell:**
```python
from django.conf import settings
print("CORS Origins:", settings.CORS_ALLOWED_ORIGINS)
# Should include: https://rentstay-frontend.vercel.app

# Exit shell
exit()
```

---

## 📝 Complete Backend .env Example

Your `.env` file should look like this:

```env
# Django
DJANGO_ENV=production
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=myrentstay.com,www.myrentstay.com,91.204.209.33

# Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=myrentst_rentstay_db
DB_USER=myrentst_dbuser
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

# Frontend
FRONTEND_URL=https://app.myrentstay.com

# IMPORTANT: Add this line for Vercel
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app

# Paystack
PAYSTACK_SECRET_KEY=sk_live_your_key
PAYSTACK_PUBLIC_KEY=pk_live_your_key
```

---

## 🧪 Testing CORS from Browser

**Open browser console (F12) on your Vercel app:**

```javascript
// Test CORS
fetch('https://myrentstay.com/api/')
  .then(res => res.json())
  .then(data => console.log('✅ CORS working!', data))
  .catch(err => console.error('❌ CORS error:', err));
```

**Expected result:**
- ✅ Should log API response
- ❌ If CORS error, backend not configured correctly

---

## 🔄 Alternative: Direct CORS Fix

If the .env approach isn't working, edit production.py directly:

```bash
ssh myrentst@myrentstay.com
nano /home/myrentst/rentstay_backend/config/settings/production.py
```

**Find this section:**
```python
CORS_ALLOWED_ORIGINS = [
    config('FRONTEND_URL', default='https://app.myrentstay.com'),
    'https://app.myrentstay.com',
    'https://myrentstay.com',
]
```

**Change to:**
```python
CORS_ALLOWED_ORIGINS = [
    config('FRONTEND_URL', default='https://app.myrentstay.com'),
    'https://app.myrentstay.com',
    'https://myrentstay.com',
    'https://rentstay-frontend.vercel.app',  # Add Vercel domain
]
```

**Save, exit, restart:**
```bash
touch /home/myrentst/rentstay_backend/tmp/restart.txt
```

---

## ✅ Success Checklist

After fixing:

- [ ] VERCEL_DOMAINS in backend .env
- [ ] Backend restarted (tmp/restart.txt touched)
- [ ] No CORS errors in browser console
- [ ] Can register/login from Vercel app
- [ ] API calls working in Network tab
- [ ] States/locations loading

---

## 📞 Quick Commands Reference

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Add Vercel domain
echo 'VERCEL_DOMAINS=https://rentstay-frontend.vercel.app' >> /home/myrentst/rentstay_backend/.env

# Restart backend
touch /home/myrentst/rentstay_backend/tmp/restart.txt

# Exit
exit
```

---

**Your Vercel app is working! Just need to allow it on the backend.** 🎉

Follow Step 1-7 above and you'll be all set!
