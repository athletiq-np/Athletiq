# 🏆 AthletiQ - Enterprise Tournament Management System

> **Enterprise-Grade Sports Tournament Management Platform for Schools & Organizations**

[![License: Private](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue.svg)](https://postgresql.org/)
[![Enterprise](https://img.shields.io/badge/Grade-Enterprise-gold.svg)](#)

## 🎯 Overview

AthletiQ is an enterprise-grade, full-stack tournament management system designed for schools and sports organizations. Built with modern technologies and enterprise best practices, it provides comprehensive tools for tournament creation, team management, bracket generation, real-time scoring, and digital certificate generation.

## ✨ Enterprise Features

### � **Enterprise Architecture**
- **Microservices-ready** backend with modular design
- **Enterprise security** with JWT authentication and role-based access
- **Real-time monitoring** and health checks
- **Scalable database** design with connection pooling
- **API-first approach** with comprehensive documentation

### 🛡️ **Security & Compliance**
- **Enterprise authentication** with secure cookie handling
- **Role-based access control** (SuperAdmin, SchoolAdmin, Staff)
- **Input validation** and sanitization at all layers
- **Rate limiting** and DDoS protection
- **CORS protection** with origin validation
- **SQL injection prevention** with parameterized queries

### 🏫 **Multi-Organization Management**
- **Multi-school support** with isolated data
- **School dashboards** with real-time analytics
- **Athlete/player management** with comprehensive profiles
- **House system integration** for intra-school competitions
- **Bulk operations** for efficient data management

### 🏆 **Advanced Tournament Management**
- **Multi-step creation wizard** with validation and auto-save
- **50+ sports supported** with custom rule configurations
- **Multiple tournament formats**: Knockout, Round Robin, Group Stage + Knockout
- **Real-time bracket generation** with automatic updates
- **Advanced scheduling** with venue and resource allocation
- **Live scoring** with real-time updates and notifications

### 📊 **Enterprise Analytics & Reporting**
- **Real-time dashboards** with live performance metrics
- **Advanced tournament statistics** and historical analysis
- **PDF scoresheet generation** for all supported sports
- **Digital certificate system** with custom branding
- **Export capabilities** (Excel, PDF, CSV)
- **Custom reporting** with data visualization

### 🇳🇵 **Nepal-Specific Features**
- **Nepal Athlete ID System** with government integration
- **Localized location database** with provinces and districts
- **Multi-language support** (English, Nepali)
- **Cultural sport categories** and traditional games support

## 🚀 Enterprise Quick Start

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm or yarn package manager
- Git for version control

### 🔧 Enterprise Backend Setup
```bash
cd athletiq-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Configure your enterprise database settings in .env

# Initialize enterprise configuration
npm run setup:enterprise

# Start with enterprise monitoring
npm start
```

### 🌐 Enterprise Frontend Setup
```bash
cd athletiq-frontend/athletiq-web

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Configure API endpoints and enterprise features

# Start development server
npm start
```

### 🗄️ Enterprise Database Setup
```bash
# Create PostgreSQL database
createdb athletiq_enterprise

# Run enterprise migrations
npm run migrate:enterprise

# Seed enterprise data
npm run seed:enterprise

# Verify database health
npm run db:health
```

## 🏗️ Enterprise Architecture

### Backend (Node.js/Express)
```
📁 athletiq-backend/
├── 📁 src/
│   ├── 📁 config/
│   │   ├── enterprise.js          # Enterprise configuration
│   │   ├── monitoring.js          # System monitoring
│   │   └── swagger.js             # API documentation
│   ├── 📁 controllers/            # Business logic (15+ controllers)
│   ├── 📁 middlewares/            # Security & validation
│   ├── 📁 routes/                 # API routes (25+ endpoints)
│   ├── 📁 services/               # Core business services
│   │   ├── 📁 ai/                # AI/OCR processing
│   │   ├── 📁 pdfGeneration/     # Document generation
│   │   └── 📁 queue/             # Background processing
│   └── 📁 utils/                  # Utility functions
├── 📁 tests/                      # Comprehensive test suite
│   ├── 📁 integration/           # Integration tests
│   ├── 📁 unit/                  # Unit tests
│   └── 📁 performance/           # Performance tests
└── 📁 migrations/                 # Database migrations
```

### Frontend (React 18.x)
```
📁 athletiq-frontend/athletiq-web/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 features/          # Feature components
│   │   ├── 📁 layout/            # Layout components
│   │   └── 📁 ui/                # Reusable UI components
│   ├── 📁 pages/                 # Page components
│   │   ├── 📁 admin/             # Admin pages
│   │   ├── 📁 school/            # School pages
│   │   └── 📁 athlete/           # Athlete pages
│   ├── 📁 hooks/                 # Custom React hooks
│   │   ├── useTournamentCreation.js  # Tournament management
│   │   └── useApiHealthMonitor.js    # System monitoring
│   ├── 📁 api/                   # API integration
│   │   ├── enterpriseTournamentApi.js # Tournament API
│   │   └── apiClient.js          # HTTP client
│   └── 📁 services/              # Business logic services
```

## 🛠️ Enterprise Technology Stack

### Backend Technologies
- **Runtime**: Node.js 18.x with enterprise features
- **Framework**: Express.js with security middleware
- **Database**: PostgreSQL 14.x with connection pooling
- **Authentication**: JWT with secure HTTP-only cookies
- **File Processing**: Multer with enterprise validation
- **PDF Generation**: Puppeteer with custom templates
- **Documentation**: Swagger/OpenAPI 3.0
- **Monitoring**: Winston logging with metrics
- **Testing**: Jest with enterprise coverage

### Frontend Technologies
- **Framework**: React 18.x with concurrent features
- **Routing**: React Router v6 with protected routes
- **State Management**: Context API + Enterprise hooks
- **UI Framework**: Tailwind CSS with custom design system
- **Animations**: Framer Motion with enterprise themes
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors and retry logic
- **Testing**: React Testing Library with enterprise scenarios

### Enterprise DevOps
- **Process Management**: PM2 with cluster mode
- **Reverse Proxy**: Nginx with SSL termination
- **Database**: PostgreSQL with replication
- **Monitoring**: Enterprise monitoring stack
- **Logging**: Centralized logging with rotation
- **Backup**: Automated database backup system

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=athletiq
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=10000

# Environment
REACT_APP_NODE_ENV=development
```

## 🎮 Usage

### For School Administrators
1. **Login** with your school admin credentials
2. **Create tournaments** using the multi-step wizard
3. **Register teams** and manage player rosters
4. **Monitor progress** through real-time dashboards
5. **Generate certificates** for winners

### For System Administrators
1. **Manage multiple schools** from the superadmin dashboard
2. **Create system-wide tournaments** and competitions
3. **Monitor system performance** and analytics
4. **Manage user accounts** and permissions

## 🔐 Authentication & Security

### Default Test Credentials
```bash
# SuperAdmin
Email: admin@test.com
Password: password123

# School Admin (if seeded)
Email: school@test.com
Password: password123
```

### Security Features
- JWT-based authentication with HttpOnly cookies
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting and request throttling
- CORS protection
- SQL injection prevention

## � API Documentation

The API follows RESTful conventions with the following main endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Schools
- `GET /api/schools/me` - Get school profile
- `PUT /api/schools/me` - Update school profile
- `GET /api/schools/me/athletes` - Get school athletes

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament details
- `PUT /api/tournaments/:id` - Update tournament

## 🧪 Testing

### Backend Tests
```bash
cd athletiq-backend
npm test
```

### Frontend Tests
```bash
cd athletiq-frontend/athletiq-web
npm test
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[System Architecture](docs/SYSTEM_ARCHITECTURE.md)** - Technical overview
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Development setup and guidelines
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[User Manual](docs/USER_MANUAL.md)** - End-user documentation

## 🚀 Deployment

### Development
```bash
# Start both backend and frontend in development mode
npm run dev
```

### Production
```bash
# Build frontend
cd athletiq-frontend/athletiq-web
npm run build

# Start backend with PM2
cd athletiq-backend
pm2 start ecosystem.config.js
```

## � Recent Updates (v2.0.0)

- ✅ **Multi-step tournament creation wizard** with template support
- ✅ **Enhanced authentication system** with JWT cookies
- ✅ **Real-time dashboards** with comprehensive analytics
- ✅ **PDF generation system** for scoresheets and certificates
- ✅ **50+ sports support** with custom configurations
- ✅ **Performance optimizations** and caching
- ✅ **Security enhancements** and input validation
- ✅ **Responsive design** for mobile and desktop

## 🤝 Contributing

This is a private project. For development team members:

1. Create feature branches from `main`
2. Follow the coding standards in the style guide
3. Write tests for new features
4. Submit pull requests for review

## 📞 Support

For technical support or questions:
- **Development Team**: Internal Slack channel
- **Documentation**: Check the `docs/` folder
- **Issues**: Use the internal issue tracking system

## 📄 License

Private - AthletiQ Sports Management System  
© 2025 AthletiQ. All rights reserved.

---

**Built with ❤️ for the sports community**
