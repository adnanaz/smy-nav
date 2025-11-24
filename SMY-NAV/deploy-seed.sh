#!/bin/bash

# Deploy Seed Script to Production Server
# Usage: ./deploy-seed.sh

SERVER_IP="103.49.239.37"
SERVER_USER="root"
APP_DIR="/root/smy-nav-app/backend"

echo "🚀 Deploying seed script to production server..."

# 1. Upload seed file
echo "📤 Uploading seed.js to production..."
scp backend/prisma/seed.js $SERVER_USER@$SERVER_IP:$APP_DIR/prisma/

# 2. SSH to server and run seed
echo "🌱 Running database seed on production..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /root/smy-nav-app/backend

echo "📋 Current directory: $(pwd)"
echo "📋 Checking seed file..."
ls -la prisma/seed.js

echo "🌱 Running seed script..."
yarn db:seed

echo "✅ Seed completed on production!"
ENDSSH

echo "🎉 Database seeding completed on production server!"
echo ""
echo "📋 You can now login with these credentials:"
echo "👑 Super Admin: admin@smy-nav.com / password123"
echo "🏢 Agency Example: agent@judipinten.com / password123"
echo ""
echo "🌐 Website: http://103.49.239.37"