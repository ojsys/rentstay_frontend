# Frontend Environment Configuration Guide

This guide explains how environment variables work in your React/Vite frontend.

## 📁 Environment Files

```
frontend/
├── .env                    # Local development (active file)
├── .env.development        # Auto-loaded in dev mode (npm run dev)
├── .env.production         # Auto-loaded in prod mode (npm run build)
└── .env.example           # Template (safe to commit)
```

## 🎯 How It Works

### Development (Local)
```bash
npm run dev
# Vite loads: .env.development
# API points to: http://localhost:8000/api
```

### Production Build
```bash
npm run build
# Vite loads: .env.production
# API points to: https://myrentstay.com/api
```

### Preview Production Build Locally
```bash
npm run build
npm run preview
# Uses production .env but runs locally
```

## 🔧 Configuration Files

### `.env.development` (Local Development)
```env
VITE_API_URL=http://localhost:8000/api
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

**When used:**
- Running `npm run dev`
- Testing locally with Django backend running

### `.env.production` (Production Build)
```env
VITE_API_URL=https://myrentstay.com/api
VITE_API_BASE_URL=https://myrentstay.com
VITE_ENV=production
```

**When used:**
- Running `npm run build`
- Deploying to: https://app.myrentstay.com

## 📝 Using Environment Variables

### In Your Code

```javascript
// src/services/api.js (already configured)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// In any component
const apiUrl = import.meta.env.VITE_API_URL;
const environment = import.meta.env.VITE_ENV;
const isProduction = import.meta.env.PROD; // Vite built-in
const isDevelopment = import.meta.env.DEV; // Vite built-in
```

### Important Rules

1. **Prefix with `VITE_`**: All custom variables must start with `VITE_` to be exposed to your app
2. **No Secrets**: Environment variables are embedded in JavaScript (public)
3. **Build Time**: Variables are replaced at build time, not runtime

## 🔄 Switching Environments

### Option 1: Automatic (Recommended)
```bash
# Development
npm run dev              # Uses .env.development

# Production
npm run build           # Uses .env.production
```

### Option 2: Manual Override
```bash
# Force production mode in development
npm run dev -- --mode production

# Force development mode in build
npm run build -- --mode development
```

### Option 3: Custom Environment
```bash
# Create .env.staging
# Run with: npm run build -- --mode staging
```

## 🎨 Example Usage in Components

```jsx
// Check environment
const isProd = import.meta.env.PROD;
const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  return (
    <div>
      {!isProd && <div>🔧 Development Mode</div>}
      <p>API: {apiUrl}</p>
    </div>
  );
}
```

## 📊 Environment Comparison

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_URL` | http://localhost:8000/api | https://myrentstay.com/api |
| `VITE_API_BASE_URL` | http://localhost:8000 | https://myrentstay.com |
| `VITE_ENV` | development | production |
| `import.meta.env.DEV` | true | false |
| `import.meta.env.PROD` | false | true |

## 🔍 Debugging Environment Variables

### Check What's Loaded

```javascript
// In browser console or component
console.log('All env vars:', import.meta.env);
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Mode:', import.meta.env.MODE);
console.log('Is Dev:', import.meta.env.DEV);
console.log('Is Prod:', import.meta.env.PROD);
```

### During Build

```bash
# See what variables are used
npm run build -- --debug

# Check the built files
cat dist/assets/index-*.js | grep "myrentstay.com"
```

## 🚀 Deployment Workflow

### Local Development
```bash
# 1. Start Django backend
cd backend
python manage.py runserver

# 2. Start React frontend (uses .env.development)
cd frontend
npm run dev

# 3. App runs at: http://localhost:5173
# 4. API calls go to: http://localhost:8000/api
```

### Production Deployment
```bash
# 1. Build (uses .env.production)
npm run build

# 2. Test production build locally
npm run preview

# 3. Upload dist/ to cPanel
scp -r dist/* myrentst@myrentstay.com:/home/myrentst/public_html/app/

# 4. App runs at: https://app.myrentstay.com
# 5. API calls go to: https://myrentstay.com/api
```

## ⚠️ Common Issues

### Issue: API calls still going to localhost after build
**Solution:** Make sure you ran `npm run build`, not `npm run dev`

### Issue: Environment variables are undefined
**Solution:**
- Check variable starts with `VITE_`
- Restart dev server after changing .env files
- Clear cache: `rm -rf node_modules/.vite`

### Issue: Changes to .env not reflecting
**Solution:**
- Stop dev server (Ctrl+C)
- Restart: `npm run dev`
- Vite caches env vars, restart is required

### Issue: Wrong environment loaded
**Solution:**
```bash
# Force rebuild
rm -rf dist node_modules/.vite
npm run build
```

## 🔐 Security Best Practices

1. ✅ **DO**: Commit `.env.example`, `.env.development`, `.env.production`
2. ✅ **DO**: Use test API keys in development
3. ❌ **DON'T**: Put sensitive keys in frontend .env (they're public!)
4. ❌ **DON'T**: Commit `.env` or `.env.local`
5. ❌ **DON'T**: Store backend secrets in frontend env vars

## 📚 Additional Resources

- [Vite Environment Variables Docs](https://vitejs.dev/guide/env-and-mode.html)
- [Environment Best Practices](https://12factor.net/config)

---

**Quick Reference:**

- Local dev: `npm run dev` → http://localhost:5173 → API: localhost:8000
- Production: `npm run build` → https://app.myrentstay.com → API: myrentstay.com
