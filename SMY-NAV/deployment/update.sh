#!/bin/bash

# SMY NAV Update Script
echo "🔄 Starting SMY NAV update process..."

# Backup before update
echo "💾 Creating backup before update..."
./deployment/backup.sh

# Navigate to app directory
cd /var/www/smy-nav

# Pull latest changes (if using Git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes from Git..."
    git pull origin main
fi

# Update backend
echo "🔧 Updating backend..."
cd backend
npm install --production
npx prisma generate
npx prisma db push

# Update frontend
echo "🎨 Building new frontend..."
cd ../frontend
npm install
npm run build

# Deploy new frontend
sudo cp -r dist/* /var/www/html/smy-nav/

# Restart services
echo "🔄 Restarting services..."
pm2 restart smy-nav-backend
sudo systemctl reload nginx

# Health check
echo "🔍 Running health check..."
cd ..
./deployment/health-check.sh

if [ $? -eq 0 ]; then
    echo "✅ Update completed successfully!"
    echo "🌐 Application is healthy and running"
else
    echo "❌ Update completed but some services might have issues"
    echo "📝 Check logs for details"
fi

echo "🕐 Update completed at: $(date)"