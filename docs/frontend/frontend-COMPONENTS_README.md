# AthletiQ Frontend Components

This document describes the React components built for the AthletiQ platform frontend.

## Overview

The AthletiQ frontend uses a modern component architecture with:
- **React 18** for the core framework
- **shadcn/ui** for the design system
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Component Architecture

### UI Components (shadcn/ui)

The following shadcn/ui components are installed and configured:

- `Button` - Primary actions and interactions
- `Card` - Content containers
- `Input` - Form inputs
- `Form` - Form handling with validation
- `Table` - Data display
- `Badge` - Status indicators
- `Alert` - Notifications and messages
- `Progress` - Loading and progress indicators
- `Select` - Dropdown selections
- `DropdownMenu` - Action menus
- `Textarea` - Multi-line text input
- `Sheet` - Side panels
- `Tabs` - Tab navigation
- `Label` - Form labels
- `Dialog` - Modal dialogs
- `Separator` - Visual separators

### Custom Components

#### Admin Components

##### `AdminLayout`
- **Location**: `src/components/layout/AdminLayout.jsx`
- **Purpose**: Main admin interface with navigation and routing
- **Features**:
  - Responsive sidebar navigation
  - User menu and notifications
  - Page routing and content management
  - Authentication handling

##### `AdminDashboard`
- **Location**: `src/components/features/admin/AdminDashboard.jsx`
- **Purpose**: Admin dashboard with system overview
- **Features**:
  - Statistics cards (users, documents, processing rate)
  - Recent documents table
  - Document action management (approve, reject, delete)
  - Real-time status updates

##### `AnalyticsDashboard`
- **Location**: `src/components/features/admin/AnalyticsDashboard.jsx`
- **Purpose**: Analytics and metrics visualization
- **Features**:
  - Time range filtering
  - Key performance indicators
  - Data breakdowns by type, status, location
  - Recent activity feed
  - Chart placeholders (ready for Chart.js/Recharts integration)

##### `DocumentUpload`
- **Location**: `src/components/features/admin/DocumentUpload.jsx`
- **Purpose**: File upload with drag & drop functionality
- **Features**:
  - Drag & drop interface
  - Multiple file selection
  - Progress tracking
  - File validation (type, size)
  - Status management (pending, uploading, completed, error)
  - Integration with backend API

#### Player Components

##### `PlayerProfile`
- **Location**: `src/components/features/player/PlayerProfile.jsx`
- **Purpose**: Player information and document management
- **Features**:
  - Editable profile information
  - Document upload and management
  - Status tracking
  - Athletic information (sport, position, team)
  - Athlete ID display

#### Layout Components

##### `AdminNavigation`
- **Location**: `src/components/layout/AdminNavigation.jsx`
- **Purpose**: Navigation wrapper for admin interface
- **Features**:
  - Responsive sidebar with mobile menu
  - User authentication display
  - Notification system
  - Search functionality
  - Page navigation

## API Integration

### Authentication
Components use JWT tokens stored in `localStorage` for API authentication:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### API Endpoints
Components integrate with the following backend endpoints:

- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/documents` - Document list
- `POST /api/documents/upload` - File upload
- `GET /api/players/:id` - Player profile
- `PUT /api/players/:id` - Update player
- `GET /api/analytics/dashboard` - Analytics data

## Usage Examples

### Using DocumentUpload
```jsx
import DocumentUpload from '@/components/features/admin/DocumentUpload';

function MyComponent() {
  const handleUploadComplete = (result) => {
    console.log('Upload completed:', result);
  };

  return (
    <DocumentUpload 
      onUploadComplete={handleUploadComplete}
      acceptedFileTypes={['image/*', 'application/pdf']}
    />
  );
}
```

### Using PlayerProfile
```jsx
import PlayerProfile from '@/components/features/player/PlayerProfile';

function PlayerPage() {
  return (
    <PlayerProfile 
      playerId="player-123"
      isEditable={true}
    />
  );
}
```

### Using AdminLayout
```jsx
import AdminLayout from '@/components/layout/AdminLayout';

function AdminApp() {
  return <AdminLayout />;
}
```

## Styling

### Design System
The components use a consistent design system based on:
- **Colors**: Primary blue, success green, destructive red, muted grays
- **Typography**: Inter font family with consistent sizing
- **Spacing**: Tailwind's spacing scale
- **Borders**: Consistent border radius and colors

### Responsive Design
All components are responsive and work on:
- Mobile devices (sm: 640px+)
- Tablets (md: 768px+)
- Desktops (lg: 1024px+)
- Large screens (xl: 1280px+)

## Development

### Adding New Components

1. Create component in appropriate feature directory
2. Follow the existing naming convention
3. Use shadcn/ui components where possible
4. Implement proper error handling
5. Add loading states
6. Include TypeScript-style prop validation

### Testing Components

Components can be tested using the `ComponentShowcase`:
```jsx
import ComponentShowcase from '@/pages/ComponentShowcase';

// Displays all components in an interactive demo
```

## Dependencies

### Core Dependencies
- `react` - React framework
- `react-dom` - DOM rendering
- `lucide-react` - Icons
- `class-variance-authority` - Component variants
- `clsx` - Conditional classes
- `tailwind-merge` - Tailwind class merging

### Additional Dependencies
- `react-dropzone` - File upload functionality
- `@radix-ui/*` - UI primitives (via shadcn/ui)

## Future Enhancements

1. **Chart Integration**: Add Chart.js or Recharts for data visualization
2. **Real-time Updates**: WebSocket integration for live data
3. **Internationalization**: i18n support for multiple languages
4. **Dark Mode**: Complete dark mode implementation
5. **Accessibility**: Enhanced ARIA support and keyboard navigation
6. **Testing**: Unit and integration tests with Jest/React Testing Library

## Configuration

### components.json
The shadcn/ui configuration:
```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/App.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

This setup provides a solid foundation for building scalable, maintainable React components for the AthletiQ platform.
