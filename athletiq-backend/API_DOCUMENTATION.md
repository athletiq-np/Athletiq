# Athletiq Backend API

A comprehensive sports tournament management system backend built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Security**: Rate limiting, input validation, sanitization, and security headers
- **Database**: PostgreSQL with connection pooling and migrations
- **API Documentation**: Swagger/OpenAPI 3.0 documentation
- **Testing**: Unit and integration tests with Jest and Supertest
- **Logging**: Structured logging with Winston
- **Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Centralized error handling with proper HTTP status codes

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd athletiq-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=athletiq
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_MAX_CONNECTIONS=20

   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_here
   JWT_EXPIRES_IN=7d

   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # API Keys (optional)
   OPENAI_API_KEY=your_openai_api_key_for_ocr
   ```

4. **Set up the database**
   ```bash
   # Create the database
   createdb athletiq

   # Run migrations
   npm run migrate
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🗄️ Database Setup

The application uses PostgreSQL with an automated migration system.

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Verify database structure
npm run migrate:verify
```

### Database Schema

The application includes the following main tables:
- `users` - User accounts (SuperAdmin, SchoolAdmin, etc.)
- `schools` - School information
- `tournaments` - Tournament data
- `players` - Player profiles
- `matches` - Tournament matches
- `teams` - Team information

## 🔐 Authentication

The API uses JWT tokens stored in HTTP-only cookies for authentication.

### User Roles

- **SuperAdmin**: Full system access
- **SchoolAdmin**: School-specific access
- **TournamentAdmin**: Tournament-specific access

### Protected Routes

Most routes require authentication. Use the `/api/auth/login` endpoint to obtain a token.

## 📚 API Documentation

Interactive API documentation is available at:
- **Development**: `http://localhost:5000/api-docs`
- **Production**: `https://your-domain.com/api-docs`

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new school and admin
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

#### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create tournament (Protected)
- `GET /api/tournaments/:id` - Get tournament by ID

#### Schools
- `POST /api/schools/register` - Register new school
- `GET /api/schools` - Get all schools (SuperAdmin only)
- `GET /api/schools/me` - Get current school profile (SchoolAdmin)

#### Players
- `POST /api/players/register` - Register new player (Protected)

#### Health
- `GET /api/health` - Health check

## 🧪 Testing

The application includes comprehensive test coverage:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Structure

```
tests/
├── setup.js                 # Test setup and configuration
├── unit/                    # Unit tests
│   ├── utils/              # Utility function tests
│   └── middlewares/        # Middleware tests
└── integration/            # Integration tests
    ├── auth.test.js        # Authentication tests
    ├── tournaments.test.js # Tournament tests
    └── health.test.js      # Health check tests
```

## 🔒 Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Admin endpoints: 20 requests per 15 minutes

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection
- XSS prevention
- CSRF protection

### Security Headers
- Helmet.js for security headers
- CORS configuration
- HTTP-only cookies for tokens

## 📝 Logging

The application uses Winston for structured logging:

```javascript
// Log levels: error, warn, info, debug
logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: error.message });
```

Logs are written to:
- Console (development)
- Files (production)
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   DB_PASSWORD=your_secure_db_password
   JWT_SECRET=your_production_jwt_secret
   ```

2. **Build and Deploy**
   ```bash
   # Install production dependencies
   npm ci --only=production

   # Run migrations
   npm run migrate

   # Start the server
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring

### Health Checks

The API includes health check endpoints for monitoring:
- `GET /api/health` - Basic health status
- Includes uptime, environment, and version information

### Logging

All requests are logged with:
- Request method and URL
- Response status and time
- User information (if authenticated)
- Error details (if applicable)

## 🔧 Development

### Code Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middlewares/      # Express middlewares
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── database/        # Database migrations
```

### Development Commands

```bash
# Start development server with auto-restart
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run database migrations
npm run migrate

# Check migration status
npm run migrate:status
```

### Adding New Features

1. **Create route**: Add new route in `src/routes/`
2. **Add controller**: Create controller in `src/controllers/`
3. **Add validation**: Add validation rules in `src/middlewares/validation.js`
4. **Add tests**: Create tests in `tests/`
5. **Update documentation**: Add Swagger documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint for code linting
- Follow conventional commit messages
- Write tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api-docs`
- Review the test files for usage examples

## 🏗️ Architecture

### Request Flow

```
Client Request
    ↓
Security Middleware (Helmet, CORS)
    ↓
Rate Limiting
    ↓
Request Logging
    ↓
Body Parsing & Sanitization
    ↓
Authentication (if required)
    ↓
Validation
    ↓
Controller Logic
    ↓
Database Operations
    ↓
Response Formatting
    ↓
Error Handling (if needed)
    ↓
Client Response
```

### Database Design

The database follows a normalized structure with proper relationships:
- Users have roles and can be associated with schools
- Schools have administrators and can host tournaments
- Tournaments have matches and participants
- Players belong to schools and participate in tournaments

## 📈 Performance

### Database Optimization
- Connection pooling for efficient database connections
- Indexed queries for fast lookups
- Proper foreign key relationships

### Caching Strategy
- HTTP caching headers for static resources
- Database query optimization
- Rate limiting to prevent abuse

### Memory Management
- Proper connection cleanup
- Limited file upload sizes
- Efficient JSON parsing
