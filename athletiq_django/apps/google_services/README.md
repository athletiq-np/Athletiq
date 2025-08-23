# Google Services Integration

This document describes the comprehensive Google services integration implemented for the Athletiq Django migration project.

## Overview

The Google services integration provides a unified interface to Google Cloud APIs including Vision, Translate, and Maps services. The implementation maintains compatibility with the existing Node.js backend while leveraging Django's robust ecosystem.

## Features Implemented

### 1. Google Vision API Integration
- **Text extraction (OCR)** from images with language hints
- **Document properties detection** including language and orientation
- **Object detection** in images
- **Caching and performance optimization**
- **Error handling and logging**

### 2. Google Translate API Integration
- **Text translation** with source and target language specification
- **Batch translation** for multiple texts
- **Language detection** for automatic source language identification
- **Supported languages** retrieval
- **Translation caching** to reduce API calls and costs
- **Database-backed cache** with automatic cleanup

### 3. Google Maps API Integration
- **Address geocoding** to convert addresses to coordinates
- **Reverse geocoding** to convert coordinates to addresses
- **Places search** with location bias and filtering
- **Place details** lookup with customizable fields
- **Distance calculation** between locations with multiple travel modes
- **Location caching** for frequently accessed places

### 4. Unified Service Management
- **GoogleServiceManager** providing single interface to all services
- **Health checking** and service availability monitoring
- **Lazy loading** of service instances for optimal performance
- **Service status reporting** for monitoring and debugging

## Architecture

### Service Layer Structure
```
apps/google_services/
├── models.py                    # Database models for caching and usage tracking
├── services/
│   ├── base.py                 # Base service class with common functionality
│   ├── vision_service.py       # Google Vision API integration
│   ├── translate_service.py    # Google Translate API integration
│   ├── maps_service.py         # Google Maps API integration
│   └── google_service_manager.py # Unified service manager
├── views.py                    # REST API endpoints
├── serializers.py              # Request/response serializers
├── urls.py                     # URL routing configuration
├── admin.py                    # Django admin interface
└── tests/                      # Comprehensive test suite
```

### Database Models

#### GoogleServiceUsage
Tracks API usage for monitoring and billing:
- Service type (vision, translate, maps)
- Operation performed
- Processing time and response size
- Success/failure status
- User association for usage tracking

#### TranslationCache
Caches translation results to reduce API calls:
- Source and target languages
- Original and translated text
- Confidence scores
- Automatic cache invalidation

#### LocationCache
Caches geocoding and place data:
- Search queries and place IDs
- Formatted addresses and coordinates
- Full Google Places API response data
- Optimized for location-based searches

## API Endpoints

### Translation Services
- `POST /api/google/translate/text/` - Translate single text
- `POST /api/google/translate/batch/` - Translate multiple texts
- `POST /api/google/translate/detect/` - Detect text language
- `GET /api/google/translate/languages/` - Get supported languages

### Vision Services
- `POST /api/google/vision/ocr/` - Extract text from images
- `POST /api/google/vision/document-properties/` - Detect document properties

### Maps Services
- `POST /api/google/maps/geocode/` - Geocode addresses
- `POST /api/google/maps/reverse-geocode/` - Reverse geocode coordinates
- `POST /api/google/maps/places/search/` - Search places
- `GET /api/google/maps/places/{place_id}/` - Get place details

### System Services
- `GET /api/google/status/` - Get service health status

## Configuration

### Environment Variables
```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_MAPS_API_KEY=your-maps-api-key

# Feature Flags
GOOGLE_VISION_ENABLED=True
GOOGLE_TRANSLATE_ENABLED=True
GOOGLE_MAPS_ENABLED=True
```

### Django Settings
```python
# Google Services Configuration
GOOGLE_CLOUD_PROJECT_ID = config('GOOGLE_CLOUD_PROJECT_ID', default='')
GOOGLE_APPLICATION_CREDENTIALS = config('GOOGLE_APPLICATION_CREDENTIALS', default='')
GOOGLE_MAPS_API_KEY = config('GOOGLE_MAPS_API_KEY', default='')

# Service-specific settings
GOOGLE_VISION_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
GOOGLE_TRANSLATE_CACHE_TIMEOUT = 86400 * 7  # 7 days
GOOGLE_MAPS_CACHE_TIMEOUT = 86400 * 30  # 30 days
```

## Usage Examples

### Python Service Usage
```python
from apps.google_services.services.google_service_manager import google_services

# Translate text
result = google_services.translate.translate_text(
    text="Hello world",
    target_language="es",
    source_language="en"
)

# Extract text from image
with open('image.jpg', 'rb') as f:
    image_content = f.read()
    
ocr_result = google_services.vision.extract_text(
    image_content=image_content,
    language_hints=['en']
)

# Geocode address
location = google_services.maps.geocode_address(
    address="1600 Amphitheatre Parkway, Mountain View, CA"
)
```

### API Usage
```bash
# Translate text
curl -X POST http://localhost:8000/api/google/translate/text/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "target_language": "es"}'

# OCR processing
curl -X POST http://localhost:8000/api/google/vision/ocr/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@document.jpg" \
  -F "language_hints=[\"en\"]"

# Geocoding
curl -X POST http://localhost:8000/api/google/maps/geocode/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Amphitheatre Parkway, Mountain View, CA"}'
```

## Performance Optimizations

### Caching Strategy
- **Translation Cache**: Database-backed caching for translation results
- **Location Cache**: Persistent caching for geocoding and place data
- **Redis Integration**: Fast in-memory caching for frequently accessed data
- **Cache Invalidation**: Automatic cleanup of stale cache entries

### Error Handling
- **Graceful Degradation**: Services continue operating when individual APIs are unavailable
- **Retry Logic**: Automatic retry for transient failures
- **Rate Limiting**: Built-in rate limiting to prevent API quota exhaustion
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

### Security Features
- **Authentication Required**: All endpoints require user authentication
- **Input Validation**: Comprehensive validation of all input parameters
- **File Type Validation**: Secure file upload with type and size restrictions
- **API Key Protection**: Secure handling of Google API credentials

## Testing

### Test Coverage
- **Unit Tests**: Individual service components and models
- **Integration Tests**: End-to-end API functionality
- **Mock Testing**: Comprehensive mocking of Google APIs
- **Performance Tests**: Load testing and benchmarking
- **Security Tests**: Authentication and authorization testing

### Running Tests
```bash
# Run all Google services tests
python manage.py test apps.google_services

# Run specific test modules
python manage.py test apps.google_services.tests.test_vision_service
python manage.py test apps.google_services.tests.test_translate_service
python manage.py test apps.google_services.tests.test_maps_service
```

## Monitoring and Analytics

### Usage Tracking
- **API Call Monitoring**: Track all Google API calls with timing and success rates
- **User Analytics**: Associate API usage with specific users
- **Cost Tracking**: Monitor API usage for billing and cost optimization
- **Performance Metrics**: Track response times and error rates

### Health Monitoring
- **Service Status**: Real-time monitoring of Google service availability
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Monitoring**: Track API response times and throughput
- **Resource Usage**: Monitor memory and CPU usage of service components

## Migration Compatibility

### Node.js Compatibility
- **API Response Format**: Maintains identical response structure to Node.js backend
- **Error Handling**: Compatible error codes and messages
- **Authentication**: Uses same JWT token mechanism
- **File Upload**: Compatible multipart/form-data handling

### Database Compatibility
- **Schema Preservation**: Works with existing PostgreSQL database schema
- **Data Migration**: No data migration required for existing records
- **Index Optimization**: Maintains existing database indexes and performance

## Dependencies

### Required Packages
```
google-cloud-vision==3.4.4
google-cloud-translate==3.12.1
googlemaps==4.10.0
```

### Optional Dependencies
- **Redis**: For enhanced caching performance
- **Celery**: For background task processing
- **Sentry**: For error tracking and monitoring

## Deployment Considerations

### Production Setup
1. **Google Cloud Credentials**: Set up service account with appropriate permissions
2. **API Quotas**: Configure appropriate quotas for expected usage
3. **Caching**: Enable Redis for optimal performance
4. **Monitoring**: Set up logging and monitoring for production use
5. **Security**: Ensure proper firewall and access controls

### Scaling Considerations
- **Horizontal Scaling**: Services are stateless and can be scaled horizontally
- **Database Optimization**: Implement database connection pooling
- **Cache Optimization**: Use Redis clustering for high-availability caching
- **Load Balancing**: Distribute API calls across multiple service instances

## Future Enhancements

### Planned Features
- **Google Cloud Storage Integration**: For large file processing
- **Google Analytics Integration**: For usage analytics and reporting
- **Advanced OCR Features**: Support for handwriting recognition and form processing
- **Real-time Translation**: WebSocket-based real-time translation services
- **Batch Processing**: Asynchronous batch processing for large datasets

### Performance Improvements
- **Connection Pooling**: Implement connection pooling for Google APIs
- **Request Batching**: Batch multiple API requests for improved efficiency
- **Predictive Caching**: Implement machine learning-based cache preloading
- **Edge Caching**: Implement CDN-based caching for static responses

This comprehensive Google services integration provides a robust, scalable, and maintainable foundation for the Athletiq Django migration while ensuring full compatibility with the existing Node.js backend.