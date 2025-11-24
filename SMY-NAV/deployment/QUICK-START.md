# 🚀 SMY NAV - Quick Deploy ke IDCloudHost

## ⚡ TL;DR - Deploy dalam 30 Menit

### 1. Order VPS IDCloudHost (5 menit)
- Kunjungi: https://idcloudhost.com/
- Pilih **VPS SSD 1GB** (Rp 55.000/bulan)
- OS: Ubuntu 20.04 LTS, Location: Jakarta
- Selesai payment, catat IP & password

### 2. Koneksi & Setup Sistem (10 menit)
```bash
# SSH ke VPS
ssh root@YOUR_VPS_IP

# Download & run setup
curl -sSL https://raw.githubusercontent.com/yourusername/smy-nav/main/deployment/setup-vps.sh | bash
```

### 3. Upload & Deploy App (10 menit)
```bash
# Upload app files (pilih salah satu)

# Cara A: Via Git
cd /var/www/smy-nav
git clone https://github.com/yourusername/smy-nav.git .

# Cara B: Via zip upload ke /var/www/smy-nav

# Deploy aplikasi
./deployment/deploy-app.sh
```

### 4. Setup Domain & SSL (5 menit)
```bash
# Edit config dengan domain Anda
nano /etc/nginx/sites-available/smy-nav

# Restart nginx
systemctl reload nginx

# Setup SSL (jika punya domain)
certbot --nginx -d yourdomain.com
```

### 5. Setup Monitoring
```bash
# Setup automated tasks
./deployment/setup-cron.sh

# Test health check
./deployment/health-check.sh
```

## 🎉 Selesai!

Aplikasi Anda sudah online di:
- **Frontend**: http://YOUR_IP atau https://yourdomain.com
- **Admin Panel**: Login dengan akun yang sudah dibuat
- **Database**: PostgreSQL berjalan lokal di VPS

## 📊 Biaya Total: Rp 55.000/bulan

---

## 🔧 Commands Penting

```bash
# Monitor aplikasi
pm2 status
pm2 logs smy-nav-backend

# Health check
./deployment/health-check.sh

# Update aplikasi
./deployment/update.sh

# Backup manual
./deployment/backup.sh

# Restart services
pm2 restart smy-nav-backend
systemctl reload nginx
```

## 📞 Support

Jika ada masalah:
1. Cek `./deployment/health-check.sh`
2. Lihat logs: `pm2 logs smy-nav-backend`
3. Cek Nginx: `tail -f /var/log/nginx/error.log`

**Happy deploying!** 🚀