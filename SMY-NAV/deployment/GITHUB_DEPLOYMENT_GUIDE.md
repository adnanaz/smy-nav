# SMY-NAV Production Deployment Guide
# Fresh GitHub Deployment Strategy

## 🎯 Recommended Approach: CLEAN FRESH INSTALL

### Why Clean Install?
- ✅ Avoid conflicts with old configuration
- ✅ Ensure latest code and dependencies  
- ✅ Clean environment variables setup
- ✅ Fresh database schema if needed
- ✅ No leftover files or configs

## 📋 Pre-Deployment Checklist

### 1. GitHub Repository
- [ ] Code pushed to main branch
- [ ] Repository is public (temporary)
- [ ] All environment files are NOT committed (.env in .gitignore)
- [ ] Latest storage.js and upload fixes included

### 2. VPS Preparation
- [ ] Backup current database (if has important data)
- [ ] Note down current environment variables
- [ ] Stop current services

### 3. Required Information
- [ ] GitHub repo URL: https://github.com/adnanaz/smy-nav
- [ ] VPS IP: 103.49.239.37
- [ ] Database credentials
- [ ] JWT secrets
- [ ] API keys

## 🔄 Deployment Steps

### Step 1: Access VPS and Backup (if needed)
```bash
ssh user@103.49.239.37

# Backup database if contains important data
pg_dump smy_nav_production > ~/smy_nav_backup_$(date +%Y%m%d).sql

# Backup current environment file (if exists)
cp /path/to/current/.env ~/env_backup_$(date +%Y%m%d).env

# Stop current services
pm2 stop all
sudo systemctl stop nginx  # temporary
```

### Step 2: Clean Install Directory
```bash
# Option A: Complete clean (RECOMMENDED)
sudo rm -rf /var/www/smy-nav-old  # backup old if exists
sudo mv /var/www/smy-nav /var/www/smy-nav-old  # backup current
sudo mkdir -p /var/www/smy-nav
cd /var/www/smy-nav

# Option B: In-place update (if you prefer)
cd /var/www/smy-nav
git stash  # save any local changes
git pull origin main
```

### Step 3: Fresh Clone from GitHub
```bash
# Fresh clone (RECOMMENDED)
cd /var/www
sudo git clone https://github.com/adnanaz/smy-nav.git
sudo chown -R $USER:$USER /var/www/smy-nav
cd /var/www/smy-nav
```

### Step 4: Setup Environment Configuration
```bash
# Create production environment file
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/smy_nav_production"

# JWT Configuration  
JWT_SECRET="your-super-secret-jwt-key-production-2024"

# Server Configuration
NODE_ENV="production"
PORT="3000"
CORS_ORIGIN="http://103.49.239.37"

# Storage Configuration (NEW!)
LOCAL_STORAGE_API_KEY="Q7iOtX2a7wOoi0Cy7CXYgmW5mZlDOt8CcdpXoqX1"
LOCAL_STORAGE_PATH="/var/www/smy-storage"
LOCAL_STORAGE_URL_BASE="http://103.49.239.37/smy-storage"

# Legacy (remove after migration)
# CLOUDINARY_URL="your-old-cloudinary-url"
EOF

# Set proper permissions
chmod 600 .env
```

### Step 5: Install Dependencies
```bash
# Backend
cd /var/www/smy-nav/backend
npm install --production

# Frontend (if building on server)  
cd /var/www/smy-nav
npm install
npm run build

# Copy built frontend to web root
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### Step 6: Setup Storage Directory
```bash
# Run our storage setup script
cd /var/www/smy-nav/deployment
sudo bash setup-production-upload.sh
```

### Step 7: Database Setup
```bash
cd /var/www/smy-nav/backend

# If fresh database
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed

# If restoring from backup
psql -d smy_nav_production -f ~/smy_nav_backup_YYYYMMDD.sql
```

### Step 8: Update PM2 Configuration
```bash
# Copy our ecosystem config
cd /var/www/smy-nav/backend
cat > ecosystem.config.js << 'EOF'
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

# Create logs directory
mkdir -p logs
```

### Step 9: Update Nginx Configuration
```bash
sudo cp /tmp/smy-nav-nginx-sample.conf /etc/nginx/sites-available/smy-nav

# Or update existing
sudo nano /etc/nginx/sites-available/smy-nav

# Test configuration
sudo nginx -t
```

### Step 10: Start Services
```bash
# Start backend
cd /var/www/smy-nav/backend
pm2 start ecosystem.config.js

# Start Nginx
sudo systemctl start nginx
sudo systemctl reload nginx

# Set PM2 to start on boot
pm2 startup
pm2 save
```

### Step 11: Verification Tests
```bash
# Test API
curl http://103.49.239.37/api/health

# Test frontend
curl http://103.49.239.37

# Test storage directory
curl http://103.49.239.37/smy-storage/

# Check PM2 status
pm2 status
pm2 logs smy-nav-backend

# Check Nginx status  
sudo systemctl status nginx
```

## 🧪 Post-Deployment Testing

### Test Upload Functionality
```bash
# Test file upload endpoint
curl -X POST http://103.49.239.37/api/participants/test-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.jpg"
```

### Test Frontend Navigation
1. Open http://103.49.239.37 in browser
2. Login with test account
3. Navigate to participant creation
4. Test file upload
5. Verify uploaded file is accessible

## 🔧 Troubleshooting Common Issues

### Issue 1: Permission Errors
```bash
sudo chown -R www-data:www-data /var/www/smy-storage
sudo chmod -R 755 /var/www/smy-storage
```

### Issue 2: PM2 Environment Variables
```bash
# Check if env is loaded
pm2 show smy-nav-backend

# Restart with explicit env
pm2 restart smy-nav-backend --update-env
```

### Issue 3: Nginx 403/404 on Static Files
```bash
# Check Nginx config syntax
sudo nginx -t

# Check file permissions
ls -la /var/www/html/
ls -la /var/www/smy-storage/
```

### Issue 4: Database Connection
```bash
# Test database connection
psql -d smy_nav_production -c "SELECT version();"

# Check if database exists
psql -l | grep smy_nav
```

## 📊 Monitoring Commands

```bash
# Real-time monitoring
pm2 monit

# Logs
pm2 logs smy-nav-backend --lines 50
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System resources
htop
df -h
free -h
```

## 🎯 Success Criteria

### ✅ Deployment Successful When:
- [ ] API responds: `curl http://103.49.239.37/api/health`
- [ ] Frontend loads: Browser shows login page
- [ ] File upload works: Can upload documents
- [ ] Files accessible: Direct URL access works
- [ ] Authentication works: Can login and navigate
- [ ] Database operations work: Can create/read participants
- [ ] PM2 stable: No crashes or restarts
- [ ] Nginx serving: Both frontend and API working

## 🔒 Security Cleanup

### After Successful Deployment:
1. Make GitHub repository private again
2. Change default passwords/secrets
3. Enable firewall rules if needed
4. Setup SSL certificate (Let's Encrypt)
5. Regular backup schedule

## 🚀 Future Updates

### For Future Deployments:
```bash
# Quick update process
cd /var/www/smy-nav
git pull origin main
cd backend && npm install --production
pm2 restart smy-nav-backend
```

---
**Note:** This guide assumes fresh deployment. Adjust paths and configurations based on your current VPS setup.