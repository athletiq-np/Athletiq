# 🏆 Athletiq - Comprehensive Tournament Management System

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)](https://github.com/athletiq-np/Athletiq)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/athletiq-np/Athletiq)
[![Node.js](https://img.shields.io/badge/node.js-22.16.0-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.0+-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-13+-blue)](https://postgresql.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Frontend Components](#frontend-components)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**Athletiq** is a comprehensive, full-stack tournament management system designed specifically for educational institutions, sports organizations, and tournament organizers. Built with modern web technologies, it provides end-to-end tournament lifecycle management from creation to completion.

### Key Capabilities
- **Multi-Sport Tournament Support**: Handle 40+ different sports with sport-specific configurations
- **Advanced Bracket Management**: Automated bracket generation with multiple tournament formats
- **School Management**: Complete school administration with role-based access control
- **Real-time Updates**: Live tournament tracking and results management
- **Certificate Generation**: Automated PDF certificate creation and distribution
- **Comprehensive Analytics**: Tournament statistics and performance insights

## ✨ Features

### 🏫 School Management
- **Multi-school Support**: Manage multiple educational institutions
- **Role-based Access**: SuperAdmin, SchoolAdmin, and Teacher roles
- **Student/Athlete Management**: Complete athlete profiles and registration
- **Team Organization**: Create and manage sports teams with positions
- **House System**: Traditional school house management and competitions

### 🏆 Tournament Management
- **Multi-step Tournament Creation**: Comprehensive 4-step tournament wizard
  - Tournament Information & Settings
  - Sports Selection & Configuration  
  - Advanced Configuration & Bracket Setup
  - Review & Final Creation
- **40+ Sports Supported**: From traditional sports to emerging categories
- **Flexible Tournament Formats**:
  - Single/Double Elimination
  - Round Robin
  - Group Stage + Knockout
  - Custom Heat-based Competitions
- **Advanced Scheduling**: Automated fixture generation and venue management
- **Real-time Bracket Updates**: Live tournament progression tracking

### 📊 Analytics & Reporting
- **Tournament Statistics**: Comprehensive performance analytics
- **Certificate System**: Automated PDF generation for winners
- **Export Capabilities**: Excel/CSV exports for all data
- **Performance Tracking**: Individual and team performance metrics
- **Historical Data**: Complete tournament history and trends

### 🔐 Authentication & Security
- **JWT-based Authentication**: Secure token-based authentication
- **Cookie Management**: HttpOnly secure cookies for enhanced security
- **Role-based Authorization**: Granular permissions system
- **Input Validation**: Comprehensive server-side validation
- **Rate Limiting**: API protection against abuse

### 🎨 Modern User Interface
- **Responsive Design**: Mobile-first responsive interface
- **Modern Animations**: Smooth transitions with Framer Motion
- **Intuitive Navigation**: Tab-based dashboard system
- **Real-time Feedback**: Toast notifications and loading states
- **Accessibility**: WCAG compliant interface design

## 🏗️ Architecture

### Backend (Node.js/Express)
```
athletiq-backend/
├── src/
│   ├── controllers/        # Business logic controllers
│   ├── routes/            # API route definitions
│   ├── middlewares/       # Authentication, validation, security
│   ├── models/           # Database models (if using ORM)
│   ├── services/         # Business logic services
│   ├── utils/            # Helper utilities
│   └── config/           # Configuration files
├── uploads/              # File upload storage
├── server.js            # Main server entry point
└── package.json         # Dependencies and scripts
```

### Frontend (React)
```
athletiq-frontend/athletiq-web/src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── features/        # Feature-specific components
│   ├── dashboard/       # Dashboard components
│   └── admin/          # Admin-specific components
├── pages/              # Route-based page components
├── hooks/              # Custom React hooks
├── utils/              # Frontend utilities
├── styles/             # Global styles and themes
└── api/                # API client configuration
```

### Database (PostgreSQL)
- **50+ Tables**: Comprehensive relational database schema
- **Optimized Queries**: Indexed for performance
- **Data Integrity**: Foreign key constraints and validation
- **Audit Trails**: Complete change tracking for tournaments

## 🚀 Installation

### Prerequisites
- **Node.js** 18.0+ (recommended: 22.16.0)
- **PostgreSQL** 13+
- **npm** or **yarn**
- **Git**

### Quick Start

#### Backend Setup
```bash
cd athletiq-backend
npm install
cp .env.example .env
# Edit .env with your database configuration
npm start

```

#### Frontend Setup
```bash
cd athletiq-frontend/athletiq-web
npm install
npm start
```

### Default Test Credentials
- **Email**: `admin@test.com`
- **Password**: `password123`

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```properties
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=athletiq
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📡 API Documentation

### Authentication Endpoints
```bash
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
GET  /api/auth/me            # Get current user
```

### School Management
```bash
GET    /api/schools/me                 # Get current user's school
PATCH  /api/schools/me                 # Update school profile
GET    /api/schools/me/athletes        # Get school athletes
GET    /api/schools/me/teams          # Get school teams
GET    /api/schools/me/tournaments    # Get school tournaments
```

### Tournament Management
```bash
GET    /api/tournaments               # Get all tournaments
POST   /api/tournaments              # Create tournament
GET    /api/tournaments/:id          # Get tournament details
PATCH  /api/tournaments/:id          # Update tournament
GET    /api/tournaments/:id/bracket  # Get tournament bracket
```

## 🗄️ Database Schema

### Core Tables
- **users**: User authentication and profiles
- **schools**: Educational institution management
- **tournaments**: Tournament configuration and management
- **athletes**: Student/athlete profiles
- **teams**: Team organization and management
- **tournament_teams**: Tournament registrations
- **matches**: Match scheduling and results

## 🎨 Frontend Components

### Dashboard System
- **SuperAdminDashboard**: System-wide administration
- **SchoolAdminDashboard**: School-specific management
- **TournamentsTab**: Tournament management interface
- **AthletesTab**: Athlete management interface

### Tournament Creation Wizard
- **TournamentCreate**: Main wizard coordinator (4 steps)
- **TournamentInfoStep**: Basic tournament information
- **TournamentSportsStep**: Sports selection with drag-and-drop
- **TournamentConfigStep**: Advanced configuration
- **TournamentReviewStep**: Final review and submission

## 🚀 Current Status

### ✅ Completed Features
- **Authentication System**: JWT-based with role management
- **School Management**: Complete CRUD operations
- **Tournament Creation**: 4-step wizard with 40+ sports
- **Athlete Management**: Registration and team assignment
- **Database Integration**: PostgreSQL with 50+ tables
- **Modern UI**: Responsive design with animations
- **API Security**: Rate limiting and input validation

### 🔧 Technical Stack
- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React 18, Tailwind CSS, Framer Motion
- **Authentication**: JWT with HttpOnly cookies
- **Database**: PostgreSQL with connection pooling
- **Deployment**: Production-ready configuration

## 📁 Project Structure

```
📁 Athletiq/
├── 📁 athletiq-backend/     # Node.js/Express API server
│   ├── src/                 # Source code
│   │   ├── controllers/     # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middlewares/    # Authentication & validation
│   │   └── config/         # Configuration files
│   ├── uploads/            # File storage
│   └── server.js           # Main entry point
├── 📁 athletiq-frontend/   # React web application
│   └── athletiq-web/src/   # Frontend source
│       ├── components/     # UI components
│       ├── pages/         # Route pages
│       └── utils/         # Helper functions
├── 📁 docs/               # Documentation
├── 📁 production/         # Deployment files
└── README.md              # This file
```

## 🧪 Testing

### Backend Testing
```bash
cd athletiq-backend
npm test
```

### Frontend Testing
```bash
cd athletiq-frontend/athletiq-web
npm test
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/athletiq-np/Athletiq/issues)
- **Email**: support@athletiq.com

---

**Built with ❤️ for the global sports community**

Last Updated: July 16, 2025
Version: 1.0.0
