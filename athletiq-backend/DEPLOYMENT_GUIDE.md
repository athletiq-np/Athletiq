# Athletiq Backend - Deployment Guide

## 🚀 Production Deployment Guide

This guide covers deploying the Athletiq backend to production environments.

## 📋 Prerequisites

- Node.js 16+ installed
- PostgreSQL 12+ database
- Environment variables configured
- SSL certificate (for HTTPS)
- Domain name configured

## 🔧 Production Environment Setup

### 1. Server Requirements

**Minimum System Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 100Mbps

**Recommended System Requirements:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Network: 1Gbps

### 2. Environment Variables

Create a `.env` file in production:

```env
# Production Environment
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=athletiq_production
DB_USER=athletiq_user
DB_PASSWORD=your-super-secure-db-password
DB_MAX_CONNECTIONS=20

# JWT Configuration
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# API Keys
OPENAI_API_KEY=your-openai-api-key-if-using-ocr

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Security
HELMET_CSP_DIRECTIVES=default-src 'self'
```

### 3. Database Setup

```bash
# Create production database
createdb athletiq_production

# Create dedicated database user
psql -c "CREATE USER athletiq_user WITH PASSWORD 'your-secure-password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE athletiq_production TO athletiq_user;"

# Run migrations
npm run migrate
```

### 4. SSL/TLS Configuration

For HTTPS in production, configure SSL certificates:

```bash
# Using Let's Encrypt (recommended)
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com
```

## 🐳 Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S athletiq -u 1001

# Change ownership
RUN chown -R athletiq:nodejs /app
USER athletiq

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_NAME=athletiq
      - DB_USER=athletiq_user
      - DB_PASSWORD=your_secure_password
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=athletiq
      - POSTGRES_USER=athletiq_user
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

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
```

### 3. Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }

        # Static files
        location /uploads/ {
            alias /app/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /api/health {
            access_log off;
            proxy_pass http://app;
        }
    }
}
```

## 🔧 Manual Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/athletiq
sudo chown $USER:$USER /var/www/athletiq
```

### 2. Application Deployment

```bash
# Clone repository
cd /var/www/athletiq
git clone <your-repo-url> .

# Install dependencies
npm ci --only=production

# Set up environment
cp .env.example .env
# Edit .env with production values

# Run database migrations
npm run migrate

# Create uploads directory
mkdir -p uploads/players

# Set proper permissions
chmod 755 uploads
chmod 755 uploads/players
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'athletiq-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

Start the application:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup

# Monitor application
pm2 monit
```

## 🔍 Monitoring & Logging

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs athletiq-backend

# Application metrics
pm2 show athletiq-backend
```

### 2. Database Monitoring

```bash
# PostgreSQL status
sudo systemctl status postgresql

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('athletiq_production'));"
```

### 3. System Monitoring

```bash
# System resources
htop
df -h
free -m

# Network connections
netstat -tlnp | grep 5000
```

## 🛡️ Security Checklist

### Pre-Deployment Security

- [ ] Environment variables configured (no hardcoded secrets)
- [ ] Database credentials secured
- [ ] JWT secret is strong (32+ characters)
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error handling doesn't expose sensitive information

### Post-Deployment Security

- [ ] SSL/TLS certificate installed and working
- [ ] Firewall configured (only necessary ports open)
- [ ] Database access restricted to application server
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

## 🔄 Maintenance Tasks

### Daily

```bash
# Check application status
pm2 status

# Monitor logs for errors
pm2 logs athletiq-backend --lines 50

# Check disk space
df -h
```

### Weekly

```bash
# Update dependencies (after testing)
npm audit
npm update

# Database maintenance
sudo -u postgres vacuumdb athletiq_production

# Log rotation
pm2 flush
```

### Monthly

```bash
# System updates
sudo apt update && sudo apt upgrade

# SSL certificate renewal (if using Let's Encrypt)
sudo certbot renew

# Database backup
pg_dump athletiq_production > backup_$(date +%Y%m%d).sql
```

## 🚨 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
pm2 logs athletiq-backend

# Check environment variables
pm2 show athletiq-backend

# Restart application
pm2 restart athletiq-backend
```

**Database connection issues:**
```bash
# Check database status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U athletiq_user -d athletiq_production
```

**High memory usage:**
```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart athletiq-backend
```

### Performance Issues

**Slow database queries:**
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

**High CPU usage:**
```bash
# Check process usage
top -p $(pgrep -f "athletiq-backend")

# Consider scaling
pm2 scale athletiq-backend +2
```

## 📊 Performance Optimization

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_schools_code ON schools(school_code);

-- Update table statistics
ANALYZE;
```

### Application Optimization

```javascript
// Enable compression
app.use(compression());

// Static file caching
app.use(express.static('public', {
  maxAge: '1y',
  etag: false
}));
```

## 🎯 Scaling Considerations

### Horizontal Scaling

```yaml
# Docker Swarm scaling
version: '3.8'
services:
  app:
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Database Scaling

```bash
# Read replicas for heavy read workloads
# Connection pooling with PgBouncer
# Database partitioning for large tables
```

## 🏁 Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Deployment

- [ ] Application deployed
- [ ] Database migrated
- [ ] SSL configured
- [ ] Monitoring active
- [ ] Health checks passing
- [ ] Performance tested

### Post-Deployment

- [ ] Application accessible
- [ ] All endpoints working
- [ ] Database queries optimized
- [ ] Logs monitored
- [ ] Performance metrics tracked
- [ ] Security scan completed

## 📞 Support & Maintenance

For ongoing support and maintenance:

1. **Documentation**: Keep this deployment guide updated
2. **Monitoring**: Set up alerts for critical issues
3. **Backups**: Automated daily backups
4. **Updates**: Regular security updates
5. **Scaling**: Monitor and scale as needed

The Athletiq backend is now ready for production deployment with enterprise-grade security, monitoring, and scalability features.
