#!/bin/bash
# Package frontend build for deployment

echo "======================================"
echo "  RentStay Frontend - Package Build"
echo "======================================"

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found. Run 'npm run build' first."
    exit 1
fi

# Create deployment package
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="rentstay-frontend-${TIMESTAMP}.zip"

echo ""
echo "📦 Creating deployment package..."
cd dist
zip -r "../${PACKAGE_NAME}" ./*
cd ..

echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📦 Package: ${PACKAGE_NAME}"
echo "📍 Location: $(pwd)/${PACKAGE_NAME}"
echo ""
echo "📋 Package contents:"
unzip -l "${PACKAGE_NAME}" | head -20
echo ""
echo "======================================"
echo "  Ready for Deployment!"
echo "======================================"
echo ""
echo "Upload this file to your server and extract it in:"
echo "  /home/myrentst/public_html/app.myrentstay.com/"
echo ""
echo "Commands to run on server:"
echo "  cd /home/myrentst/public_html/app.myrentstay.com/"
echo "  unzip ${PACKAGE_NAME}"
echo "  rm ${PACKAGE_NAME}"
echo ""
