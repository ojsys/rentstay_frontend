# Deploy Profile View Update to Server

The frontend has been successfully built with the new ProfileView design.

## Build Summary
- Build completed successfully ✓
- Output location: `frontend/dist/`
- Total bundle size: ~575 KB (gzipped: ~157 KB)

## Deployment Instructions

### Method 1: Using cPanel File Manager (Recommended)

1. **Access cPanel File Manager**
   - Login to your cPanel
   - Navigate to File Manager

2. **Navigate to Frontend Directory**
   - Go to `/home/myrentst/public_html/app.myrentstay.com/` (or wherever your frontend is deployed)

3. **Upload Build Files**
   - Delete existing files in the directory (EXCEPT .htaccess if you have one)
   - Upload all contents from `frontend/dist/` folder:
     - `index.html`
     - `vite.svg`
     - `assets/` folder (with all CSS and JS files)

4. **Verify Deployment**
   - Visit `https://app.myrentstay.com/profile-view`
   - You should see the new beautiful profile page design

---

### Method 2: Using SSH/Terminal

```bash
# From your local machine, navigate to frontend directory
cd /Users/Apple/projects/rentstay/frontend

# Create a zip of the dist folder
zip -r dist.zip dist/

# Upload to server (replace with your actual server details)
scp dist.zip myrentst@yourdomain.com:/home/myrentst/

# SSH into server
ssh myrentst@yourdomain.com

# On the server:
cd /home/myrentst/public_html/app.myrentstay.com/

# Backup current files (optional)
mkdir -p ../backups
tar -czf ../backups/frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Clear current files (keep .htaccess)
find . -maxdepth 1 ! -name '.htaccess' ! -name '.' ! -name '..' -exec rm -rf {} +

# Extract new build
unzip ~/dist.zip
mv dist/* .
rmdir dist
rm ~/dist.zip

# Set proper permissions
chmod -R 755 .
```

---

### Method 3: Using FTP Client (FileZilla, etc.)

1. Connect to your server via FTP
2. Navigate to `/home/myrentst/public_html/app.myrentstay.com/`
3. Backup existing files (download to your computer)
4. Delete all files except `.htaccess` (if exists)
5. Upload all files from `frontend/dist/` folder
6. Ensure file permissions are set to 755 for folders and 644 for files

---

## What Changed

The ProfileView page now features:
- ✨ Beautiful gradient header with cover photo
- 👤 Large profile picture with verification badge
- 📊 Stats cards showing account type, verification status, and member since
- 🎨 Modern card-based layout with icons
- 📱 Fully responsive design
- 🎯 Better visual hierarchy and user experience
- ✅ Color-coded verification status

---

## Files Modified

- `src/pages/ProfileView.jsx` - Completely redesigned with modern UI

---

## Testing After Deployment

1. Login to your account at `https://app.myrentstay.com/`
2. Navigate to Profile View (usually in the dashboard menu)
3. Verify that:
   - Profile picture displays correctly
   - All information sections are visible
   - Icons appear next to each field
   - Stats cards show correct information
   - Edit Profile button works
   - Page is responsive on mobile devices

---

## Rollback (If Needed)

If something goes wrong, you can restore from backup:

```bash
# On server
cd /home/myrentst/public_html/app.myrentstay.com/
tar -xzf ../backups/frontend-backup-[timestamp].tar.gz
```

---

## Support

If you encounter any issues:
1. Check browser console for errors (F12 → Console tab)
2. Verify all files uploaded correctly
3. Check file permissions (should be 755 for folders, 644 for files)
4. Clear browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)

Deployment ready! 🚀
