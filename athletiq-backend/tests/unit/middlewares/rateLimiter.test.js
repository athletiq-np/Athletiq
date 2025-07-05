// tests/unit/middlewares/rateLimiter.test.js
const { generalLimiter, authLimiter, adminLimiter } = require('../../../src/middlewares/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      headers: {},
      method: 'GET',
      url: '/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn()
    };
    next = jest.fn();
  });

  describe('generalLimiter', () => {
    it('should allow requests within limit', async () => {
      await generalLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should set rate limit headers', async () => {
      await generalLimiter(req, res, next);
      expect(res.set).toHaveBeenCalled();
    });
  });

  describe('authLimiter', () => {
    it('should allow auth requests within limit', async () => {
      await authLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('adminLimiter', () => {
    it('should allow admin requests within limit', async () => {
      await adminLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
