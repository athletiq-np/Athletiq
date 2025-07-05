// tests/integration/health.test.js
const request = require('supertest');
const app = require('../../server');

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Health check passed');
      expect(response.body.data.status).toBe('OK');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.version).toBeDefined();
    });

    it('should respond within reasonable time', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/health');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500); // Should respond within 500ms
    });
  });
});
