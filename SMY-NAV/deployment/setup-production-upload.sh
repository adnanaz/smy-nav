#!/bin/bash
# Production Upload Setup Script untuk SMY-NAV
# Run this script on your VPS (Ubuntu 24.04 LTS)

set -e

echo "🚀 Setting up SMY-NAV Production Upload Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. This is okay for setup."
fi

# Step 1: Create storage directory
print_status "Step 1: Creating storage directory..."
if [ ! -d "/var/www/smy-storage" ]; then
    mkdir -p /var/www/smy-storage
    print_status "Created /var/www/smy-storage"
else
    print_status "Directory /var/www/smy-storage already exists"
fi

# Step 2: Set proper ownership
print_status "Step 2: Setting directory ownership..."
chown -R www-data:www-data /var/www/smy-storage
print_status "Set ownership to www-data:www-data"

# Step 3: Set proper permissions
print_status "Step 3: Setting directory permissions..."
chmod -R 755 /var/www/smy-storage
print_status "Set permissions to 755"

# Step 4: Test write permissions
print_status "Step 4: Testing write permissions..."
TEST_FILE="/var/www/smy-storage/setup-test-$(date +%s).txt"
if sudo -u www-data touch "$TEST_FILE" 2>/dev/null; then
    print_status "✅ Write permission test successful"
    rm -f "$TEST_FILE"
else
    print_error "❌ Write permission test failed"
    exit 1
fi

# Step 5: Create subdirectories structure
print_status "Step 5: Creating application subdirectories..."
sudo -u www-data mkdir -p /var/www/smy-storage/smy-nav/participants
sudo -u www-data mkdir -p /var/www/smy-storage/smy-nav/documents  
sudo -u www-data mkdir -p /var/www/smy-storage/smy-nav/certificates
print_status "Created application subdirectories"

# Step 6: Check Nginx installation
print_status "Step 6: Checking Nginx..."
if command -v nginx &> /dev/null; then
    print_status "✅ Nginx is installed"
    nginx -v
else
    print_error "❌ Nginx is not installed. Please install nginx first:"
    echo "sudo apt update && sudo apt install nginx -y"
    exit 1
fi

# Step 7: Check if Nginx config exists
NGINX_CONFIG="/etc/nginx/sites-available/smy-nav"
print_status "Step 7: Checking Nginx configuration..."
if [ -f "$NGINX_CONFIG" ]; then
    print_status "✅ Nginx config exists at $NGINX_CONFIG"
else
    print_warning "⚠️ Nginx config not found. You need to create: $NGINX_CONFIG"
fi

# Step 8: Check PM2
print_status "Step 8: Checking PM2..."
if command -v pm2 &> /dev/null; then
    print_status "✅ PM2 is installed"
    pm2 -v
else
    print_warning "⚠️ PM2 is not installed. Install with:"
    echo "npm install -g pm2"
fi

# Step 9: Display system information
print_status "Step 9: System Information"
echo "================================"
echo "Disk space:"
df -h /var/www
echo ""
echo "Storage directory info:"
ls -la /var/www/smy-storage/
echo ""
echo "Current user: $(whoami)"
echo "System: $(uname -a)"

# Step 10: Generate sample environment file
ENV_FILE="/tmp/smy-nav-production.env"
print_status "Step 10: Generating sample environment configuration..."
cat > "$ENV_FILE" << 'EOF'
# SMY-NAV Production Environment Variables
# Copy these to your actual .env file or PM2 ecosystem config

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smy_nav_production"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Storage Configuration
LOCAL_STORAGE_API_KEY="Q7iOtX2a7wOoi0Cy7CXYgmW5mZlDOt8CcdpXoqX1"
LOCAL_STORAGE_PATH="/var/www/smy-storage"
LOCAL_STORAGE_URL_BASE="http://103.49.239.37/smy-storage"

# Server
NODE_ENV="production"
PORT="3000"

# CORS (adjust for your domain)
CORS_ORIGIN="http://103.49.239.37"
EOF

print_status "Sample environment file created at: $ENV_FILE"

# Step 11: Generate sample Nginx config
NGINX_SAMPLE="/tmp/smy-nav-nginx-sample.conf"
print_status "Step 11: Generating sample Nginx configuration..."
cat > "$NGINX_SAMPLE" << 'EOF'
# SMY-NAV Nginx Configuration
# Copy this to /etc/nginx/sites-available/smy-nav
# Then run: sudo ln -s /etc/nginx/sites-available/smy-nav /etc/nginx/sites-enabled/
# Test: sudo nginx -t
# Reload: sudo nginx -s reload

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
        
        # Upload size limit (adjust as needed)
        client_max_body_size 10M;
        
        # Timeout settings
        proxy_connect_timeout       60s;
        proxy_send_timeout          60s;
        proxy_read_timeout          60s;
    }

    # Static file serving for uploads
    location /smy-storage {
        alias /var/www/smy-storage;
        
        # Cache settings
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Security
        add_header X-Content-Type-Options nosniff;
        
        # Allow common file types
        location ~* \.(jpg|jpeg|png|gif|pdf|doc|docx)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Deny access to sensitive files
        location ~* \.(php|sh|exe)$ {
            deny all;
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

print_status "Sample Nginx config created at: $NGINX_SAMPLE"

# Step 12: Generate PM2 ecosystem config
PM2_CONFIG="/tmp/smy-nav-ecosystem.config.js"
print_status "Step 12: Generating sample PM2 configuration..."
cat > "$PM2_CONFIG" << 'EOF'
// SMY-NAV PM2 Ecosystem Configuration
// Copy this to your project root and run: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'smy-nav-backend',
    script: 'src/server.js',
    cwd: '/path/to/your/smy-nav/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      LOCAL_STORAGE_API_KEY: 'Q7iOtX2a7wOoi0Cy7CXYgmW5mZlDOt8CcdpXoqX1',
      LOCAL_STORAGE_PATH: '/var/www/smy-storage',
      LOCAL_STORAGE_URL_BASE: 'http://103.49.239.37/smy-storage',
      DATABASE_URL: 'postgresql://username:password@localhost:5432/smy_nav_production',
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

print_status "Sample PM2 config created at: $PM2_CONFIG"

# Final summary
echo ""
echo "🎉 Setup Complete! Summary:"
echo "=========================="
echo "✅ Storage directory created: /var/www/smy-storage"  
echo "✅ Proper ownership and permissions set"
echo "✅ Write permission test passed"
echo "✅ Application subdirectories created"
echo ""
echo "📁 Generated configuration files:"
echo "  - Environment variables: $ENV_FILE"
echo "  - Nginx config sample: $NGINX_SAMPLE"  
echo "  - PM2 config sample: $PM2_CONFIG"
echo ""
echo "🔧 Next steps:"
echo "1. Copy and customize the configuration files above"
echo "2. Update your Nginx configuration: sudo cp $NGINX_SAMPLE /etc/nginx/sites-available/smy-nav"
echo "3. Enable the site: sudo ln -s /etc/nginx/sites-available/smy-nav /etc/nginx/sites-enabled/"
echo "4. Test Nginx: sudo nginx -t"
echo "5. Reload Nginx: sudo nginx -s reload"
echo "6. Deploy your backend code"
echo "7. Start with PM2: pm2 start ecosystem.config.js"
echo ""
echo "🧪 Test upload after deployment:"
echo "   curl -X POST http://103.49.239.37/api/test-upload"
echo ""
echo "📊 Monitor:"
echo "   pm2 logs smy-nav-backend"
echo "   tail -f /var/log/nginx/access.log"
echo ""

print_status "Setup script completed successfully! 🚀"