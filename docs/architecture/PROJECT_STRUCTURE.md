# 🏗️ AthletiQ Project Structure

## 📁 Root Directory Organization

```
📁 AthletiQ/
├── 📁 athletiq-backend/              # Node.js/Express API Server
├── 📁 athletiq-frontend/             # React Web Application  
├── 📁 docs/                          # Documentation
│   ├── 📁 archive/                   # Historical documentation
│   ├── 📁 frontend/                  # Frontend-specific docs
│   └── 📁 deployment/                # Deployment guides
├── 📁 scripts/                       # Utility scripts
├── 📁 tests/                         # Test files
│   ├── 📁 integration/               # Integration tests
│   └── 📁 demos/                     # Demo scripts
├── 📁 src/                           # Shared source code
│   └── 📁 nepal-athlete-system/      # Nepal-specific features
├── 📁 production/                    # Production deployment
├── 📁 logs/                          # Application logs
└── 📁 uploads/                       # File uploads
```

## 🗂️ File Organization Rules

### ✅ Clean Structure
- **Root Level**: Only essential config files and main README
- **Tests**: Organized by type (integration, unit, demos)
- **Scripts**: All utility scripts in dedicated folder
- **Documentation**: Structured with current docs accessible, archive for history

### ❌ Avoid
- Scattered test files in root
- Mixed demo and production code
- Duplicate documentation
- Temporary files in main directories

## 📋 Directory Purposes

| Directory | Purpose | Contents |
|-----------|---------|----------|
| `/athletiq-backend/` | API Server | Controllers, routes, services, database |
| `/athletiq-frontend/` | Web Client | React components, pages, assets |
| `/scripts/` | Utilities | Database checks, verification scripts |
| `/tests/` | Testing | Integration tests, demos, validation |
| `/docs/` | Documentation | Current docs, guides, archives |
| `/production/` | Deployment | Production configs, scripts |

## 🔄 Maintenance

- **Weekly**: Review and clean temporary files
- **Monthly**: Archive completed documentation
- **Release**: Update structure documentation
