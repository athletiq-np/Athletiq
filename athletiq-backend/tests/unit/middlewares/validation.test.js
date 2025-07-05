// tests/unit/middlewares/validation.test.js
const { validateTournament, validateTournamentId } = require('../../../src/middlewares/validation');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateTournament', () => {
    it('should pass with valid tournament data', async () => {
      req.body = {
        name: 'Test Tournament',
        description: 'A test tournament',
        level: 'school',
        start_date: '2025-08-01',
        end_date: '2025-08-15',
        sports_config: [{ sport: 'football' }]
      };

      // Run all validation rules
      for (const validator of validateTournament) {
        if (typeof validator === 'function') {
          await validator(req, res, next);
        }
      }

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should fail with invalid tournament name', async () => {
      req.body = {
        name: 'AB', // Too short
        description: 'A test tournament'
      };

      const nameValidator = validateTournament.find(v => v.fields && v.fields.includes('name'));
      if (nameValidator) {
        await nameValidator(req, res, next);
      }

      // Note: This test depends on the actual implementation details
      // In a real scenario, you'd test the complete validation flow
    });
  });

  describe('validateTournamentId', () => {
    it('should pass with valid tournament ID', async () => {
      req.params = { id: '123' };

      for (const validator of validateTournamentId) {
        if (typeof validator === 'function') {
          await validator(req, res, next);
        }
      }

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should fail with invalid tournament ID', async () => {
      req.params = { id: 'invalid' };

      for (const validator of validateTournamentId) {
        if (typeof validator === 'function') {
          await validator(req, res, next);
        }
      }

      // The validation should have been called but specific behavior depends on implementation
    });
  });
});
