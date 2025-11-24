#!/bin/bash

# SMY NAV Auto Backup Script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/smy-nav"
DB_NAME="smy_nav_db"
DB_USER="smy_user"

# Create backup directory
sudo mkdir -p $BACKUP_DIR

echo "🗄️ Starting SMY NAV backup process..."

# Database backup
echo "📊 Backing up database..."
sudo -u postgres pg_dump -U $DB_USER -h localhost $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# Application files backup
echo "📁 Backing up application files..."
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" /var/www/smy-nav --exclude=node_modules --exclude=.git

# Nginx configuration backup
echo "🌐 Backing up Nginx config..."
sudo cp /etc/nginx/sites-available/smy-nav "$BACKUP_DIR/nginx_config_$DATE"

# PM2 configuration backup
echo "⚡ Backing up PM2 config..."
pm2 save
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2_config_$DATE.json"

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "nginx_config_*" -mtime +7 -delete
find $BACKUP_DIR -name "pm2_config_*.json" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR"
echo "📊 Backup files:"
ls -lah $BACKUP_DIR/*$DATE*