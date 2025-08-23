# Design Document

## Overview

This design outlines the simplification and restructuring of the Athletiq frontend to create a clean, production-ready React application that communicates exclusively with the Django backend. The design focuses on removing demo content, consolidating build configurations, optimizing dependencies, and establishing consistent API communication patterns.

## Architecture

### Current State Analysis
- Frontend uses React 18 with CRACO for build configuration
- Multiple API clients and services with mixed backend targets
- Demo/test pages and components scattered throughout
- Complex webpack configuration with many fallbacks
- Proxy setup correctly configured for Django backend (port 8000)

### Target Architecture
- Simplified React application with minimal configuration
- Single API client targeting Django REST framework
- Clean component structure with production-only features
- Optimized build process with reduced bundle size
- Consistent authentication and error handling

## Components and Interfaces

### 1. Build Configuration Simplification

**Current Issues:**
- CRACO configuration has excessive webpack fallbacks for Node.js modules
- Complex alias system that may not be fully utilized
- Redundant configuration between CRACO and potential config-overrides

**Design Solution:**
```javascript
// Simplified craco.config.js
module.exports = {
  devServer: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      '@components': path.resolve(__dirname, 'src/components/'),
      '@pages': path.resolve(__dirname, 'src/pages/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
      '@services': path.resolve(__dirname, 'src/services/'),
      '@hooks': path.resolve(__dirname, 'src/hooks/'),
      '@config': path.resolve(__dirname, 'src/config/')
    }
  }
};
```

### 2. API Client Consolidation

**Current Issues:**
- Multiple API clients (apiClient.js, axios.js) with different configurations
- Guardian API mixed with general API endpoints
- Complex token refresh logic that may not align with Django patterns

**Design Solution:**
- Single API client with Django REST framework integration
- Consistent CSRF token handling for Django
- Simplified authentication flow using Django's token system
- Standardized error handling for Django response formats

```javascript
// Simplified API client structure
const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
});
```

### 3. Component Structure Cleanup

**Components to Remove:**
- `PDFTestPage.jsx` - Demo/test component
- Test-related components in `/src/pages/test/`
- Demo services that don't integrate with Django
- Unused utility functions for deprecated features

**Components to Retain and Simplify:**
- Core authentication components
- Main dashboard components
- Essential feature components (athletes, tournaments, schools, guardians)
- Layout and UI components

### 4. Dependency Optimization

**Dependencies to Remove:**
- `puppeteer` - Server-side PDF generation not needed in frontend
- Unused UI libraries or components
- Development tools not used in production
- Node.js specific packages that were causing webpack issues

**Dependencies to Retain:**
- Core React ecosystem (React, React Router, etc.)
- UI libraries actually used (Radix UI components)
- Essential utilities (axios, lodash, etc.)
- Form handling and validation libraries

## Data Models

### API Response Standardization

**Django REST Framework Response Format:**
```javascript
// Success Response
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "details": { /* validation errors or additional info */ }
}
```

### Authentication Data Model

**Token Storage:**
```javascript
// Simplified token management
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "role": "SuperAdmin|SchoolAdmin|Guardian|Athlete"
  }
}
```

## Error Handling

### Centralized Error Management

**Error Categories:**
1. **Network Errors** - Connection issues, timeouts
2. **Authentication Errors** - Token expiry, invalid credentials
3. **Authorization Errors** - Insufficient permissions
4. **Validation Errors** - Form validation, data format issues
5. **Server Errors** - Django backend errors

**Error Handling Strategy:**
```javascript
// Standardized error handler
const handleApiError = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        // Handle token expiry
        redirectToLogin();
        break;
      case 403:
        // Handle permission errors
        showPermissionError();
        break;
      case 422:
        // Handle validation errors
        return error.response.data.details;
      default:
        // Handle other server errors
        showGenericError(error.response.data.message);
    }
  } else {
    // Handle network errors
    showNetworkError();
  }
};
```

### CSRF Token Management

**Django CSRF Integration:**
- Automatic CSRF token retrieval from Django
- Token refresh on 403 CSRF errors
- Proper cookie handling for cross-site requests

## Testing Strategy

### Unit Testing Focus Areas

1. **API Client Testing**
   - Request/response handling
   - Error scenarios
   - Token refresh logic
   - CSRF token management

2. **Component Testing**
   - Core authentication flows
   - Form validation
   - Error state handling
   - User interaction flows

3. **Integration Testing**
   - API endpoint integration
   - Authentication flow end-to-end
   - Error handling scenarios

### Testing Tools

- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking for tests

## Implementation Phases

### Phase 1: Configuration Cleanup
- Simplify CRACO configuration
- Remove unused webpack fallbacks
- Clean up package.json dependencies
- Remove config-overrides.js if unused

### Phase 2: Component Cleanup
- Remove demo/test components
- Clean up unused services
- Remove deprecated utility functions
- Update import paths

### Phase 3: API Client Consolidation
- Merge multiple API clients into single client
- Standardize Django integration
- Implement consistent error handling
- Update all API calls to use consolidated client

### Phase 4: Dependency Optimization
- Remove unused dependencies
- Update remaining dependencies
- Optimize bundle size
- Clean up import statements

### Phase 5: Testing and Validation
- Test all core functionality
- Validate Django backend integration
- Ensure production build works correctly
- Performance testing and optimization

## Security Considerations

### CSRF Protection
- Proper CSRF token handling for Django
- Secure cookie configuration
- Cross-site request protection

### Authentication Security
- Secure token storage
- Automatic token refresh
- Proper logout handling
- Session management

### Data Validation
- Client-side validation for user experience
- Server-side validation enforcement
- Input sanitization
- XSS protection

## Performance Optimizations

### Bundle Size Reduction
- Remove unused dependencies
- Tree shaking optimization
- Code splitting for large components
- Lazy loading for non-critical routes

### API Performance
- Request caching where appropriate
- Debounced search inputs
- Pagination for large datasets
- Optimistic updates for better UX

### Build Performance
- Simplified webpack configuration
- Reduced build complexity
- Faster development server startup
- Optimized production builds