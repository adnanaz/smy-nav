#!/bin/bash

# SMY NAV Application Deployment Script
echo "🚀 Deploying SMY NAV Application..."

# Navigate to app directory
cd /var/www/smy-nav

# Setup Backend
echo "🔧 Setting up backend..."
cd backend

# Install backend dependencies
npm install --production

# Copy production environment
cp .env.production .env

# Run database migrations
npx prisma generate
npx prisma db push

# Setup frontend build
echo "🎨 Building frontend..."
cd ../frontend
npm install
npm run build

# Move build files to Nginx directory
sudo mkdir -p /var/www/html/smy-nav
sudo cp -r dist/* /var/www/html/smy-nav/

# Setup PM2 for backend
echo "⚡ Setting up PM2..."
cd ../backend
pm2 start npm --name "smy-nav-backend" -- start
pm2 startup
pm2 save

# Setup Nginx configuration
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/smy-nav <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        root /var/www/html/smy-nav;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://\$host";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/smy-nav /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt (optional)
echo "🔒 Installing Certbot for SSL..."
sudo apt install certbot python3-certbot-nginx -y

echo "✅ Deployment complete!"
echo "🌐 Your application is now running at: http://your-domain.com"
echo ""
echo "📋 Next steps:"
echo "1. Point your domain to this server's IP"
echo "2. Run: sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
echo "3. Update frontend environment to use your actual domain"
echo ""
echo "📊 Useful commands:"
echo "- Check backend logs: pm2 logs smy-nav-backend"
echo "- Restart backend: pm2 restart smy-nav-backend"
echo "- Check Nginx status: sudo systemctl status nginx"
echo "- Check Nginx logs: sudo tail -f /var/log/nginx/error.log"