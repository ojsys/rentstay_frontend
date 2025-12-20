#!/bin/bash

# ============================================================================
# Deploy Mobile-Optimized Frontend
# ============================================================================
# This script builds and packages the mobile-friendly frontend for deployment
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=================================================="
echo "Mobile-Optimized Frontend Deployment"
echo "==================================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Step 1: Cleaning previous build...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo "✓ Previous build cleaned"
else
    echo "✓ No previous build found"
fi
echo ""

echo -e "${YELLOW}Step 2: Installing dependencies (if needed)...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi
echo ""

echo -e "${YELLOW}Step 3: Building production frontend...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully!${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Creating deployment package...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="rentstay-frontend-${TIMESTAMP}.zip"

cd dist
zip -r "../${PACKAGE_NAME}" ./*
cd ..

echo -e "${GREEN}✓ Package created: ${PACKAGE_NAME}${NC}"
echo ""

# Get package size
PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)

echo -e "${GREEN}=================================================="
echo "Deployment Package Ready!"
echo "==================================================${NC}"
echo ""
echo "Package: ${PACKAGE_NAME}"
echo "Size: ${PACKAGE_SIZE}"
echo ""
echo -e "${YELLOW}What's New:${NC}"
echo "  ✓ Complete mobile navigation redesign"
echo "  ✓ All user menu items accessible on mobile"
echo "  ✓ Organized sections with headers"
echo "  ✓ User profile header with avatar"
echo "  ✓ Touch-friendly tap targets"
echo "  ✓ Smooth animations and transitions"
echo "  ✓ Body scroll prevention when menu open"
echo "  ✓ PWA-ready meta tags"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Upload to server:"
echo -e "   ${BLUE}scp ${PACKAGE_NAME} your-user@your-server.com:/home/myrentst/${NC}"
echo ""
echo "2. SSH to server:"
echo -e "   ${BLUE}ssh your-user@your-server.com${NC}"
echo ""
echo "3. Deploy (on server):"
echo -e "   ${BLUE}cd /home/myrentst/public_html${NC}"
echo -e "   ${BLUE}# Backup existing (optional)${NC}"
echo -e "   ${BLUE}mv rentstay-frontend rentstay-frontend-backup-\$(date +%Y%m%d)${NC}"
echo -e "   ${BLUE}# Extract new build${NC}"
echo -e "   ${BLUE}mkdir -p rentstay-frontend${NC}"
echo -e "   ${BLUE}unzip ~/${PACKAGE_NAME} -d rentstay-frontend${NC}"
echo -e "   ${BLUE}chmod -R 755 rentstay-frontend${NC}"
echo ""
echo "4. Test on mobile:"
echo "   - Open site on phone or use browser dev tools"
echo "   - Click hamburger menu (☰)"
echo "   - Verify all menu items appear"
echo "   - Test navigation and scrolling"
echo ""
echo -e "${GREEN}Deployment package ready at: $(pwd)/${PACKAGE_NAME}${NC}"
echo ""
