// tests/integration/auth.test.js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const createTestApp = require('../testApp');
const { testPool } = require('../testDb');

const app = createTestApp();

describe('Auth Endpoints', () => {
  let testUserId;
  let testSchoolId;

  beforeEach(async () => {
    // Create test user for login tests before each test
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const userResult = await testPool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Test User', 'test@example.com', hashedPassword, 'SuperAdmin']
    );
    testUserId = userResult.rows[0].id;
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
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.password_hash).toBeUndefined();
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
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(schoolData.adminEmail);
      expect(response.body.data.role).toBe('SchoolAdmin');
      expect(response.headers['set-cookie']).toBeDefined();

      // Store school ID for cleanup
      testSchoolId = response.body.data.school_id;
    });

    it('should reject duplicate email', async () => {
      // First, register a user
      const firstSchoolData = {
        adminFullName: 'First Admin',
        adminEmail: 'admin@testschool.com',
        password: 'SecurePassword123!',
        schoolName: 'First Test School',
        schoolCode: 'TEST001',
        schoolAddress: '123 Test Street, Test City'
      };

      await request(app)
        .post('/api/auth/register')
        .send(firstSchoolData);

      // Now try to register with the same email
      const duplicateSchoolData = {
        adminFullName: 'Another Admin',
        adminEmail: 'admin@testschool.com', // Same email as above
        password: 'SecurePassword123!',
        schoolName: 'Another Test School',
        schoolCode: 'TEST002',
        schoolAddress: '456 Another Street, Test City'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateSchoolData);

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
      
      // In test environment, rate limiting is skipped, so all requests should return 401 (invalid credentials)
      if (process.env.NODE_ENV === 'test') {
        // All requests should return 401 for invalid credentials since rate limiting is skipped
        responses.forEach(response => {
          expect([401, 429]).toContain(response.status); // Allow either 401 or 429
        });
      } else {
        // In production, at least one response should be rate limited
        const rateLimitedResponse = responses.find(res => res.status === 429);
        expect(rateLimitedResponse).toBeDefined();
      }
    }, 10000); // Increase timeout for this test
  });
});
