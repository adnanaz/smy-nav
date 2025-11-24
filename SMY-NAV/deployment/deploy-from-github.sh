#!/bin/bash
# SMY-NAV Automated GitHub Deployment Script
# Run this script ON YOUR VPS (103.49.239.37)

set -e

echo "🚀 SMY-NAV Automated GitHub Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="https://github.com/adnanaz/smy-nav.git"
DEPLOY_PATH="/var/www/smy-nav"
BACKUP_PATH="/var/www/smy-nav-backup-$(date +%Y%m%d-%H%M%S)"
WEB_ROOT="/var/www/html"
STORAGE_PATH="/var/www/smy-storage"

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. Make sure this is intended."
fi

# Step 1: Pre-deployment checks
print_step "1. Pre-deployment checks..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Installing..."
    sudo apt update && sudo apt install git -y
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing..."
    npm install -g pm2
fi

print_success "Pre-deployment checks completed"

# Step 2: Backup existing installation
print_step "2. Backing up existing installation..."

if [ -d "$DEPLOY_PATH" ]; then
    print_warning "Existing installation found. Creating backup..."
    
    # Stop services
    pm2 stop all || true
    
    # Backup current installation
    sudo cp -r "$DEPLOY_PATH" "$BACKUP_PATH"
    print_success "Backup created at: $BACKUP_PATH"
    
    # Backup database if exists
    if command -v psql &> /dev/null; then
        DB_BACKUP="/home/$(whoami)/smy_nav_backup_$(date +%Y%m%d-%H%M%S).sql"
        pg_dump smy_nav_production > "$DB_BACKUP" 2>/dev/null || true
        if [ -f "$DB_BACKUP" ]; then
            print_success "Database backup created at: $DB_BACKUP"
        fi
    fi
    
    # Remove old installation
    sudo rm -rf "$DEPLOY_PATH"
else
    print_success "No existing installation found. Fresh deployment."
fi

# Step 3: Clone from GitHub
print_step "3. Cloning from GitHub..."

sudo git clone "$GITHUB_REPO" "$DEPLOY_PATH"
sudo chown -R $USER:$USER "$DEPLOY_PATH"
cd "$DEPLOY_PATH"

print_success "Repository cloned successfully"

# Step 4: Setup environment configuration
print_step "4. Setting up environment configuration..."

read -p "Enter your DATABASE_URL (postgresql://user:pass@localhost:5432/db): " DATABASE_URL
read -s -p "Enter your JWT_SECRET (press enter for auto-generated): " JWT_SECRET
echo ""

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    print_success "Auto-generated JWT_SECRET"
fi

# Create .env file
cat > "$DEPLOY_PATH/.env" << EOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"

# JWT Configuration
JWT_SECRET="$JWT_SECRET"

# Server Configuration
NODE_ENV="production"
PORT="3000"
CORS_ORIGIN="http://103.49.239.37"

# Storage Configuration
LOCAL_STORAGE_API_KEY="Q7iOtX2a7wOoi0Cy7CXYgmW5mZlDOt8CcdpXoqX1"
LOCAL_STORAGE_PATH="$STORAGE_PATH"
LOCAL_STORAGE_URL_BASE="http://103.49.239.37/smy-storage"

# Logging
LOG_LEVEL="info"
EOF

chmod 600 "$DEPLOY_PATH/.env"
print_success "Environment configuration created"

# Step 5: Install dependencies
print_step "5. Installing dependencies..."

# Backend dependencies
cd "$DEPLOY_PATH/backend"
npm install --production
print_success "Backend dependencies installed"

# Frontend build
cd "$DEPLOY_PATH"
npm install
npm run build
print_success "Frontend built successfully"

# Step 6: Setup storage directory
print_step "6. Setting up storage directory..."

sudo mkdir -p "$STORAGE_PATH"
sudo chown -R www-data:www-data "$STORAGE_PATH"
sudo chmod -R 755 "$STORAGE_PATH"

# Create subdirectories
sudo -u www-data mkdir -p "$STORAGE_PATH/smy-nav/participants"
sudo -u www-data mkdir -p "$STORAGE_PATH/smy-nav/documents"
sudo -u www-data mkdir -p "$STORAGE_PATH/smy-nav/certificates"

# Test write permission
TEST_FILE="$STORAGE_PATH/deployment-test-$(date +%s).txt"
if sudo -u www-data touch "$TEST_FILE" 2>/dev/null; then
    sudo rm -f "$TEST_FILE"
    print_success "Storage directory setup completed"
else
    print_error "Failed to setup storage directory permissions"
    exit 1
fi

# Step 7: Deploy frontend
print_step "7. Deploying frontend..."

sudo rm -rf "$WEB_ROOT"/*
sudo cp -r "$DEPLOY_PATH/dist"/* "$WEB_ROOT"/
sudo chown -R www-data:www-data "$WEB_ROOT"
print_success "Frontend deployed successfully"

# Step 8: Database setup
print_step "8. Setting up database..."

cd "$DEPLOY_PATH/backend"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# Seed database (optional)
read -p "Do you want to seed the database with initial data? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:seed || true
    print_success "Database seeded"
fi

print_success "Database setup completed"

# Step 9: Setup PM2 configuration
print_step "9. Setting up PM2 configuration..."

cat > "$DEPLOY_PATH/backend/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'smy-nav-backend',
    script: 'src/server.js',
    cwd: '/var/www/smy-nav/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '../.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    kill_timeout: 5000
  }]
}
EOF

# Create logs directory
mkdir -p "$DEPLOY_PATH/backend/logs"

print_success "PM2 configuration created"

# Step 10: Setup Nginx configuration
print_step "10. Setting up Nginx configuration..."

NGINX_CONFIG="/etc/nginx/sites-available/smy-nav"

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx not found. Installing..."
    sudo apt update && sudo apt install nginx -y
fi

# Create Nginx configuration
sudo tee "$NGINX_CONFIG" > /dev/null << 'EOF'
server {
    listen 80;
    server_name 103.49.239.37;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Backend API
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
        
        # Upload size limit
        client_max_body_size 10M;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file serving for uploads
    location /smy-storage {
        alias /var/www/smy-storage;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        
        # Allow common file types
        location ~* \.(jpg|jpeg|png|gif|pdf|doc|docx)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Frontend static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        
        # Cache settings for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Enable site
sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Step 11: Start services
print_step "11. Starting services..."

# Start PM2
cd "$DEPLOY_PATH/backend"
pm2 start ecosystem.config.js

# Setup PM2 startup
pm2 startup | grep -E "sudo|pm2" | head -1 | bash || true
pm2 save

# Start Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

print_success "Services started successfully"

# Step 12: Final verification
print_step "12. Running verification tests..."

sleep 5  # Wait for services to fully start

# Test API
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "✅ Backend API is responding"
else
    print_warning "⚠️ Backend API might not be responding yet"
fi

# Test frontend
if curl -f -s http://localhost/ > /dev/null 2>&1; then
    print_success "✅ Frontend is accessible"
else
    print_warning "⚠️ Frontend might not be accessible yet"
fi

# Test storage path
if [ -d "$STORAGE_PATH" ]; then
    print_success "✅ Storage directory exists"
else
    print_warning "⚠️ Storage directory issue"
fi

# Step 13: Display final information
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📍 Application URLs:"
echo "   Frontend: http://103.49.239.37"
echo "   Backend API: http://103.49.239.37/api"
echo "   File Storage: http://103.49.239.37/smy-storage"
echo ""
echo "📁 Directories:"
echo "   Application: $DEPLOY_PATH"
echo "   Web Root: $WEB_ROOT"  
echo "   Storage: $STORAGE_PATH"
echo "   Backup: $BACKUP_PATH"
echo ""
echo "🔧 Management Commands:"
echo "   PM2 Status: pm2 status"
echo "   PM2 Logs: pm2 logs smy-nav-backend"
echo "   Nginx Status: sudo systemctl status nginx"
echo "   Nginx Logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🧪 Test Commands:"
echo "   API Health: curl http://103.49.239.37/api/health"
echo "   Frontend: curl http://103.49.239.37"
echo ""
echo "📊 Monitoring:"
echo "   Real-time: pm2 monit"
echo "   System: htop"
echo ""

read -p "Do you want to view PM2 logs now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 logs smy-nav-backend --lines 20
fi

print_success "Deployment script completed! 🚀"
print_warning "Don't forget to make your GitHub repository private again after successful deployment."