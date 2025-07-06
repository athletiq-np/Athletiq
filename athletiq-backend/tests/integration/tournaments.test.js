// tests/integration/tournaments.test.js
const request = require('supertest');
const createTestApp = require('../testApp');
const { testPool } = require('../setup');

// Mock data for testing
const mockTournament = {
  name: 'Test Tournament',
  description: 'A test tournament',
  sport: 'football',
  tournament_type: 'school',
  format: 'knockout',
  location: 'Test Location',
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
  let app;

  beforeEach(async () => {
    // Create test app
    app = createTestApp();
    
    // Create a test user and get auth token
    const hashedPassword = await require('bcryptjs').hash(mockUser.password, 10);
    const userResult = await testPool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [mockUser.email, hashedPassword, mockUser.full_name, mockUser.role]
    );
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: mockUser.password });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
    }
    
    // Extract token from cookie
    const cookies = loginResponse.headers['set-cookie'];
    const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
    authToken = tokenCookie.split(';')[0].split('=')[1];
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
      expect(response.body.data.tournament_id).toBeDefined();
      
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
      // First create a tournament
      const createResponse = await request(app)
        .post('/api/tournaments')
        .set('Cookie', `token=${authToken}`)
        .send(mockTournament);

      const createdTournamentId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app)
        .get(`/api/tournaments/${createdTournamentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdTournamentId);
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
