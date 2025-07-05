// tests/integration/tournaments.test.js
const request = require('supertest');
const app = require('../../server');
const pool = require('../../src/config/db');

// Mock data for testing
const mockTournament = {
  name: 'Test Tournament',
  description: 'A test tournament',
  level: 'school',
  start_date: '2025-08-01',
  end_date: '2025-08-15',
  sports_config: [{ sport: 'football', categories: ['U12', 'U16'] }]
};

const mockUser = {
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  role: 'SchoolAdmin'
};

describe('Tournament API', () => {
  let authToken;
  let tournamentId;

  beforeAll(async () => {
    // Create a test user and get auth token
    const hashedPassword = await require('bcryptjs').hash(mockUser.password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [mockUser.email, hashedPassword, mockUser.full_name, mockUser.role]
    );
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: mockUser.password });
    
    authToken = loginResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tournaments WHERE name = $1', [mockTournament.name]);
    await pool.query('DELETE FROM users WHERE email = $1', [mockUser.email]);
  });

  describe('POST /api/tournaments', () => {
    it('should create a tournament with valid data', async () => {
      const response = await request(app)
        .post('/api/tournaments')
        .set('Cookie', `token=${authToken}`)
        .send(mockTournament);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(mockTournament.name);
      expect(response.body.data.tournament_code).toBeDefined();
      
      tournamentId = response.body.data.id;
    });

    it('should return 400 for invalid tournament data', async () => {
      const response = await request(app)
        .post('/api/tournaments')
        .set('Cookie', `token=${authToken}`)
        .send({ name: 'A' }); // Too short

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/tournaments')
        .send(mockTournament);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tournaments', () => {
    it('should get all tournaments', async () => {
      const response = await request(app)
        .get('/api/tournaments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/tournaments/:id', () => {
    it('should get a tournament by ID', async () => {
      const response = await request(app)
        .get(`/api/tournaments/${tournamentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(tournamentId);
    });

    it('should return 404 for non-existent tournament', async () => {
      const response = await request(app)
        .get('/api/tournaments/999999');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await request(app)
        .get('/api/tournaments/invalid');

      expect(response.status).toBe(400);
    });
  });
});
