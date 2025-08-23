# Athletiq Django Backend

This is the Django REST Framework backend for the Athletiq sports tournament management system, migrated from Node.js/Express while preserving all existing functionality and API compatibility.

## Features

- **Complete API Compatibility**: All endpoints maintain the same URL structure and response formats as the original Node.js backend
- **Authentication**: JWT-based authentication with role-based permissions (SuperAdmin, SchoolAdmin, Guardian)
- **School Management**: School registration, profile management, and admin user creation
- **Tournament Management**: Tournament creation, registration, bracket generation, and match scheduling
- **Athlete Management**: Athlete registration, profile management, and document handling
- **Guardian Portal**: Guardian registration, athlete claiming, and document management
- **Document Processing**: PDF generation for scoresheets and certificates, OCR text extraction
- **File Upload**: Secure file upload with validation and processing
- **Background Tasks**: Asynchronous processing using Celery
- **Monitoring**: Performance monitoring, health checks, and error tracking

## Technology Stack

- **Framework**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL (existing schema preserved)
- **Cache**: Redis
- **Background Tasks**: Celery
- **Authentication**: JWT (SimpleJWT)
- **File Processing**: Pillow, ReportLab, Google Vision API
- **External Services**: Twilio (SMS), Google APIs, Email services

## Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 12+
- Redis 6+
- Node.js (for frontend)

### Installation

1. **Clone and setup the project:**
   ```bash
   cd athletiq_django
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and service credentials
   ```

3. **Setup database:**
   ```bash
   # The Django models are designed to work with the existing PostgreSQL schema
   python manage.py migrate
   ```

4. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

5. **Run development server:**
   ```bash
   python manage.py runserver
   ```

6. **Start Celery (in another terminal):**
   ```bash
   celery -A athletiq worker -l info
   ```

### Frontend Integration

The Django backend is designed to be a drop-in replacement for the Node.js backend. The React frontend should work without any modifications:

1. **Update frontend API URL** (if needed):
   ```javascript
   // In athletiq-frontend/src/utils/apiClient.js
   const apiClient = axios.create({
     baseURL: 'http://localhost:8000/api',  // Django default port
     // ... rest of configuration remains the same
   });
   ```

2. **Start the React frontend:**
   ```bash
   cd athletiq-frontend
   npm start
   ```

## Project Structure

```
athletiq_django/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── athletiq/                 # Main Django project
│   ├── settings/            # Environment-specific settings
│   ├── urls.py              # Main URL configuration
│   ├── wsgi.py              # WSGI application
│   └── asgi.py              # ASGI application
├── apps/                    # Django applications
│   ├── authentication/      # User authentication and JWT
│   ├── schools/            # School management
│   ├── tournaments/        # Tournament management
│   ├── athletes/           # Athlete management
│   ├── guardians/          # Guardian portal
│   ├── matches/            # Match scheduling and results
│   ├── documents/          # File upload and PDF generation
│   ├── common/             # Shared utilities
│   └── monitoring/         # Health checks and monitoring
├── core/                   # Core utilities and middleware
│   ├── middleware/         # Custom middleware
│   ├── exceptions.py       # Error handling
│   └── pagination.py       # API pagination
├── static/                 # Static files
├── media/                  # Uploaded files
└── tests/                  # Test suite
```

## API Endpoints

All endpoints maintain compatibility with the original Node.js API:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/guardian/auth/login` - Guardian login
- `POST /api/guardian/auth/register` - Guardian registration

### Schools
- `POST /api/schools/register` - School registration
- `GET /api/schools/me` - Get school profile
- `PATCH /api/schools/me` - Update school profile
- `GET /api/schools/me/tournaments` - Get school tournaments
- `GET /api/schools/me/athletes` - Get school athletes

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/{id}` - Get tournament details
- `POST /api/tournaments/{id}/register` - Register for tournament

### Athletes
- `GET /api/athletes` - List athletes
- `POST /api/athletes` - Create athlete
- `GET /api/athletes/{id}` - Get athlete details
- `PUT /api/athletes/{id}` - Update athlete

### Documents
- `POST /api/upload/document` - Upload document
- `POST /api/pdf/scoresheet` - Generate scoresheet PDF
- `POST /api/pdf/certificate` - Generate certificate PDF
- `POST /api/ocr/extract` - Extract text from image

## Development

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.schools

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Code Quality

```bash
# Format code
black .
isort .

# Lint code
flake8 .
```

### Database Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

## Deployment

### Production Settings

1. **Set environment variables:**
   ```bash
   export DJANGO_SETTINGS_MODULE=athletiq.settings.production
   export SECRET_KEY=your-production-secret-key
   export DEBUG=False
   export ALLOWED_HOSTS=your-domain.com
   ```

2. **Collect static files:**
   ```bash
   python manage.py collectstatic
   ```

3. **Run with Gunicorn:**
   ```bash
   gunicorn athletiq.wsgi:application
   ```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "athletiq.wsgi:application"]
```

## Migration from Node.js

This Django backend is designed as a drop-in replacement for the Node.js backend:

1. **Database Compatibility**: Django models map to existing PostgreSQL schema
2. **API Compatibility**: All endpoints return the same JSON structure
3. **Authentication Compatibility**: JWT tokens work with existing frontend
4. **File Compatibility**: Uploaded files remain in the same directory structure
5. **Feature Parity**: All existing features are preserved

### Migration Checklist

- [ ] Database connection configured
- [ ] Environment variables set
- [ ] Static files configured
- [ ] Media files accessible
- [ ] External services configured (Twilio, Google APIs)
- [ ] Background tasks running (Celery)
- [ ] Frontend API URL updated
- [ ] SSL certificates configured (production)

## Support

For issues and questions:
1. Check the existing Node.js implementation for reference
2. Review Django and DRF documentation
3. Check logs in `/var/log/athletiq/` (production) or console (development)

## License

This project maintains the same license as the original Athletiq system.