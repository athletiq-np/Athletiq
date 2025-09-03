import { isTokenExpired, getTokenExpiration, getTokenRemainingTime } from '../tokenUtils';

// Helper function to create a test JWT token
const createTestToken = (expirationSeconds) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'test-user',
    exp: Math.floor(Date.now() / 1000) + expirationSeconds, // Current time + seconds
    iat: Math.floor(Date.now() / 1000)
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'test-signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

describe('tokenUtils', () => {
  describe('isTokenExpired', () => {
    test('should return true for null or undefined token', () => {
      expect(isTokenExpired(null)).toBe(true);
      expect(isTokenExpired(undefined)).toBe(true);
      expect(isTokenExpired('')).toBe(true);
    });

    test('should return true for invalid token format', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
      expect(isTokenExpired('header.payload')).toBe(true);
    });

    test('should return false for valid non-expired token', () => {
      const token = createTestToken(3600); // 1 hour from now
      expect(isTokenExpired(token)).toBe(false);
    });

    test('should return true for expired token', () => {
      const token = createTestToken(-3600); // 1 hour ago
      expect(isTokenExpired(token)).toBe(true);
    });

    test('should return true for token expiring within buffer time', () => {
      const token = createTestToken(200); // 200 seconds from now
      const bufferSeconds = 300; // 5 minutes buffer
      expect(isTokenExpired(token, bufferSeconds)).toBe(true);
    });

    test('should return false for token with no expiration claim', () => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { sub: 'test-user', iat: Math.floor(Date.now() / 1000) }; // No exp claim
      
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `${encodedHeader}.${encodedPayload}.signature`;
      
      expect(isTokenExpired(token)).toBe(false);
    });
  });

  describe('getTokenExpiration', () => {
    test('should return null for invalid tokens', () => {
      expect(getTokenExpiration(null)).toBe(null);
      expect(getTokenExpiration('invalid')).toBe(null);
    });

    test('should return correct expiration date for valid token', () => {
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;
      const token = createTestToken(3600);
      const expiration = getTokenExpiration(token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(Math.abs(expiration.getTime() - (expirationTime * 1000))).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('getTokenRemainingTime', () => {
    test('should return 0 for invalid tokens', () => {
      expect(getTokenRemainingTime(null)).toBe(0);
      expect(getTokenRemainingTime('invalid')).toBe(0);
    });

    test('should return correct remaining time for valid token', () => {
      const token = createTestToken(3600); // 1 hour
      const remainingTime = getTokenRemainingTime(token);
      
      expect(remainingTime).toBeGreaterThan(3590); // Should be close to 3600
      expect(remainingTime).toBeLessThanOrEqual(3600);
    });

    test('should return 0 for expired token', () => {
      const token = createTestToken(-3600); // Expired 1 hour ago
      expect(getTokenRemainingTime(token)).toBe(0);
    });
  });
});