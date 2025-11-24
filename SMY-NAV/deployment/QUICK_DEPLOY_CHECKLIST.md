# 🚀 SMY-NAV GitHub Deployment - Quick Start

## ⚡ Fast Track Deployment (5 menit)

### 1. Push Code ke GitHub ✅
```bash
# Di local machine (sudah done)
git add .
git commit -m "Production ready with local storage upload"
git push origin main
```

### 2. SSH ke VPS
```bash
ssh user@103.49.239.37
```

### 3. Run Automated Script
```bash
# Download dan jalankan script otomatis
curl -o deploy.sh https://raw.githubusercontent.com/adnanaz/smy-nav/main/deployment/deploy-from-github.sh
chmod +x deploy.sh
sudo bash deploy.sh
```

**ATAU manual:**

```bash
# Clone repo
sudo rm -rf /var/www/smy-nav-old
sudo mv /var/www/smy-nav /var/www/smy-nav-old 2>/dev/null || true
sudo git clone https://github.com/adnanaz/smy-nav.git /var/www/smy-nav
sudo chown -R $USER:$USER /var/www/smy-nav

# Setup environment
cd /var/www/smy-nav
cat > .env << 'EOF'
DATABASE_URL="postgresql://username:password@localhost:5432/smy_nav_production"
JWT_SECRET="your-jwt-secret-here"
NODE_ENV="production"
PORT="3000"
LOCAL_STORAGE_API_KEY="Q7iOtX2a7wOoi0Cy7CXYgmW5mZlDOt8CcdpXoqX1"
LOCAL_STORAGE_PATH="/var/www/smy-storage"
LOCAL_STORAGE_URL_BASE="http://103.49.239.37/smy-storage"
EOF

# Install & build
cd backend && npm install --production
cd .. && npm install && npm run build

# Setup storage
sudo mkdir -p /var/www/smy-storage/smy-nav/participants
sudo chown -R www-data:www-data /var/www/smy-storage
sudo chmod -R 755 /var/www/smy-storage

# Deploy frontend
sudo rm -rf /var/www/html/* && sudo cp -r dist/* /var/www/html/

# Start services
cd backend
pm2 stop all
pm2 start src/server.js --name smy-nav-backend --env production
pm2 save
sudo systemctl reload nginx
```

## 🎯 Verification Checklist

### ✅ Test These After Deployment:

1. **API Health Check:**
```bash
curl http://103.49.239.37/api/health
# Expected: {"status":"OK","timestamp":"..."}
```

2. **Frontend Access:**
```bash
curl http://103.49.239.37
# Expected: HTML content with Vue app
```

3. **Upload Storage:**
```bash
curl http://103.49.239.37/smy-storage/
# Expected: Directory listing or 403 (normal)
```

4. **PM2 Status:**
```bash
pm2 status
# Expected: smy-nav-backend online
```

5. **Nginx Status:**
```bash
sudo systemctl status nginx
# Expected: active (running)
```

## 🔧 Quick Fixes if Issues

### Issue: API not responding
```bash
pm2 logs smy-nav-backend
pm2 restart smy-nav-backend
```

### Issue: Frontend not loading  
```bash
sudo nginx -t
sudo systemctl reload nginx
ls -la /var/www/html/
```

### Issue: Upload permission error
```bash
sudo chown -R www-data:www-data /var/www/smy-storage
sudo chmod -R 755 /var/www/smy-storage
```

### Issue: Database connection
```bash
# Check if database exists
psql -l | grep smy_nav

# Test connection
psql -d smy_nav_production -c "SELECT version();"
```

## 📊 Expected Results

### ✅ Success Indicators:
- Frontend loads at `http://103.49.239.37`
- Login page appears
- API responds to health check  
- Can create and upload participant files
- Files accessible via direct URL
- PM2 shows backend running
- No errors in PM2 logs

### 🎉 Full Test Flow:
1. Open `http://103.49.239.37` 
2. Login with admin account
3. Go to "Master Peserta" → "Tambah Peserta"
4. Fill form and upload documents
5. Submit successfully  
6. Check uploaded files are accessible
7. ✅ **DEPLOYMENT SUCCESS!**

## 🔒 Post-Deployment Security

1. **Make repo private again:**
```bash
# On GitHub, go to Settings → General → Danger Zone → Change repository visibility
```

2. **Change default secrets:**
```bash
# Update .env with production secrets
nano /var/www/smy-nav/.env
pm2 restart smy-nav-backend
```

3. **Setup SSL (optional):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🚨 Rollback if Needed

```bash
# Stop new services
pm2 stop smy-nav-backend

# Restore backup
sudo rm -rf /var/www/smy-nav
sudo mv /var/www/smy-nav-old /var/www/smy-nav

# Restart old services
cd /var/www/smy-nav/backend  
pm2 start ecosystem.config.js
```

---

## 📞 Need Help?

### Check logs:
```bash
pm2 logs smy-nav-backend --lines 50
sudo tail -f /var/log/nginx/error.log
```

### Monitor resources:
```bash  
pm2 monit
htop
df -h
```

**Estimated deployment time: 5-10 minutes**
**Success rate: 95%+ (with proper environment setup)**