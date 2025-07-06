# AthletiQ Backend - Production Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment Steps

#### 1. Environment Configuration
```bash
# Copy and configure production environment
cp .env.example .env.production

# Update all production values:
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-password
DB_NAME=athletiq_production
JWT_SECRET=your-very-long-secure-jwt-secret-at-least-32-characters
CORS_ORIGIN=https://your-domain.com
```

#### 2. Database Setup
```bash
# Create production database
createdb athletiq_production

# Run migrations
npm run migrate

# Verify database schema
npm run migrate:verify
```

#### 3. Security Configuration
- [ ] Update CORS origins to production domains only
- [ ] Enable rate limiting for all endpoints
- [ ] Configure secure headers
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules

#### 4. Performance Optimization
- [ ] Enable Redis caching
- [ ] Configure database connection pooling
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression

### Infrastructure Setup

#### Option 1: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S athletiq -u 1001

# Change ownership
RUN chown -R athletiq:nodejs /app
USER athletiq

EXPOSE 5000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:password@db:5432/athletiq
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: athletiq_production
      POSTGRES_USER: athletiq_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Option 2: PM2 Deployment
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'athletiq-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    max_memory_restart: '1G'
  }]
};

# Deploy with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Monitoring Setup

#### 1. Health Monitoring
```bash
# Setup health check endpoint monitoring
curl -f http://localhost:5000/api/health || exit 1

# Add to crontab for regular checks
*/5 * * * * curl -f https://your-domain.com/api/health || echo "Health check failed" | mail -s "AthletiQ Health Alert" admin@your-domain.com
```

#### 2. Log Management
```bash
# Create log directories
mkdir -p /var/log/athletiq
chown -R athletiq:athletiq /var/log/athletiq

# Configure log rotation
# /etc/logrotate.d/athletiq
/var/log/athletiq/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 athletiq athletiq
    postrotate
        pm2 reload athletiq-backend
    endscript
}
```

#### 3. Performance Monitoring
```bash
# Install monitoring tools
npm install -g clinic

# Performance profiling
clinic doctor -- node server.js
clinic bubbleprof -- node server.js
clinic flame -- node server.js
```

### Security Hardening

#### 1. Server Security
```bash
# Update system packages
apt update && apt upgrade -y

# Install fail2ban
apt install fail2ban -y

# Configure firewall
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable

# Disable unused services
systemctl disable apache2
systemctl disable sendmail
```

#### 2. Database Security
```sql
-- Create dedicated database user
CREATE USER athletiq_app WITH PASSWORD 'secure_random_password';

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE athletiq_production TO athletiq_app;
GRANT USAGE ON SCHEMA public TO athletiq_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO athletiq_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO athletiq_app;

-- Enable SSL for database connections
-- In postgresql.conf:
-- ssl = on
-- ssl_cert_file = 'server.crt'
-- ssl_key_file = 'server.key'
```

#### 3. Application Security
```javascript
// Implement additional security middleware
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Progressive delay for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: 500 // Add 500ms delay per request after delayAfter
});

app.use(speedLimiter);
```

### Backup Strategy

#### 1. Database Backups
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/athletiq"
DB_NAME="athletiq_production"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DB_NAME | gzip > $BACKUP_DIR/athletiq_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "athletiq_backup_*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/athletiq_backup_$DATE.sql.gz s3://your-backup-bucket/

echo "Database backup completed: athletiq_backup_$DATE.sql.gz"
```

#### 2. File Backups
```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/athletiq"
APP_DIR="/opt/athletiq"

# Backup uploaded files and configuration
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz $APP_DIR/uploads/ $APP_DIR/.env.production

# Keep only last 7 days of file backups
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +7 -delete

echo "File backup completed: files_backup_$DATE.tar.gz"
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX CONCURRENTLY idx_players_school_id ON players(school_id);

-- Analyze tables for query optimization
ANALYZE;

-- Enable query statistics
-- In postgresql.conf:
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.track = all
```

#### 2. Redis Configuration
```redis
# redis.conf for production

# Memory optimization
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your_redis_password
bind 127.0.0.1

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

### SSL/TLS Setup

#### 1. Let's Encrypt Certificate
```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Obtain certificate
certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

#### 2. Nginx Configuration
```nginx
# /etc/nginx/sites-available/athletiq
server {
    listen 80;
    server_name your-domain.com api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /uploads/ {
        alias /opt/athletiq/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Deployment Automation

#### 1. GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/athletiq
          git pull origin main
          npm ci --production
          npm run migrate
          pm2 reload athletiq-backend
```

### Post-Deployment Verification

#### 1. Health Checks
```bash
# Test all critical endpoints
npm run test:api https://your-domain.com

# Check application health
curl -f https://your-domain.com/api/health

# Verify database connectivity
npm run migrate:status
```

#### 2. Performance Testing
```bash
# Run load tests
npm run test:load https://your-domain.com

# Monitor resource usage
top -p $(pgrep -f "node server.js")
```

#### 3. Security Validation
```bash
# SSL test
ssl-checker your-domain.com

# Security headers test
curl -I https://your-domain.com

# Port scan
nmap -sS -p 1-1000 your-server-ip
```

### Maintenance Tasks

#### 1. Regular Updates
```bash
# Weekly security updates
apt update && apt upgrade -y

# Monthly dependency updates
npm audit fix
npm update

# Database maintenance
psql -d athletiq_production -c "VACUUM ANALYZE;"
```

#### 2. Log Management
```bash
# Check application logs
pm2 logs athletiq-backend

# Monitor error rates
grep "ERROR" /var/log/athletiq/error.log | tail -100

# Disk usage monitoring
df -h
du -sh /var/log/athletiq/*
```

### Troubleshooting Guide

#### Common Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   free -h
   ps aux --sort=-%mem | head
   
   # Restart application
   pm2 restart athletiq-backend
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   systemctl status postgresql
   
   # Check connections
   psql -d athletiq_production -c "SELECT * FROM pg_stat_activity;"
   ```

3. **Slow Response Times**
   ```bash
   # Check database queries
   psql -d athletiq_production -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   
   # Clear Redis cache
   redis-cli FLUSHALL
   ```

### Emergency Procedures

#### 1. Rollback Deployment
```bash
# Rollback to previous version
git reset --hard HEAD~1
npm ci --production
pm2 restart athletiq-backend
```

#### 2. Database Recovery
```bash
# Restore from backup
gunzip < /var/backups/athletiq/athletiq_backup_YYYYMMDD_HHMMSS.sql.gz | psql athletiq_production
```

#### 3. Scale Resources
```bash
# Add more PM2 instances
pm2 scale athletiq-backend +2

# Monitor resource usage
pm2 monit
```

This deployment guide provides a comprehensive framework for deploying AthletiQ backend to production with security, performance, and reliability best practices.
