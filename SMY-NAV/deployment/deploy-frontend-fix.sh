#!/bin/bash

# Deploy Frontend dengan Environment Variables yang Benar
# Run this script from your LOCAL terminal

echo "🚀 Deploying frontend with corrected API URL..."

# VPS Configuration
VPS_IP="103.49.239.37"
VPS_USER="aerysm"
APP_DIR="/var/www/smy-nav/smy-nav/SMY-NAV"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Step 1: Building frontend with production environment...${NC}"

# Build frontend with production environment
yarn build --mode production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build completed${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${BLUE}📤 Step 2: Uploading build to VPS...${NC}"

# Upload dist folder to VPS (to temp location first, then move with sudo)
rsync -avz --delete dist/ $VPS_USER@$VPS_IP:~/frontend-build/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend uploaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to upload frontend${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Step 3: Moving files to correct location and restarting Nginx...${NC}"

# Move files to correct location and restart Nginx
ssh $VPS_USER@$VPS_IP << EOF
    echo "� Creating frontend directory..."
    sudo mkdir -p $APP_DIR/dist
    
    echo "�🔄 Moving files to correct location..."
    sudo cp -r ~/frontend-build/* $APP_DIR/dist/
    
    echo "🔄 Restarting Nginx..."
    sudo systemctl restart nginx
    sudo systemctl status nginx --no-pager -l
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎊 FRONTEND DEPLOYMENT COMPLETED! 🎊${NC}"
    echo ""
    echo -e "${YELLOW}📋 Updated Configuration:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}🌐 Frontend URL: http://$VPS_IP${NC}"
    echo -e "${BLUE}🔗 API URL: http://$VPS_IP:5000${NC}"
    echo ""
    echo -e "${YELLOW}🔑 Test Login Credentials:${NC}"
    echo "   Email: admin@smy-nav.com"
    echo "   Username: superadmin" 
    echo "   Password: password123"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✅ Ready to test login!${NC}"
else
    echo -e "${RED}❌ Deployment failed! Check the error messages above.${NC}"
    exit 1
fi