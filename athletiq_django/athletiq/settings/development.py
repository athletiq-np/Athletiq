"""
Development settings for Athletiq project.
"""
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Development-specific settings
APPEND_SLASH = False  # Disable automatic slash appending to handle both URL formats

# Database - Use SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ORIGIN_WHITELIST = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# Allow requests from these origins to make cross-origin requests with credentials
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# CSRF settings
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# Session settings
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS

# Allow all methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Allow all headers including custom ones
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-requested-with',
    'x-request-timestamp',
    'x-csrftoken',
    'x-csrftoken',
    'x-requested-with',
    'x-api-key',
    'cache-control',
    'pragma',
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'x-csrftoken',
    'withcredentials',
    'x-requested-with',
    'x-http-method-override',
]

# Allow credentials (cookies, authorization headers) to be included in cross-origin requests
CORS_ALLOW_CREDENTIALS = True

# Expose headers to the browser
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
    'authorization',
]

# CSRF settings for development
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

# Required for CSRF cookie to work with cross-origin requests
CSRF_COOKIE_SAMESITE = 'Lax'  # Changed from 'None' to 'Lax' for better security
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to read CSRF token
CSRF_USE_SESSIONS = False  # Store CSRF token in cookie, not session
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_COOKIE_DOMAIN = None  # Allow cross-domain cookies
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'  # Custom header name for CSRF token

# Allow requests from all hosts in development
ALLOWED_HOSTS = ['*']

# Session settings for development
SESSION_COOKIE_SAMESITE = 'Lax'  # Changed from 'None' to 'Lax' for better security
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access to session cookie
SESSION_COOKIE_DOMAIN = None  # Allow cross-domain cookies
SESSION_COOKIE_PATH = '/'
SESSION_SAVE_EVERY_REQUEST = True  # Save session on every request

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Debug toolbar configuration
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Disable caching in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Development logging
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['athletiq']['level'] = 'DEBUG'

# Static files in development
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files in development
MEDIA_ROOT = BASE_DIR / 'media'

# Development-specific settings
CELERY_TASK_ALWAYS_EAGER = True  # Execute tasks synchronously in development
CELERY_TASK_EAGER_PROPAGATES = True