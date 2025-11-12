# RentStay Frontend

React + Vite frontend application for RentStay property rental platform.

## 🚀 Live Demo

**Production:** https://app.myrentstay.com

## 🛠️ Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling

## 📋 Prerequisites

- Node.js 16+
- npm or yarn

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Visit: http://localhost:5173
```

The development server automatically uses `.env.development` which points to `http://localhost:8000/api`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The production build automatically uses `.env.production` which points to `https://myrentstay.com/api`

## 🔧 Environment Configuration

### Development (`.env.development`)
```env
VITE_API_URL=http://localhost:8000/api
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

### Production (`.env.production`)
```env
VITE_API_URL=https://myrentstay.com/api
VITE_API_BASE_URL=https://myrentstay.com
VITE_ENV=production
```

**Vite automatically loads the correct file based on the mode:**
- `npm run dev` → loads `.env.development`
- `npm run build` → loads `.env.production`

See `ENV_CONFIG.md` for detailed documentation.

## 🚀 Deployment

### Deploy to cPanel (GitHub Method)

**1. Push to GitHub (if not already done):**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/rentstay-frontend.git
git push -u origin main
```

**2. Deploy on server:**
```bash
# SSH into cPanel
ssh myrentst@myrentstay.com

# Clone repository
cd /home/myrentst/public_html/app
git clone https://github.com/yourusername/rentstay-frontend.git .

# Install and build
npm install
npm run build
cp -r dist/* .
```

**3. Future updates:**
```bash
# On server, run update script
/home/myrentst/public_html/app/update.sh
```

See `DEPLOY_FROM_GITHUB.md` for complete instructions.

## 📜 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code with ESLint
```

## 🎨 Features

- 🔐 Authentication (Login/Register)
- 🏠 Property Listings
- 🔍 Advanced Search & Filters
- 📱 Responsive Design
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast Navigation with React Router
- 📝 Rich Text Editor
- 💳 Payment Integration (Paystack)
- 📧 Messaging System
- 👤 User Profiles

## 📚 Documentation

- **GITHUB_DEPLOYMENT.md** - Complete GitHub deployment guide
- **DEPLOY_FROM_GITHUB.md** - Quick GitHub deployment reference
- **ENV_CONFIG.md** - Environment variable configuration
- **deploy.sh** - Automated deployment script

## 🐛 Troubleshooting

### API Connection Issues

```javascript
// Check environment variables in browser console
console.log(import.meta.env.VITE_API_URL)
```

### Build Issues

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## 🔗 Related Repositories

- **Backend:** Django REST API at https://myrentstay.com/api

## 📄 License

Private - All rights reserved

---

**Built with ❤️ using React + Vite**
