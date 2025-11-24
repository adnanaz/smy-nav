#!/bin/bash

# Deploy Database Seed to Production VPS
# Run this script from your LOCAL terminal

echo "🌱 Deploying database seed to production VPS..."

# VPS Configuration
VPS_IP="103.49.239.37"
VPS_USER="aerysm"
APP_DIR="/var/www/smy-nav/smy-nav/SMY-NAV"
BACKEND_DIR="$APP_DIR/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📤 Step 1: Uploading seed.js to VPS...${NC}"

# Upload seed file to VPS
scp backend/prisma/seed.js $VPS_USER@$VPS_IP:$BACKEND_DIR/prisma/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed file uploaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to upload seed file${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Step 2: Running seed on production database...${NC}"

# Connect to VPS and run seed
ssh $VPS_USER@$VPS_IP << EOF
    echo "📍 Connected to VPS: \$(hostname)"
    
    # Navigate to backend directory
    cd $BACKEND_DIR
    
    echo "📂 Current directory: \$(pwd)"
    
    # Check if seed file exists
    if [ ! -f "prisma/seed.js" ]; then
        echo "❌ Seed file not found!"
        exit 1
    fi
    
    echo "🌱 Running database seed..."
    
    # Run the seed
    yarn db:seed
    
    if [ \$? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seed completed successfully!${NC}"
        echo ""
        echo "🎉 Production database is now ready with:"
        echo "👑 Super Admin account"
        echo "🏢 21 Agency accounts"
        echo ""
        echo "🔗 You can now test login at: http://$VPS_IP"
    else
        echo -e "${RED}❌ Database seed failed!${NC}"
        exit 1
    fi
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎊 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎊${NC}"
    echo ""
    echo -e "${YELLOW}📋 Production Login Credentials:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}👑 SUPER ADMIN:${NC}"
    echo "   Email: admin@smy-nav.com"
    echo "   Username: superadmin" 
    echo "   Password: password123"
    echo ""
    echo -e "${BLUE}🏢 AGENCY ACCOUNTS (contoh):${NC}"
    echo "   Email: agent@judipinten.com"
    echo "   Email: agent@nurcholish.com"
    echo "   Email: agent@mandiri.com"
    echo "   Password: password123 (semua sama)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}🌐 Test login at: http://$VPS_IP${NC}"
else
    echo -e "${RED}❌ Deployment failed! Check the error messages above.${NC}"
    exit 1
fi