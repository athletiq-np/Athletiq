# Django Error Handling System Guide

This guide explains how to use the new consistent error handling system for Django REST framework responses in the Athletiq frontend.

## Overview

The error handling system provides:
- Consistent error parsing and categorization
- Automatic CSRF token management and refresh
- Standardized user feedback and notifications
- React hooks for easy component integration
- Field-level validation error handling
- Retry functionality for recoverable errors

## Core Components

### 1. Error Handler (`utils/errorHandler.js`)

The main error handling utility that provides:
- `ApiError` class for standardized error objects
- `parseDjangoError()` for parsing Django REST framework responses
- `handleApiError()` for centralized error handling
- Notification functions for user feedback

### 2. CSRF Manager (`utils/csrfManager.js`)

Handles Django CSRF tokens:
- Automatic token retrieval and refresh
- Cookie management
- Request header injection
- Error recovery

### 3. React Hooks (`hooks/useErrorHandler.js`)

Provides React hooks for components:
- `useErrorHandler()` - Basic error handling
- `useFormErrorHandler()` - Form-specific error handling
- `useApiErrorHandler()` - API calls with retry functionality

### 4. UI Components (`components/common/ErrorNotification.js`)

React components for displaying errors:
- `ErrorNotification` - Main error display component
- `SuccessNotification` - Success message component
- `FieldError` - Form field error display
- `LoadingWithError` - Loading state with error handling

## Usage Examples

### Basic Error Handling in Components

```javascript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorNotification } from '@/components/common/ErrorNotification';

const MyComponent = () => {
  const { error, isLoading, executeWithErrorHandling, clearError } = useErrorHandler();

  const handleApiCall = async () => {
    await executeWithErrorHandling(async () => {
      const response = await apiClient.get('/api/data');
      return response.data;
    }, {
      successMessage: 'Data loaded successfully!',
      errorMessage: 'Failed to load data'
    });
  };

  return (
    <div>
      <ErrorNotification error={error} onClose={clearError} />
      <button onClick={handleApiCall} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load Data'}
      </button>
    </div>
  );
};
```

### Form Error Handling

```javascript
import { useFormErrorHandler } from '@/hooks/useErrorHandler';
import { FieldError } from '@/components/common/ErrorNotification';

const MyForm = () => {
  const { 
    isLoading, 
    error, 
    fieldErrors, 
    handleFormSubmit, 
    getFieldError, 
    clearFieldError 
  } = useFormErrorHandler();

  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await handleFormSubmit(async () => {
      const response = await apiClient.post('/api/login', formData);
      return response.data;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (getFieldError(name)) {
      clearFieldError(name);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={getFieldError('email') ? 'border-red-500' : 'border-gray-300'}
        />
        <FieldError error={getFieldError('email')} />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### API Calls with Retry

```javascript
import { useApiErrorHandler } from '@/hooks/useErrorHandler';

const DataComponent = () => {
  const { executeApiCall, retryCount } = useApiErrorHandler();
  const [data, setData] = useState(null);

  const fetchData = async () => {
    await executeApiCall(async () => {
      const response = await apiClient.get('/api/data');
      setData(response.data);
      return response.data;
    }, {
      maxRetries: 3,
      retryDelay: 1000,
      retryCondition: (error) => error.type === 'NETWORK' || error.type === 'SERVER'
    });
  };

  return (
    <div>
      <button onClick={fetchData}>
        Fetch Data {retryCount > 0 && `(Retry ${retryCount})`}
      </button>
    </div>
  );
};
```

## Error Types

The system categorizes errors into these types:

- `NETWORK` - Connection issues, timeouts
- `AUTHENTICATION` - Token expired, invalid credentials
- `AUTHORIZATION` - Insufficient permissions
- `VALIDATION` - Form validation, data format issues
- `CSRF` - Django CSRF token issues
- `SERVER` - Django backend errors (5xx)
- `RATE_LIMIT` - Too many requests (429)
- `NOT_FOUND` - Resource not found (404)
- `UNKNOWN` - Uncategorized errors

## CSRF Token Handling

The system automatically handles Django CSRF tokens:

1. **Automatic Retrieval**: Gets tokens from Django `/api/auth/csrf` endpoint
2. **Cookie Management**: Stores tokens in browser cookies
3. **Request Injection**: Adds tokens to all API requests
4. **Error Recovery**: Refreshes tokens on CSRF failures
5. **FormData Support**: Adds tokens to form submissions

## Configuration

### API Client Setup

The API client is automatically configured with:
- Django-specific headers (`X-Requested-With`, `X-CSRFToken`)
- Credential handling (`withCredentials: true`)
- CSRF cookie names (`csrftoken`, `X-CSRFToken`)
- Automatic token refresh on errors

### Environment Variables

Required environment variables:
- `REACT_APP_API_URL` - Django backend URL (production)
- Development uses proxy configuration in `craco.config.js`

## Best Practices

### 1. Use Appropriate Hooks

- `useErrorHandler()` - General purpose error handling
- `useFormErrorHandler()` - Forms with validation
- `useApiErrorHandler()` - API calls needing retry logic

### 2. Handle Field Errors

Always clear field errors when users start typing:

```javascript
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  
  if (getFieldError(name)) {
    clearFieldError(name);
  }
};
```

### 3. Provide User Feedback

Use the notification components for consistent UX:

```javascript
<ErrorNotification error={error} onClose={clearError} showRetry={true} />
<SuccessNotification message={successMessage} onClose={clearSuccess} />
```

### 4. Handle Loading States

Show loading indicators and disable actions during API calls:

```javascript
<button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### 5. Implement Retry Logic

For network and server errors, provide retry functionality:

```javascript
<ErrorNotification 
  error={error} 
  onClose={clearError} 
  showRetry={true} 
  onRetry={retryFunction} 
/>
```

## Migration from Old Error Handling

### Before (Old System)

```javascript
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  setError('');
  
  try {
    await apiClient.post('/api/data', formData);
    // Handle success
  } catch (error) {
    setError(error?.response?.data?.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

### After (New System)

```javascript
const { isLoading, handleFormSubmit } = useFormErrorHandler();

const handleSubmit = async () => {
  await handleFormSubmit(async () => {
    await apiClient.post('/api/data', formData);
    // Handle success
  }, {
    successMessage: 'Data saved successfully!',
    errorMessage: 'Failed to save data'
  });
};
```

## Troubleshooting

### Common Issues

1. **CSRF Token Errors**: Ensure Django CSRF middleware is enabled and `/api/auth/csrf` endpoint exists
2. **Import Errors**: Check that `@/` alias is configured in `craco.config.js`
3. **Network Errors**: Verify proxy configuration for development environment
4. **Token Refresh Failures**: Check Django JWT token refresh endpoint configuration

### Debug Mode

Enable debug logging by setting:

```javascript
// In your component
const { error } = useErrorHandler({ logErrors: true });
```

This will log detailed error information to the browser console.

## Testing

Error handling can be tested through normal application usage. The error handling system will automatically handle API errors and display appropriate user feedback.

## Integration with Django

### Required Django Endpoints

Ensure these endpoints exist in your Django backend:

- `POST /api/auth/csrf` - Get CSRF token
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Django Settings

Required Django settings:

```python
# CSRF settings
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'

# CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']  # Development

# DRF settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

This error handling system provides a robust, consistent way to handle all Django REST framework responses with proper user feedback and error recovery.