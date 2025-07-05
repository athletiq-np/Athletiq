// tests/integration/auth.test.js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../../src/config/db');

// Import app
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('../../src/middlewares/errorHandler');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', require('../../src/routes/authRoutes'));
app.use(errorHandler);

describe('Auth Endpoints', () => {
  let testUserId;
  let testSchoolId;

  beforeAll(async () => {
    // Create test user for login tests
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Test User', 'test@example.com', hashedPassword, 'SuperAdmin']
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    if (testSchoolId) {
      await pool.query('DELETE FROM schools WHERE id = $1', [testSchoolId]);
    }
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.password_hash).toBeUndefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new school admin with valid data', async () => {
      const schoolData = {
        adminFullName: 'Test Admin',
        adminEmail: 'admin@testschool.com',
        password: 'SecurePassword123!',
        schoolName: 'Test School',
        schoolCode: 'TEST001',
        schoolAddress: '123 Test Street, Test City'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(schoolData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(schoolData.adminEmail);
      expect(response.body.user.role).toBe('SchoolAdmin');
      expect(response.headers['set-cookie']).toBeDefined();

      // Store school ID for cleanup
      testSchoolId = response.body.user.school_id;
    });

    it('should reject duplicate email', async () => {
      const schoolData = {
        adminFullName: 'Another Admin',
        adminEmail: 'admin@testschool.com', // Same email as above
        password: 'SecurePassword123!',
        schoolName: 'Another Test School',
        schoolCode: 'TEST002',
        schoolAddress: '456 Another Street, Test City'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(schoolData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate password strength', async () => {
      const schoolData = {
        adminFullName: 'Test Admin',
        adminEmail: 'weak@testschool.com',
        password: 'weak', // Weak password
        schoolName: 'Test School',
        schoolCode: 'TEST003',
        schoolAddress: '123 Test Street, Test City'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(schoolData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        adminFullName: 'Test Admin',
        adminEmail: 'incomplete@testschool.com'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(6).fill().map(() => 
        request(app).post('/api/auth/login').send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // At least one response should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    }, 10000); // Increase timeout for this test
  });
});
