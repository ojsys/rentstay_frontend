#!/bin/bash

# Frontend Deployment Script for RentStay
# Builds and deploys the frontend to cPanel

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="myrentst"
SERVER_HOST="myrentstay.com"
SERVER_PATH="/home/myrentst/public_html/app"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  RentStay Frontend Deployment${NC}"
echo -e "${BLUE}======================================${NC}"

# Step 1: Clean previous build
echo -e "\n${GREEN}[1/5]${NC} Cleaning previous build..."
rm -rf dist

# Step 2: Verify production environment
echo -e "${GREEN}[2/5]${NC} Verifying production environment..."
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production not found!${NC}"
    exit 1
fi

echo "API URL configured in .env.production:"
grep VITE_API_URL .env.production

# Step 3: Build for production
echo -e "\n${GREEN}[3/5]${NC} Building frontend for production..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed! dist/ directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"
echo "Build size:"
du -sh dist/

# Step 4: Upload to server
echo -e "\n${GREEN}[4/5]${NC} Uploading to server..."
echo "Target: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

# Upload dist contents
scp -r dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

# Upload .htaccess
scp .htaccess ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo -e "${GREEN}Upload complete!${NC}"

# Step 5: Verify deployment
echo -e "\n${GREEN}[5/5]${NC} Deployment complete!"
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
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
