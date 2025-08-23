# Athletiq Django Security Middleware

This document describes the comprehensive security middleware implementation for the Athletiq Django application, designed to match and enhance the security features from the existing Node.js backend.

## Overview

The security middleware provides multiple layers of protection including:

- **Rate Limiting**: Prevents abuse by limiting requests per time window
- **Input Sanitization**: Protects against XSS and injection attacks
- **Security Headers**: Adds comprehensive security headers to responses
- **Request Logging**: Structured logging compatible with Winston format
- **Security Event Monitoring**: Detects and logs suspicious activities

## Middleware Components

### 1. SecurityMiddleware

Adds comprehensive security headers and CORS configuration.

**Features:**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- Referrer Policy and Cross-Origin policies
- CORS headers for API endpoints

**Configuration:**
```python
# In settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002",
]

CORS_ALLOW_CREDENTIALS = True
```

### 2. RateLimitingMiddleware

Provides advanced rate limiting with different limits for different endpoint types.

**Rate Limits:**
- **General API**: 1000 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **Password Reset**: 5 requests per 1 hour
- **File Upload**: 50 requests per 15 minutes
- **Admin**: 200 requests per 15 minutes
- **Create Operations**: 100 requests per 15 minutes

**Features:**
- User-based and IP-based rate limiting
- Automatic endpoint type detection
- Rate limit headers in responses
- Configurable limits per environment

**Headers Added:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: When the rate limit resets

### 3. InputSanitizationMiddleware

Protects against XSS and injection attacks by sanitizing input data.

**Features:**
- HTML escaping of string values
- Removal of dangerous patterns (script tags, event handlers)
- Recursive sanitization of nested data structures
- JSON and form data sanitization

**Dangerous Patterns Removed:**
- `<script>` tags
- `javascript:` and `vbscript:` protocols
- Event handlers (`onload`, `onerror`, `onclick`)

### 4. RequestLoggingMiddleware

Provides structured logging compatible with the existing Winston format.

**Features:**
- Request/response logging with timing
- Structured JSON logging format
- Request ID tracking
- User context in logs
- Performance monitoring

**Log Format:**
```json
{
  "level": "info",
  "message": "GET /api/tournaments/",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "request": {
    "method": "GET",
    "url": "/api/tournaments/?page=1",
    "path": "/api/tournaments/",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "requestId": "uuid-123",
    "userId": 42
  },
  "response": {
    "statusCode": 200,
    "contentLength": 1024,
    "duration": "150.25ms"
  },
  "meta": {
    "service": "athletiq-django",
    "environment": "development"
  }
}
```

### 5. SecurityEventLoggingMiddleware

Detects and logs security-related events for monitoring and alerting.

**Detected Events:**
- SQL injection attempts
- XSS attempts
- Path traversal attempts
- Authentication failures
- Admin access

**Event Severities:**
- **High**: SQL injection, path traversal
- **Medium**: XSS attempts, authentication failures
- **Low**: Admin access

## Installation and Configuration

### 1. Add to MIDDLEWARE in settings.py

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'core.middleware.security.SecurityMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.auth.JWTAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.request_id.RequestIDMiddleware',
    'core.middleware.logging.RequestLoggingMiddleware',
    'core.middleware.logging.SecurityEventLoggingMiddleware',
    'core.middleware.security.RateLimitingMiddleware',
    'core.middleware.security.InputSanitizationMiddleware',
    'core.middleware.performance.PerformanceMiddleware',
]
```

### 2. Configure Cache for Rate Limiting

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
```

### 3. Configure Logging

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '{message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'athletiq.log',
            'formatter': 'json',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'json',
        },
    },
    'loggers': {
        'security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

STRUCTURED_LOGGING = True
```

## Environment Variables

```bash
# Performance
SLOW_REQUEST_THRESHOLD=1.0

# Logging
STRUCTURED_LOGGING=true
ENVIRONMENT=development

# Cache/Redis
REDIS_URL=redis://127.0.0.1:6379/1

# CORS (production)
ALLOWED_ORIGINS=https://athletiq.com,https://app.athletiq.com
```

## Testing

The middleware includes comprehensive tests covering:

- Security header validation
- Rate limiting enforcement
- Input sanitization effectiveness
- Logging format verification
- Security event detection

Run tests with:
```bash
python manage.py test core.middleware.tests
```

## Monitoring and Alerting

### Log Files

- **athletiq.log**: General application logs
- **security.log**: Security events and alerts
- **error.log**: Error-level events

### Metrics to Monitor

- Rate limit violations per endpoint
- Security events by type and severity
- Request response times
- Authentication failure rates

### Recommended Alerts

1. **High Severity Security Events**: Immediate alert
2. **Rate Limit Violations**: Alert if > 100/hour from single IP
3. **Authentication Failures**: Alert if > 50/hour
4. **Slow Requests**: Alert if > 10% requests exceed threshold

## Performance Impact

The middleware is designed for minimal performance impact:

- **Rate Limiting**: ~1-2ms per request (with Redis)
- **Input Sanitization**: ~0.5-1ms per request
- **Security Headers**: ~0.1ms per request
- **Logging**: ~0.5ms per request (async recommended)

## Compatibility

This middleware maintains full compatibility with:

- Existing React frontend
- Node.js API response formats
- JWT authentication tokens
- File upload workflows
- CORS requirements

## Security Best Practices

1. **Rate Limiting**: Adjust limits based on usage patterns
2. **Input Sanitization**: Always validate on both client and server
3. **Logging**: Monitor logs regularly for security events
4. **Headers**: Keep CSP policies updated as frontend evolves
5. **Cache**: Use Redis for production rate limiting
6. **SSL**: Enable HSTS in production with proper SSL setup

## Troubleshooting

### Common Issues

1. **Rate Limit False Positives**: Check if user-based limiting is working
2. **CORS Errors**: Verify allowed origins configuration
3. **Input Sanitization Too Aggressive**: Adjust patterns if needed
4. **Performance Issues**: Enable Redis caching for rate limiting

### Debug Mode

Set `DEBUG=True` and `STRUCTURED_LOGGING=False` for development debugging.

### Monitoring Commands

```bash
# Check rate limit cache
python manage.py shell -c "from django.core.cache import cache; print(cache.keys('rate_limit:*'))"

# View recent security events
tail -f logs/security.log | jq '.'

# Monitor request performance
tail -f logs/athletiq.log | jq '.response.duration'
```