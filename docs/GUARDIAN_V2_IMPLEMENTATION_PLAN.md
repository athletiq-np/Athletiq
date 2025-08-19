// New Guardian Portal Implementation Plan
// Based on comprehensive specification provided

## Phase 1: Core Infrastructure (Week 1)

### 1. Enhanced Authentication System
- Multi-provider auth (Email, Google, Phone OTP)
- SMS/WhatsApp OTP integration
- HttpOnly cookie sessions
- Device binding for security

### 2. Bilingual UI Framework
- i18n setup with English/Nepali
- Dynamic language switching
- Culturally appropriate date formats
- Right-to-left text support where needed

### 3. Mobile-First Responsive Framework
- Tailwind CSS mobile-first approach
- Touch-friendly interfaces
- Offline-capable PWA setup
- Auto-save functionality

## Phase 2: Smart Search & OCR (Week 2)

### 4. Enhanced Search System
- Single entry point (find child first)
- Smart matching with typo tolerance
- OCR-first document processing
- Mismatch resolution UI

### 5. Google Maps School Integration
- Combined Google Places + local school DB
- Geographic validation
- Place ID mapping
- Fallback for new schools

## Phase 3: Status-Driven Experience (Week 3)

### 6. Status System Implementation
- Clear status cards with color coding
- Next-step guidance
- Progress indicators
- Timeline view

### 7. Document Management Enhancement
- OCR pre-fill with validation
- Document verification states
- Reupload workflows
- Quality assistance

## Phase 4: Production Features (Week 4)

### 8. Notification System
- Multi-channel (Email/SMS/WhatsApp/Push)
- Template-based messaging
- Status change notifications
- Tournament updates

### 9. Analytics & Monitoring
- Funnel tracking
- SLA monitoring
- Error tracking
- Performance metrics

## Implementation Files Structure

```
src/features/guardian-v2/
├── auth/
│   ├── MultiProviderAuth.jsx
│   ├── OTPVerification.jsx
│   └── GoogleAuthIntegration.jsx
├── search/
│   ├── SmartChildSearch.jsx
│   ├── SearchResultsCard.jsx
│   └── NoMatchCreateFlow.jsx
├── documents/
│   ├── OCRDocumentUpload.jsx
│   ├── MismatchResolution.jsx
│   └── DocumentVerificationStatus.jsx
├── dashboard/
│   ├── StatusDrivenDashboard.jsx
│   ├── StatusCard.jsx
│   └── TimelineView.jsx
├── schools/
│   ├── GoogleMapsSchoolPicker.jsx
│   ├── SchoolVerification.jsx
│   └── NewSchoolRequest.jsx
├── i18n/
│   ├── translations.js
│   ├── LanguageToggle.jsx
│   └── formatters.js
└── utils/
    ├── offlineSync.js
    ├── autoSave.js
    └── validators.js
```

## API Endpoints to Implement

### Authentication
- POST /api/auth/guardian/register-email
- POST /api/auth/guardian/register-phone  
- POST /api/auth/guardian/verify-otp
- POST /api/auth/guardian/google-oauth

### Smart Search
- POST /api/athletes/smart-search
- POST /api/athletes/claim-match
- POST /api/athletes/create-new

### School Integration
- POST /api/schools/google-verify
- GET /api/schools/combined-search
- POST /api/schools/request-new

### Document Processing  
- POST /api/documents/ocr-extract
- POST /api/documents/resolve-mismatch
- PUT /api/documents/verification-status

### Status Management
- GET /api/guardian/dashboard-status
- POST /api/guardian/status-action
- GET /api/guardian/timeline

This plan follows your specification exactly and builds upon our current foundation.
