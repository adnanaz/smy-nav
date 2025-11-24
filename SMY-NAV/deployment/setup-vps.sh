#!/bin/bash

# SMY NAV Deployment Script for IDCloudHost VPS
echo "🚀 Starting SMY NAV Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x LTS
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Install PM2 globally
echo "⚡ Installing PM2..."
sudo npm install -g pm2

# Install Git if not present
sudo apt install git -y

# Setup PostgreSQL
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE smy_nav_db;
CREATE USER smy_user WITH PASSWORD 'SMY_nav2024';
GRANT ALL PRIVILEGES ON DATABASE smy_nav_db TO smy_user;
ALTER USER smy_user CREATEDB;
\q
EOF

# Create application directory
echo "📁 Creating application directories..."
sudo mkdir -p /var/www/smy-nav
sudo chown -R $USER:$USER /var/www/smy-nav

echo "✅ System setup complete!"
echo "📝 Next steps:"
echo "1. Upload your application files to /var/www/smy-nav"
echo "2. Run the application setup script"