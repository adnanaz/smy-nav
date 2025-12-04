#!/bin/bash

# Fix Storage API Key Issue - Run this on VPS
# This script will fix the environment variables and restart backend

echo "🔧 Fixing Storage API Key Issue..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Navigate to backend directory
cd /var/www/smy-nav/SMY-NAV/backend

echo -e "${BLUE}Step 1: Checking current .env file...${NC}"
if [ -f ".env" ]; then
    echo "Current .env content:"
    cat .env
    echo ""
else
    echo "❌ .env file not found!"
fi

echo -e "${BLUE}Step 2: Creating new .env with correct API key...${NC}"

# Create new .env file with the correct API key
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:smynav2024@localhost:5432/smy_nav_production"

# JWT Configuration  
JWT_SECRET="smy-nav-super-secret-jwt-key-production-2024-secure"

# Server Configuration
NODE_ENV="production"
PORT="3000"
CORS_ORIGIN="http://103.49.239.37"

# Storage Configuration
LOCAL_STORAGE_API_KEY="Q7iOtX2a7wOoi0Cy7CXYgmW5mZlDOt8CcdpXoqX1"
LOCAL_STORAGE_PATH="/var/www/smy-storage"
LOCAL_STORAGE_URL_BASE="http://103.49.239.37/smy-storage"
EOF

echo -e "${GREEN}✅ New .env file created${NC}"

echo -e "${BLUE}Step 3: Updating PM2 ecosystem config with environment variables...${NC}"

# Update PM2 config with explicit environment variables
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'smy-nav-backend',
    script: 'src/server.js',
    cwd: '/var/www/smy-nav/SMY-NAV/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'postgresql://postgres:smynav2024@localhost:5432/smy_nav_production',
      JWT_SECRET: 'smy-nav-super-secret-jwt-key-production-2024-secure',
      CORS_ORIGIN: 'http://103.49.239.37',
      LOCAL_STORAGE_API_KEY: 'Q7iOtX2a7wOoi0Cy7CXYgmW5mZlDOt8CcdpXoqX1',
      LOCAL_STORAGE_PATH: '/var/www/smy-storage',
      LOCAL_STORAGE_URL_BASE: 'http://103.49.239.37/smy-storage'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

echo -e "${GREEN}✅ PM2 config updated${NC}"

echo -e "${BLUE}Step 4: Checking storage.js file...${NC}"
if [ -f "src/config/storage.js" ]; then
    echo "Storage.js exists, checking API key validation logic..."
    grep -n "API key" src/config/storage.js || echo "Checking line 42..."
    sed -n '40,45p' src/config/storage.js
else
    echo "❌ storage.js not found!"
fi

echo -e "${BLUE}Step 5: Ensuring storage directory permissions...${NC}"
sudo mkdir -p /var/www/smy-storage/smy-nav/participants
sudo chown -R www-data:www-data /var/www/smy-storage
sudo chmod -R 755 /var/www/smy-storage

echo -e "${BLUE}Step 6: Restarting PM2 backend...${NC}"
pm2 delete smy-nav-backend
pm2 start ecosystem.config.cjs

echo -e "${BLUE}Step 7: Checking PM2 status and environment...${NC}"
pm2 status

echo -e "${BLUE}Step 8: Testing environment variables in running process...${NC}"
sleep 3
pm2 logs smy-nav-backend --lines 10

echo -e "${BLUE}Step 9: Manual environment test...${NC}"
node -e "
console.log('=== Environment Variables Test ===');
console.log('LOCAL_STORAGE_API_KEY:', process.env.LOCAL_STORAGE_API_KEY || 'NOT SET');
console.log('LOCAL_STORAGE_PATH:', process.env.LOCAL_STORAGE_PATH || 'NOT SET');  
console.log('LOCAL_STORAGE_URL_BASE:', process.env.LOCAL_STORAGE_URL_BASE || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
"

echo ""
echo -e "${GREEN}🎯 Fix completed!${NC}"
echo "If you still see API key errors, the issue might be in storage.js validation logic."
echo "Try creating a participant now in the frontend."

echo ""
echo -e "${BLUE}📋 Next steps if still failing:${NC}"
echo "1. Check PM2 logs: pm2 logs smy-nav-backend"
echo "2. Check storage.js line 42 validation logic"
echo "3. Test API manually: curl -X POST http://103.49.239.37/api/participants ..."