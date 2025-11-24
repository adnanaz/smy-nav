#!/bin/bash

# Setup cron jobs for SMY NAV maintenance
echo "⏰ Setting up automated maintenance tasks..."

# Make scripts executable
chmod +x /var/www/smy-nav/deployment/*.sh

# Create cron jobs
(crontab -l 2>/dev/null; cat << 'EOF'
# SMY NAV Automated Tasks

# Daily backup at 2 AM
0 2 * * * /var/www/smy-nav/deployment/backup.sh >> /var/log/smy-nav-backup.log 2>&1

# Health check every 15 minutes
*/15 * * * * /var/www/smy-nav/deployment/health-check.sh >> /var/log/smy-nav-health.log 2>&1

# System cleanup every Sunday at 3 AM
0 3 * * 0 apt-get autoremove -y && apt-get autoclean >> /var/log/system-cleanup.log 2>&1

# PM2 log rotation daily at 1 AM
0 1 * * * pm2 flush >> /var/log/pm2-flush.log 2>&1

# Nginx log rotation (handled by logrotate, but we can add custom)
30 1 * * * /usr/sbin/logrotate -f /etc/logrotate.d/nginx >> /var/log/nginx-rotate.log 2>&1
EOF
) | crontab -

echo "✅ Cron jobs setup complete!"
echo ""
echo "📋 Scheduled tasks:"
echo "- Daily backup: 02:00"
echo "- Health check: Every 15 minutes"
echo "- System cleanup: Sunday 03:00"
echo "- PM2 log flush: Daily 01:00"
echo "- Nginx log rotate: Daily 01:30"
echo ""
echo "📝 View current cron jobs: crontab -l"
echo "📊 Check logs: tail -f /var/log/smy-nav-*.log"