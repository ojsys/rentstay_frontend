# Backend Setup for Vercel Frontend

**Configure your Django backend to work with Vercel-hosted frontend**

---

## 🔧 Update Backend CORS Settings

After deploying to Vercel, you'll get a URL like:
```
https://rentstay-frontend.vercel.app
```

And if you add a custom domain:
```
https://app.myrentstay.com
```

### Step 1: Update Backend .env File

**On your cPanel server:**

```bash
# SSH into server
ssh myrentst@myrentstay.com

# Navigate to backend
cd /home/myrentst/rentstay_backend

# Edit .env file
nano .env
```

**Add Vercel domains to VERCEL_DOMAINS variable:**

```env
# Existing variables...
FRONTEND_URL=https://app.myrentstay.com

# Add this new line with your Vercel URLs (comma-separated)
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app,https://rentstay-frontend-git-main-yourname.vercel.app
```

**If you're using custom domain on Vercel:**
```env
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app,https://app.myrentstay.com
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 2: Restart Backend

```bash
# Still on server
cd /home/myrentst/rentstay_backend
touch tmp/restart.txt

# Or restart via cPanel Python App interface
```

### Step 3: Verify CORS Settings

**Test API from Vercel frontend:**
1. Visit your Vercel app
2. Open browser console (F12)
3. Try logging in or making an API call
4. Check for CORS errors
5. If no errors, you're good! ✅

---

## 🌐 Vercel Deployment URLs

Vercel creates different URLs for different environments:

### Production URL
```
https://rentstay-frontend.vercel.app
```
- Main production deployment
- Deployed when you push to `main` branch

### Custom Domain (if configured)
```
https://app.myrentstay.com
```
- Your custom domain pointing to Vercel

### Preview Deployments
```
https://rentstay-frontend-git-[branch-name]-[username].vercel.app
```
- Created automatically for every branch
- Example: `https://rentstay-frontend-git-feature-auth-johndoe.vercel.app`

### Pull Request Previews
```
https://rentstay-frontend-[unique-id].vercel.app
```
- Created for each PR
- Useful for testing before merging

---

## 📝 Complete Backend .env Example

```env
# Django Settings
DJANGO_ENV=production
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=myrentstay.com,www.myrentstay.com,91.204.209.33

# Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=myrentst_rentstay_db
DB_USER=myrentst_dbuser
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=3306

# Frontend URLs
FRONTEND_URL=https://app.myrentstay.com

# Vercel domains (comma-separated, no spaces)
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app,https://app.myrentstay.com

# Paystack
PAYSTACK_SECRET_KEY=sk_live_your_live_key
PAYSTACK_PUBLIC_KEY=pk_live_your_live_key

# Email (if configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@myrentstay.com
EMAIL_HOST_PASSWORD=your-email-password
```

---

## 🔍 Testing CORS Configuration

### Method 1: Browser Console

```javascript
// In your Vercel app, open console (F12) and run:
fetch('https://myrentstay.com/api/')
  .then(res => res.json())
  .then(data => console.log('✅ CORS working!', data))
  .catch(err => console.error('❌ CORS error:', err));
```

### Method 2: Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try logging in or loading data
4. Check response headers:
   - Should see: `Access-Control-Allow-Origin: https://your-vercel-url.vercel.app`
   - Should NOT see CORS errors

### Method 3: curl

```bash
curl -I -X OPTIONS \
  -H "Origin: https://rentstay-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://myrentstay.com/api/

# Should return:
# Access-Control-Allow-Origin: https://rentstay-frontend.vercel.app
# Access-Control-Allow-Credentials: true
```

---

## 🐛 Troubleshooting

### Issue: CORS Error in Vercel App

**Error in console:**
```
Access to fetch at 'https://myrentstay.com/api/' from origin
'https://rentstay-frontend.vercel.app' has been blocked by CORS policy
```

**Solution:**

1. **Check VERCEL_DOMAINS in backend .env:**
   ```bash
   ssh myrentst@myrentstay.com
   cat /home/myrentst/rentstay_backend/.env | grep VERCEL_DOMAINS
   ```

2. **Verify exact URL match:**
   - URL in VERCEL_DOMAINS must EXACTLY match your Vercel URL
   - Include `https://`
   - No trailing slash
   - Match: `https://rentstay-frontend.vercel.app` ✅
   - NOT: `http://rentstay-frontend.vercel.app` ❌
   - NOT: `https://rentstay-frontend.vercel.app/` ❌

3. **Restart backend after changes:**
   ```bash
   touch /home/myrentst/rentstay_backend/tmp/restart.txt
   ```

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

### Issue: Works on Vercel but not on Custom Domain

**Add custom domain to VERCEL_DOMAINS:**

```env
# In backend .env
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app,https://app.myrentstay.com
```

Restart backend.

### Issue: Preview Deployments Not Working

**Option 1: Allow all Vercel subdomains (less secure):**

```env
# In backend .env
VERCEL_DOMAINS=https://rentstay-frontend.vercel.app,https://rentstay-frontend-git-*
```

**Option 2: Update CORS_ALLOWED_ORIGIN_REGEXES (more secure):**

Edit `backend/config/settings/production.py`:

```python
import re

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://rentstay-frontend.*\.vercel\.app$",
]
```

This allows all Vercel preview deployments for your project.

---

## 🔐 Security Considerations

### Production Best Practices

1. **Only allow necessary origins:**
   ```env
   # Good - specific domains
   VERCEL_DOMAINS=https://rentstay-frontend.vercel.app,https://app.myrentstay.com

   # Bad - too permissive
   CORS_ALLOW_ALL_ORIGINS=True  # Never do this in production!
   ```

2. **Use HTTPS only:**
   ```env
   # Good
   VERCEL_DOMAINS=https://app.myrentstay.com

   # Bad - insecure
   VERCEL_DOMAINS=http://app.myrentstay.com
   ```

3. **Keep credentials enabled:**
   ```python
   # In production.py - already configured
   CORS_ALLOW_CREDENTIALS = True
   ```

4. **Monitor CORS logs:**
   ```bash
   # Check for CORS issues
   tail -f /home/myrentst/rentstay_backend/logs/django_errors.log | grep CORS
   ```

---

## ✅ Quick Setup Checklist

After deploying to Vercel:

- [ ] Note your Vercel URL (e.g., `https://rentstay-frontend.vercel.app`)
- [ ] SSH into cPanel server
- [ ] Edit `/home/myrentst/rentstay_backend/.env`
- [ ] Add `VERCEL_DOMAINS` with your Vercel URL
- [ ] Restart backend: `touch tmp/restart.txt`
- [ ] Test CORS from Vercel app
- [ ] Check browser console for errors
- [ ] Verify API calls work

---

## 🎯 Summary

**Backend CORS configuration for Vercel:**

1. **Add VERCEL_DOMAINS to .env:**
   ```env
   VERCEL_DOMAINS=https://your-app.vercel.app,https://app.myrentstay.com
   ```

2. **Restart backend:**
   ```bash
   touch /home/myrentst/rentstay_backend/tmp/restart.txt
   ```

3. **Test from Vercel app:**
   - No CORS errors = ✅ Success!

---

**That's it!** Your Vercel frontend can now communicate with your cPanel backend. 🎉
