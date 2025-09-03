# Athletiq Deployment Guide

This guide covers multiple deployment options for your Athletiq project using GitHub.

## Prerequisites

1. **GitHub Repository**: ✅ Already set up at `https://github.com/athletiq-np/Athletiq.git`
2. **Project Structure**: Django backend + React frontend
3. **Database**: PostgreSQL (for production)

## Deployment Options

### Option 1: Railway (Recommended) 🚂

**Best for**: Full-stack deployment with database

#### Backend Deployment on Railway:

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Deploy Backend**:
   ```bash
   # Railway will automatically detect the Django app
   # Set these environment variables in Railway dashboard:
   ```
   
   **Environment Variables**:
   ```
   DATABASE_URL=postgresql://...  # Railway provides this
   REDIS_URL=redis://...          # Railway provides this
   DEBUG=False
   ALLOWED_HOSTS=*.railway.app,yourdomain.com
   SECRET_KEY=your-secret-key
   ```

4. **Deploy Frontend**:
   - Create a new Railway service
   - Set build command: `cd athletiq-frontend && npm run build`
   - Set start command: `npx serve -s build -l 3000`

#### Quick Railway Setup:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy backend
railway deploy --service backend

# Deploy frontend  
railway deploy --service frontend
```

### Option 2: Vercel (Frontend) + Railway (Backend) 🔥

**Best for**: Optimized frontend performance

#### Frontend on Vercel:
1. **Go to [vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure build settings**:
   - Build Command: `cd athletiq-frontend && npm run build`
   - Output Directory: `athletiq-frontend/build`
   - Install Command: `cd athletiq-frontend && npm install`

#### Backend on Railway:
Follow the Railway backend steps above.

### Option 3: Netlify (Frontend) + Railway (Backend) 🌐

#### Frontend on Netlify:
1. **Go to [netlify.com](https://netlify.com)**
2. **Connect GitHub repository**
3. **Build settings**:
   - Build command: `cd athletiq-frontend && npm run build`
   - Publish directory: `athletiq-frontend/build`

### Option 4: Docker Deployment 🐳

**Best for**: Full control and scalability

#### Using Docker Compose:
```bash
# Build and run locally
docker-compose up --build

# For production
docker-compose -f docker-compose.prod.yml up -d
```

#### Deploy to DigitalOcean/AWS/GCP:
1. Push your Docker images to a registry
2. Use the provided docker-compose.yml
3. Set up environment variables

## Environment Configuration

### Backend Environment Variables (.env):
```env
DEBUG=False
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://host:port/0
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourfrontend.vercel.app,https://yourdomain.com

# Email settings (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# File upload settings
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket-name
```

### Frontend Environment Variables (.env):
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## GitHub Actions Setup

Your GitHub Actions workflow is configured to:
1. **Run tests** on both backend and frontend
2. **Build** the applications
3. **Deploy** to your chosen platform

### Required GitHub Secrets:
Go to your repository → Settings → Secrets and add:

```
RAILWAY_TOKEN=your-railway-token
VERCEL_TOKEN=your-vercel-token
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-site-id
```

## Step-by-Step Deployment

### 1. Prepare Your Code
```bash
# Make sure you're on the main branch
git checkout main
git pull origin main

# If deploying from rahul branch:
git checkout main
git merge rahul
git push origin main
```

### 2. Deploy Backend (Railway)
1. Visit [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select `athletiq-np/Athletiq`
4. Railway will detect your Django app
5. Add environment variables in the Railway dashboard
6. Deploy!

### 3. Deploy Frontend (Vercel)
1. Visit [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set root directory to `athletiq-frontend`
4. Add environment variable: `REACT_APP_API_URL=https://your-railway-backend.railway.app`
5. Deploy!

### 4. Configure Database
```bash
# Railway provides PostgreSQL automatically
# Run migrations after first deployment:
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

## Domain Setup (Optional)

### Custom Domain:
1. **Buy a domain** (e.g., from Namecheap, GoDaddy)
2. **Configure DNS**:
   - Frontend: Point to Vercel/Netlify
   - Backend: Point to Railway
3. **Update ALLOWED_HOSTS** in Django settings
4. **Update CORS settings** for new domain

## Monitoring & Maintenance

### Logs:
- **Railway**: Built-in logging dashboard
- **Vercel**: Function logs and analytics
- **GitHub Actions**: Workflow logs

### Database Backups:
- Railway provides automated backups
- Set up additional backup strategies if needed

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   ```python
   # In Django settings
   CORS_ALLOWED_ORIGINS = [
       "https://yourfrontend.vercel.app",
       "https://yourdomain.com",
   ]
   ```

2. **Static Files Not Loading**:
   ```python
   # In Django settings
   STATIC_URL = '/static/'
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   ```

3. **Database Connection Issues**:
   - Check DATABASE_URL format
   - Ensure database is running
   - Check firewall settings

## Next Steps

1. **Deploy using one of the options above**
2. **Set up monitoring** (Sentry, LogRocket)
3. **Configure CI/CD** with GitHub Actions
4. **Set up custom domain**
5. **Add SSL certificate** (automatic with most platforms)

## Support

If you encounter issues:
1. Check the platform-specific documentation
2. Review GitHub Actions logs
3. Check application logs
4. Verify environment variables

---

**Recommendation**: Start with Railway for both backend and frontend, then optimize with Vercel/Netlify for frontend once everything is working.