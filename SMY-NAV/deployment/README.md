# SMY NAV Deployment Guide for IDCloudHost

## 🎯 Prerequisites
- IDCloudHost VPS SSD 1GB (Rp 55.000/bulan)
- Domain name (optional, bisa pakai IP dulu)
- Cloudinary account untuk file upload

## 📦 Step 1: Order VPS IDCloudHost

1. Kunjungi: https://idcloudhost.com/
2. Pilih **VPS SSD 1GB** - Rp 55.000/bulan
3. Pilih OS: **Ubuntu 20.04 LTS**
4. Location: **Jakarta**
5. Complete payment

## 🔑 Step 2: Access VPS

Setelah VPS aktif, akses via SSH:
```bash
ssh root@your-vps-ip
# Masukkan password yang diberikan IDCloudHost
```

## 🚀 Step 3: Setup System

Upload dan jalankan script setup:
```bash
# Upload setup-vps.sh ke server
chmod +x setup-vps.sh
./setup-vps.sh
```

## 📁 Step 4: Upload Application

### Cara 1: Via Git (Recommended)
```bash
cd /var/www/smy-nav
git clone https://github.com/your-username/smy-nav.git .
```

### Cara 2: Via SCP/SFTP
```bash
# Dari local machine
scp -r SMY-NAV/* root@your-vps-ip:/var/www/smy-nav/
```

## ⚙️ Step 5: Deploy Application

```bash
cd /var/www/smy-nav
chmod +x deployment/deploy-app.sh
./deployment/deploy-app.sh
```

## 🌐 Step 6: Setup Domain (Optional)

### Jika punya domain:
1. Point A record ke IP VPS
2. Update Nginx config dengan domain Anda
3. Setup SSL:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Jika belum punya domain:
- Akses langsung via IP: `http://your-vps-ip`
- Nanti bisa setup domain

## 🔧 Step 7: Configuration

### Update Frontend Environment:
```bash
nano /var/www/smy-nav/frontend/.env.production
# Update VITE_API_BASE_URL dengan domain/IP Anda
```

### Update Backend Environment:
```bash
nano /var/www/smy-nav/backend/.env
# Update CORS_ORIGIN dan database credentials
```

### Rebuild frontend:
```bash
cd /var/www/smy-nav/frontend
npm run build
sudo cp -r dist/* /var/www/html/smy-nav/
```

### Restart services:
```bash
pm2 restart smy-nav-backend
sudo systemctl reload nginx
```

## 📊 Monitoring & Management

### Check Application Status:
```bash
# Backend status
pm2 status
pm2 logs smy-nav-backend

# Nginx status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log

# Database status
sudo systemctl status postgresql
```

### Useful PM2 Commands:
```bash
pm2 restart smy-nav-backend    # Restart backend
pm2 stop smy-nav-backend       # Stop backend
pm2 start smy-nav-backend      # Start backend
pm2 monit                      # Monitor resources
```

## 🔒 Security Hardening

### Setup Firewall:
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (only if needed externally)
```

### Update System Regularly:
```bash
sudo apt update && sudo apt upgrade -y
```

## 💾 Backup Strategy

### Database Backup:
```bash
# Create backup
pg_dump -U smy_user -h localhost smy_nav_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U smy_user -h localhost smy_nav_db < backup_file.sql
```

### Application Backup:
```bash
tar -czf smy_nav_backup_$(date +%Y%m%d).tar.gz /var/www/smy-nav
```

## 🚨 Troubleshooting

### Common Issues:

1. **Backend tidak jalan:**
```bash
pm2 logs smy-nav-backend
# Check error logs and fix accordingly
```

2. **Database connection error:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"  # List databases
```

3. **Nginx error:**
```bash
sudo nginx -t  # Test configuration
sudo tail -f /var/log/nginx/error.log
```

4. **Permission errors:**
```bash
sudo chown -R $USER:$USER /var/www/smy-nav
sudo chmod -R 755 /var/www/smy-nav
```

## 💰 Monthly Costs Breakdown

- **VPS IDCloudHost**: Rp 55.000/bulan
- **Domain (optional)**: Rp 150.000/tahun (~Rp 12.500/bulan)
- **SSL Certificate**: Gratis (Let's Encrypt)
- **Total**: ~Rp 67.500/bulan (dengan domain)

## 📈 Performance Optimization

### For 1GB RAM VPS:
```bash
# Optimize PM2 for low memory
pm2 start npm --name "smy-nav-backend" --max-memory-restart 400M -- start

# Enable swap (if needed)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 🎯 Success Checklist

- [ ] VPS berjalan dan bisa diakses via SSH
- [ ] System dependencies terinstall (Node.js, PostgreSQL, Nginx)
- [ ] Database terbuat dan migrations berhasil
- [ ] Backend berjalan di PM2
- [ ] Frontend ter-build dan tersedia via Nginx
- [ ] Domain/IP bisa diakses dari browser
- [ ] Login system berfungsi
- [ ] File upload ke Cloudinary berjalan
- [ ] SSL certificate aktif (jika pakai domain)

Setelah selesai, aplikasi SMY NAV Anda akan berjalan profesional di server Indonesia dengan biaya hanya Rp 55.000/bulan! 🎉