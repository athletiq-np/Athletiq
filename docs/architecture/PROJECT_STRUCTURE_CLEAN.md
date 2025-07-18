# Athletiq Project Structure - Clean Organization

## 📁 Root Directory Structure

```
e:\Athletiq/
├── 📂 athletiq-backend/          # Backend API Server
├── 📂 athletiq-frontend/         # Frontend Applications
├── 📂 docs/                      # All Documentation
│   ├── 📂 status-reports/        # Project status and completion reports
│   ├── 📂 guides/                # Deployment and integration guides
│   └── 📂 architecture/          # Technical architecture docs
├── 📂 logs/                      # Application logs (runtime only)
├── 📂 node_modules/              # Root dev dependencies
├── 📂 production/                # Production deployment configs
├── 📂 scripts/                   # Root-level utility scripts
├── 📂 src/                       # Legacy Nepal athlete system
├── 📂 tests/                     # Integration and demo tests
├── 📂 uploads/                   # File uploads (runtime only)
├── 📄 .gitignore                 # Git ignore configuration
├── 📄 .vscode/                   # VS Code workspace settings
├── 📄 Athletiq.code-workspace    # VS Code workspace file
├── 📄 package.json               # Root dev dependencies
└── 📄 README.md                  # Main project documentation
```

## 🏗️ Backend Structure (athletiq-backend/)

```
athletiq-backend/
├── 📂 src/                       # Source code
│   ├── 📂 config/                # Configuration files
│   ├── 📂 controllers/           # Route controllers
│   ├── 📂 database/              # Database configuration
│   │   └── 📂 migrations/        # ALL database migrations (consolidated)
│   ├── 📂 middlewares/           # Custom middleware
│   ├── 📂 models/                # Data models
│   ├── 📂 monitoring/            # Performance monitoring
│   ├── 📂 routes/                # API routes (organized)
│   │   ├── 📂 core/              # Core routes (auth, health, monitoring)
│   │   ├── 📂 features/          # Feature-specific routes (guardian, etc.)
│   │   ├── 📂 legacy/            # Legacy/deprecated routes
│   │   └── 📂 v2/                # API v2 routes
│   ├── 📂 services/              # Business logic services
│   └── 📂 utils/                 # Utility functions
├── 📂 scripts/                   # Development and migration scripts
│   ├── 📂 migrations/            # Migration runner scripts
│   ├── 📂 servers/               # Alternative server configurations
│   ├── 📂 tests/                 # Test and debug scripts
│   └── 📂 utilities/             # Database check and utility scripts
├── 📂 tests/                     # Unit and integration tests
├── 📂 uploads/                   # File upload storage
├── 📄 server.js                  # Main server entry point
├── 📄 package.json               # Backend dependencies
└── 📄 .env                       # Environment configuration
```

## 🎨 Frontend Structure (athletiq-frontend/)

```
athletiq-frontend/
├── 📂 athletiq-web/              # Web application (React)
│   ├── 📂 src/                   # React source code
│   │   ├── 📂 components/        # Reusable components
│   │   ├── 📂 pages/             # Page components
│   │   │   └── 📂 guardian/      # Guardian portal pages
│   │   ├── 📂 api/               # API client configuration
│   │   └── 📂 utils/             # Frontend utilities
│   ├── 📂 public/                # Static assets
│   ├── 📄 package.json           # Frontend dependencies
│   └── 📄 .env                   # Frontend environment
└── 📂 athletiq-mobile/           # Mobile application (future)
```

## 🗃️ Routes Organization

### Core Routes (`src/routes/core/`)
- **authRoutes.js** - Authentication and authorization
- **health.js** - Health checks and monitoring
- **monitoring.js** - Performance monitoring endpoints

### Feature Routes (`src/routes/features/`)
- **guardianSimpleRoutes.js** - Main guardian portal (with birth certificate OCR)
- **guardianRoutes.js** - Enhanced guardian functionality
- **guardianAuthRoutes.js** - Guardian-specific authentication

### Main Routes (`src/routes/`)
- **athleteRoutes.js** - Athlete management
- **schoolRoutes.js** - School administration
- **tournamentRoutes.js** - Tournament management
- **certificateRoutes.js** - Certificate generation
- **documentRoutes.js** - Document processing
- **pdfRoutes.js** - PDF generation
- **scoresheetRoutes.js** - Scoresheet management
- **testRoutes.js** - Development testing

### Legacy Routes (`src/routes/legacy/`)
- **phase1AthleteRoutes.js** - Phase 1 athlete functionality
- **enhancedAthleteRoutes.js** - Enhanced athlete features
- **enhancedSchoolRoutes.js** - Enhanced school features

## 🛠️ Scripts Organization

### Migration Scripts (`scripts/migrations/`)
- Database migration runners
- Schema update scripts
- Data migration utilities

### Utility Scripts (`scripts/utilities/`)
- Database check scripts
- Data validation tools
- Performance analysis scripts

### Test Scripts (`scripts/tests/`)
- API testing scripts
- Authentication tests
- Integration test runners

### Server Scripts (`scripts/servers/`)
- Alternative server configurations
- Development server variants
- Testing server setups

## 📊 Database Migrations

All database migrations are consolidated in `src/database/migrations/` with sequential numbering:

- **003_** - Schema fixes and enhancements
- **008_** - Foreign key additions
- **009_** - Tournament enhancements
- **010_** - Performance optimizations
- **011_** - Advanced tournament management
- **012_** - Teams management system
- **013_** - Comprehensive player fields
- **014_** - Athlete ID updates
- **015_** - Nepal athlete ID format
- **020_** - Guardian system integration
- **Additional** - Birth certificate fields, guardian system

## 🔧 Key Features by Directory

### Guardian Portal System (`features/`)
- Complete guardian registration and authentication
- Birth certificate OCR with field matching
- Athlete profile management with auto-population
- Document upload and verification workflows

### Core Infrastructure (`core/`)
- JWT authentication and authorization
- Health monitoring and performance tracking
- Request logging and error handling

### Legacy Systems (`legacy/`)
- Phase 1 athlete management (deprecated)
- Enhanced features (superseded by main routes)
- Backward compatibility routes

## 🧹 Cleanup Summary

### ✅ Removed:
- Duplicate server files
- Scattered test scripts
- Temporary debug files
- Redundant migration directories
- Unused check scripts
- Old documentation files

### ✅ Organized:
- Routes by functionality and maturity
- Scripts by purpose
- Documentation by type
- Migrations in single location
- Clear separation of concerns

### ✅ Consolidated:
- All database migrations
- Guardian portal features
- Core authentication systems
- Development utilities

This structure provides clear separation of concerns, easy maintenance, and scalable organization for future development.
