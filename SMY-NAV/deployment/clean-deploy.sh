#!/bin/bash

# SMY-NAV Clean Deployment Script
# Run this script on VPS: bash clean-deploy.sh

set -e  # Exit on any error

echo "🚀 SMY-NAV Clean Deployment Started"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Clean up old deployment
print_status "Step 1: Cleaning up old deployment..."
pm2 stop all || true
pm2 delete all || true

# Backup existing deployment
if [ -d "/var/www/smy-nav" ]; then
    print_status "Backing up old deployment..."
    sudo mv /var/www/smy-nav /var/www/smy-nav-backup-$(date +%Y%m%d-%H%M%S) || true
fi

# Remove old nginx config
sudo rm -f /etc/nginx/sites-enabled/smy-nav || true
sudo rm -f /etc/nginx/sites-available/smy-nav || true

print_success "Cleanup completed"

# Step 2: Update system and install dependencies
print_status "Step 2: Installing dependencies..."

# Update system
sudo apt update

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally (if not installed)
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

# Install PostgreSQL (if not installed)
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Install Nginx (if not installed)
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

print_success "Dependencies installed"

# Step 3: Setup PostgreSQL
print_status "Step 3: Setting up PostgreSQL..."

# Set postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'smynav2024';" || true

# Create database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS smy_nav_production;" || true
sudo -u postgres psql -c "CREATE DATABASE smy_nav_production;" || true

print_success "PostgreSQL setup completed"

# Step 4: Clone and setup project
print_status "Step 4: Cloning project from GitHub..."

cd /var/www
sudo git clone https://github.com/adnanaz/smy-nav.git
sudo chown -R $USER:$USER /var/www/smy-nav

cd /var/www/smy-nav

print_success "Project cloned successfully"

# Step 5: Setup environment variables
print_status "Step 5: Setting up environment variables..."

# Backend .env
cat > backend/.env << 'EOF'
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

# Frontend .env
cat > .env.production << 'EOF'
VITE_API_BASE_URL="http://103.49.239.37/api"
EOF

chmod 600 backend/.env
chmod 600 .env.production

print_success "Environment variables configured"

# Step 6: Install dependencies and build
print_status "Step 6: Installing dependencies and building..."

# Install backend dependencies
cd backend
npm install --production
npm audit fix --force || true

# Install frontend dependencies and build
cd ..
npm install
npm run build

# Copy built frontend to web root
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html

print_success "Build completed"

# Step 7: Setup storage directory
print_status "Step 7: Setting up storage directory..."

sudo mkdir -p /var/www/smy-storage/smy-nav/participants
sudo chown -R www-data:www-data /var/www/smy-storage
sudo chmod -R 755 /var/www/smy-storage

print_success "Storage directory setup completed"

# Step 8: Database migration and seeding
print_status "Step 8: Running database migrations..."

cd backend

# Test database connection
psql "postgresql://postgres:smynav2024@localhost:5432/smy_nav_production" -c "SELECT 1;" || {
    print_error "Database connection failed"
    exit 1
}

# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Seed database
node prisma/seed.js

print_success "Database migration completed"

# Step 9: Setup PM2 configuration
print_status "Step 9: Setting up PM2..."

cd /var/www/smy-nav/backend

# Create logs directory
mkdir -p logs

# Create PM2 ecosystem config (CommonJS format)
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'smy-nav-backend',
    script: 'src/server.js',
    cwd: '/var/www/smy-nav/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

print_success "PM2 configuration created"

# Step 10: Setup Nginx configuration
print_status "Step 10: Setting up Nginx..."

sudo tee /etc/nginx/sites-available/smy-nav << 'EOF'
server {
    listen 80;
    server_name 103.49.239.37;
    
    # Increase upload size limit
    client_max_body_size 10M;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # Frontend (Vue.js static files)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
        
        # CORS headers for development
        add_header Access-Control-Allow-Origin "http://103.49.239.37";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "http://103.49.239.37";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
    
    # Handle preflight OPTIONS requests
    location ~ ^/api.*$ {
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "http://103.49.239.37";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
    }
    
    # Storage files
    location /smy-storage {
        alias /var/www/smy-storage;
        add_header Cache-Control "public, max-age=3600";
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        
        # Allow common file types
        location ~* \.(jpg|jpeg|png|gif|pdf|doc|docx)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/rss+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        font/opentype
        image/svg+xml
        image/x-icon
        text/css
        text/plain
        text/x-component;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/smy-nav /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t || {
    print_error "Nginx configuration test failed"
    exit 1
}

print_success "Nginx configuration completed"

# Step 11: Start services
print_status "Step 11: Starting services..."

# Start PM2
cd /var/www/smy-nav/backend
pm2 start ecosystem.config.cjs

# Reload Nginx
sudo systemctl reload nginx

# Save PM2 configuration
pm2 save
pm2 startup | tail -1 | sudo bash || true

print_success "Services started"

# Step 12: Verification tests
print_status "Step 12: Running verification tests..."

sleep 3

# Test PM2 status
print_status "Checking PM2 status..."
pm2 status

# Test API
print_status "Testing API..."
curl -f http://localhost:3000/ || print_warning "Direct API test failed"

# Test through Nginx
print_status "Testing through Nginx..."
curl -f http://103.49.239.37/ || print_warning "Frontend test failed"

# Test storage directory
print_status "Testing storage access..."
curl -I http://103.49.239.37/smy-storage/ || print_warning "Storage access test failed"

print_success "Deployment completed successfully!"

# Final status
echo ""
echo "🎉 SMY-NAV Deployment Summary"
echo "============================="
echo "Frontend URL: http://103.49.239.37"
echo "API Base URL: http://103.49.239.37/api"
echo "Storage URL: http://103.49.239.37/smy-storage"
echo ""
echo "Services Status:"
pm2 status
echo ""
echo "📋 Next Steps:"
echo "1. Test login at: http://103.49.239.37"
echo "2. Create a participant and test upload functionality"
echo "3. Make repository private if needed"
echo "4. Monitor logs: pm2 logs smy-nav-backend"
echo ""

# Save deployment info
cat > /var/www/smy-nav/deployment-info.txt << EOF
SMY-NAV Deployment Information
=============================
Deployment Date: $(date)
Frontend: http://103.49.239.37
API: http://103.49.239.37/api
Storage: http://103.49.239.37/smy-storage
Database: smy_nav_production
PM2 App: smy-nav-backend

Default Admin Account (from seed):
Username: admin
Password: admin123

Commands:
- View logs: pm2 logs smy-nav-backend
- Restart: pm2 restart smy-nav-backend
- Stop: pm2 stop smy-nav-backend
- Nginx reload: sudo systemctl reload nginx
EOF

print_success "Deployment info saved to /var/www/smy-nav/deployment-info.txt"

echo "✅ Clean deployment completed!"