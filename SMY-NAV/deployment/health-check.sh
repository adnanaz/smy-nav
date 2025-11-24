#!/bin/bash

# SMY NAV Health Check & Monitoring Script
echo "🔍 SMY NAV System Health Check"
echo "================================"

# Check system resources
echo "📊 System Resources:"
echo "RAM Usage: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
echo "Load Average: $(uptime | awk -F'[a-z]:' '{ print $2}')"
echo ""

# Check services
echo "🔧 Service Status:"

# PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL: Running"
else
    echo "❌ PostgreSQL: Not running"
fi

# Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Not running"
fi

# PM2 Backend
if pm2 describe smy-nav-backend | grep -q "online"; then
    echo "✅ Backend (PM2): Running"
else
    echo "❌ Backend (PM2): Not running"
fi

echo ""

# Check database connection
echo "🗄️ Database Check:"
if sudo -u postgres psql -d smy_nav_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection: OK"
    USER_COUNT=$(sudo -u postgres psql -d smy_nav_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    PARTICIPANT_COUNT=$(sudo -u postgres psql -d smy_nav_db -t -c "SELECT COUNT(*) FROM participants;" 2>/dev/null | tr -d ' ')
    echo "   Users: $USER_COUNT"
    echo "   Participants: $PARTICIPANT_COUNT"
else
    echo "❌ Database connection: Failed"
fi

echo ""

# Check application endpoints
echo "🌐 Application Health:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_STATUS" == "200" ]; then
    echo "✅ Backend API: Healthy (HTTP $BACKEND_STATUS)"
else
    echo "❌ Backend API: Unhealthy (HTTP $BACKEND_STATUS)"
fi

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" == "200" ]; then
    echo "✅ Frontend: Accessible (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend: Not accessible (HTTP $FRONTEND_STATUS)"
fi

echo ""

# Check logs for errors
echo "📝 Recent Error Logs:"
ERROR_COUNT=$(sudo tail -100 /var/log/nginx/error.log 2>/dev/null | grep -c "$(date +%Y/%m/%d)" 2>/dev/null || echo "0")
echo "Nginx errors today: $ERROR_COUNT"

PM2_ERRORS=$(pm2 logs smy-nav-backend --lines 50 --nostream 2>/dev/null | grep -i error | wc -l 2>/dev/null || echo "0")
echo "PM2 backend errors (last 50 lines): $PM2_ERRORS"

# Check disk space warning
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo ""
    echo "⚠️  WARNING: Disk usage is $DISK_USAGE%. Consider cleaning up."
fi

# Check memory usage warning
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2 }')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo ""
    echo "⚠️  WARNING: Memory usage is $MEMORY_USAGE%. Consider optimizing."
fi

echo ""
echo "🕐 Check completed at: $(date)"

# If all critical services are running, return 0, otherwise 1
if systemctl is-active --quiet postgresql && systemctl is-active --quiet nginx && pm2 describe smy-nav-backend | grep -q "online"; then
    exit 0
else
    exit 1
fi