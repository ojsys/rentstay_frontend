#!/bin/bash

# Setup Frontend as Standalone GitHub Repository
# This script prepares your frontend for GitHub deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Frontend GitHub Repository Setup${NC}"
echo -e "${BLUE}======================================${NC}"

# Step 1: Get GitHub repository URL
echo -e "\n${YELLOW}Step 1: GitHub Repository${NC}"
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/rentstay-frontend.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}Error: Repository URL is required!${NC}"
    exit 1
fi

echo -e "${GREEN}Repository URL: ${REPO_URL}${NC}"

# Step 2: Create standalone frontend directory
echo -e "\n${YELLOW}Step 2: Creating standalone frontend directory${NC}"

CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
NEW_DIR="${PARENT_DIR}/rentstay-frontend"

echo "Current directory: ${CURRENT_DIR}"
echo "New directory: ${NEW_DIR}"

read -p "Create frontend repository at ${NEW_DIR}? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

# Create new directory
mkdir -p "${NEW_DIR}"

# Step 3: Copy frontend files
echo -e "\n${YELLOW}Step 3: Copying frontend files${NC}"

# Copy all files
cp -r "${CURRENT_DIR}"/* "${NEW_DIR}/"

# Copy hidden files (dotfiles)
shopt -s dotglob
for file in "${CURRENT_DIR}"/.*; do
    filename=$(basename "$file")
    if [ "$filename" != "." ] && [ "$filename" != ".." ]; then
        cp -r "$file" "${NEW_DIR}/" 2>/dev/null || true
    fi
done

echo -e "${GREEN}Files copied successfully!${NC}"

# Step 4: Initialize git repository
echo -e "\n${YELLOW}Step 4: Initializing Git repository${NC}"

cd "${NEW_DIR}"
git init

echo -e "${GREEN}Git repository initialized!${NC}"

# Step 5: Create/verify .gitignore
echo -e "\n${YELLOW}Step 5: Verifying .gitignore${NC}"

if [ -f ".gitignore" ]; then
    echo ".gitignore exists"
    cat .gitignore
else
    echo "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules
package-lock.json

# Build output
dist
dist-ssr

# Environment variables
.env
.env.local
.env.*.local

# Allow environment templates
!.env.example
!.env.development
!.env.production

# Logs
logs
*.log
npm-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Misc
*.local
EOF
fi

# Step 6: Stage all files
echo -e "\n${YELLOW}Step 6: Staging files for commit${NC}"

git add .

# Show status
git status

# Step 7: Create initial commit
echo -e "\n${YELLOW}Step 7: Creating initial commit${NC}"

git commit -m "Initial commit: RentStay Frontend

- React + Vite application setup
- Tailwind CSS for styling
- Environment configuration (dev/prod)
- API integration with Django backend
- Deployment scripts and documentation
- React Router for navigation
- Authentication and state management"

echo -e "${GREEN}Initial commit created!${NC}"

# Step 8: Add remote and push
echo -e "\n${YELLOW}Step 8: Connecting to GitHub${NC}"

git remote add origin "${REPO_URL}"

echo "Attempting to push to GitHub..."
echo "You may be prompted for credentials."

git branch -M main

if git push -u origin main; then
    echo -e "${GREEN}Successfully pushed to GitHub!${NC}"
else
    echo -e "${YELLOW}Push failed. You may need to:${NC}"
    echo "1. Authenticate with GitHub"
    echo "2. Create a Personal Access Token"
    echo "3. Try pushing manually:"
    echo "   cd ${NEW_DIR}"
    echo "   git push -u origin main"
fi

# Step 9: Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Frontend repository location:"
echo -e "${GREEN}${NEW_DIR}${NC}"
echo ""
echo "GitHub repository:"
echo -e "${GREEN}${REPO_URL}${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Verify your code is on GitHub:"
echo "   Visit: ${REPO_URL%.git}"
echo ""
echo "2. Deploy to cPanel (SSH into server):"
echo "   ssh myrentst@myrentstay.com"
echo "   cd /home/myrentst/public_html/app"
echo "   git clone ${REPO_URL} ."
echo "   npm install"
echo "   npm run build"
echo "   cp -r dist/* ."
echo ""
echo "3. For future updates, see:"
echo "   ${NEW_DIR}/GITHUB_DEPLOYMENT.md"
echo ""
echo -e "${BLUE}Happy deploying! 🚀${NC}"
